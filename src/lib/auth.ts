import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { jwtDecode } from "jwt-decode";
import { JWT } from "next-auth/jwt";

/**
 * Helper to extract a specific cookie value from a Set-Cookie header.
 * Handles both string (single cookie) and array (multiple cookies) formats.
 */
function getCookieValue(cookieHeader: string | string[] | undefined | null, key: string): string | null {
  if (!cookieHeader) return null;

  const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];

  for (const cookie of cookies) {
    const parts = cookie.split(';');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith(`${key}=`)) {
        return trimmed.substring(key.length + 1);
      }
    }
  }
  return null;
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  console.log("Attempting to refresh access token with token:", token);
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });
    console.log("Refresh API response status:", response.status);

    const text = await response.text();
    console.log("Refresh API response text:", text);
    let refreshedTokens;
    try {
      refreshedTokens = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse refresh response", text);
      throw new Error(`Invalid JSON response: ${text}`);
    }

    if (!response.ok) {
      console.error(`Refresh failed with status ${response.status}:`, refreshedTokens);
      // Return a special error if the session is invalid
      if (refreshedTokens.error === "SESSION_INVALID") {
        return {
          ...token,
          error: "SESSION_INVALID",
        } as JWT;
      }
      throw refreshedTokens;
    }

    // Handle Token Rotation: Check if backend sent a new refresh token cookie
    // Note: fetch in Node (via Next.js) might put headers in a Headers object.
    // We try getSetCookie() if available (Node 18+ / Next 13+), else get("set-cookie")
    let newRefreshToken = token.refreshToken;
    const setCookieHeader = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : response.headers.get("set-cookie");
    console.log("Refresh API response 'set-cookie' header:", setCookieHeader);


    const rotatedRefreshToken = getCookieValue(setCookieHeader, "refreshToken");
    if (rotatedRefreshToken) {
      console.log("Extracted new rotated refresh token.");
      newRefreshToken = rotatedRefreshToken;
    } else {
      console.log("No new rotated refresh token found in 'set-cookie' header.");
    }

    const newTokens = {
      ...token,
      accessToken: refreshedTokens.accessToken,
      refreshToken: newRefreshToken,
    };
    console.log("Successfully refreshed tokens:", newTokens);
    return newTokens;
  } catch (error) {
    console.error("RefreshAccessTokenError", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        // Google OAuth fields — passed when signing in via Google
        idToken: { label: "Google ID Token", type: "text" },
        accountType: { label: "Account Type", type: "text" },
      },
      async authorize(credentials, req) {
        const isGoogleLogin = !!credentials?.idToken;

        console.log(
          isGoogleLogin
            ? `Authorize: Google login`
            : `Authorize: Credentials login for ${credentials?.email}`
        );

        // Validate required fields based on login type
        if (!isGoogleLogin && (!credentials?.email || !credentials?.password)) {
          throw new Error("Email and password are required");
        }
        if (isGoogleLogin && !credentials?.idToken) {
          throw new Error("Google ID token is required");
        }

        try {
          const userAgent = (req as any)?.headers?.["user-agent"] || "node";
          const xForwardedFor = (req as any)?.headers?.["x-forwarded-for"] || "";

          // Branch: Google login hits /auth/google, credentials login hits /auth/login
          const endpoint = isGoogleLogin ? "/auth/google" : "/auth/login";
          const body = isGoogleLogin
            ? {
              idToken: credentials!.idToken,
              ...(credentials!.accountType ? { accountType: credentials!.accountType } : {}),
            }
            : {
              email: credentials!.email,
              password: credentials!.password,
            };

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
              "Content-Type": "application/json",
              "User-Agent": userAgent,
              "X-Forwarded-For": xForwardedFor,
            },
          });
          console.log(`${endpoint} API response status:`, res.status);

          const data = await res.json();
          console.log(`${endpoint} API response data:`, data);

          if (!res.ok) {
            console.error(`${endpoint} failed:`, res.status, data);
            throw new Error(data?.message || "Authentication failed");
          }

          if (data?.accessToken && data?.user) {
            // Extract refreshToken from Set-Cookie header
            const setCookieHeader = typeof res.headers.getSetCookie === 'function'
              ? res.headers.getSetCookie()
              : res.headers.get("set-cookie");

            const refreshToken = getCookieValue(setCookieHeader, "refreshToken");

            const userPayload = {
              id: data.user.id,
              name: data.user.full_name || data.user.email,
              email: data.user.email,
              image: data.user.avatar_url,
              roles: data.user.roles,
              accessToken: data.accessToken,
              refreshToken: refreshToken || "",
              onboarding_complete: data.user.onboarding_complete === true,
            };
            console.log("Authorize returning user. Onboarding complete:", userPayload.onboarding_complete);
            return userPayload;
          }

          return null;
        } catch (error: any) {
          console.error("Login error in authorize:", error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        console.log("JWT Callback: Initial sign in. Onboarding status:", user.onboarding_complete);
        return {
          ...token,
          id: user.id,
          name: user.name, // Explicitly map name
          email: user.email, // Explicitly map email
          roles: user.roles,
          picture: user.image, // Helper for standard NextAuth logic
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          onboarding_complete: user.onboarding_complete,
        };
      }

      // Handle session update
      if (trigger === "update" && session?.onboarding_complete) {
        token.onboarding_complete = session.onboarding_complete;
      }

      // Return previous token if the access token has not expired yet
      try {
        // If the token already has an error, return it immediately to stop the loop
        if (token.error === "RefreshAccessTokenError") {
          return token;
        }

        const decoded = jwtDecode<{ exp: number }>(token.accessToken);
        // Subtract 60 seconds to refresh early and account for clock skew
        if (decoded.exp && Date.now() < (decoded.exp * 1000 - 60 * 1000)) {
          return token;
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        // If decoding fails, we assume it's invalid/expired and try to refresh
      }

      // Access token has expired, try to update it
      const refreshedToken = await refreshAccessToken(token);

      // If the refresh resulted in SESSION_INVALID, return null to destroy the session
      if (refreshedToken.error === "SESSION_INVALID") {
        console.warn("JWT Callback: Session is invalid. Returning null to terminate.");
        // We cast to any to satisfy NextAuth types while triggering session destruction
        return null as any;
      }

      return refreshedToken;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name; // Explicitly map name
        session.user.roles = token.roles;
        session.user.accessToken = token.accessToken;
        session.user.error = token.error;
        session.user.onboarding_complete = token.onboarding_complete;
        session.user.image = token.picture;
        // refreshToken is deliberately excluded from the session
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Custom login page
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
