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
      },
      async authorize(credentials) {
        console.log("Authorize function called with credentials:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.error("Credentials missing email or password.");
          throw new Error("Email and password are required");
        }

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: "POST",
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            headers: { "Content-Type": "application/json" },
          });
          console.log("Login API response status:", res.status);

          const data = await res.json();
          console.log("Login API response data:", data);

          if (!res.ok) {
            console.error("Login API request failed with status:", res.status, "and data:", data);
            throw new Error(data?.message || "Authentication failed");
          }

          if (data?.accessToken && data?.user) {
            // Extract refreshToken from Set-Cookie header
             const setCookieHeader = typeof res.headers.getSetCookie === 'function'
              ? res.headers.getSetCookie()
              : res.headers.get("set-cookie");
            console.log("Login API 'set-cookie' header:", setCookieHeader);

            const refreshToken = getCookieValue(setCookieHeader, "refreshToken");
            console.log("Extracted refreshToken from login response:", refreshToken ? "found" : "not found");

            const userPayload = {
              id: data.user.id,
              name: data.user.email,
              email: data.user.email,
              roles: data.user.roles,
              accessToken: data.accessToken,
              refreshToken: refreshToken || "", // Fallback to empty string if missing (should fail later)
              onboarding_complete: data.user.onboarding_complete === true,
            };
            console.log("Authorize function returning user payload:", userPayload);
            return userPayload;
          }

          console.log("Authorize function returning null as no accessToken or user in response.");
          return null;
        } catch (error: any) {
          console.error("Login error in authorize function:", error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        return {
          ...token,
          id: user.id,
          roles: user.roles,
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
        const decoded = jwtDecode<{ exp: number }>(token.accessToken);
        if (decoded.exp && Date.now() < decoded.exp * 1000) {
          return token;
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        // If decoding fails, we assume it's invalid/expired and try to refresh
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.roles = token.roles;
        session.user.accessToken = token.accessToken;
        session.user.error = token.error;
        session.user.onboarding_complete = token.onboarding_complete;
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
