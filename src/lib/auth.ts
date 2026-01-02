import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { jwtDecode } from "jwt-decode";
import { JWT } from "next-auth/jwt";

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.refreshToken}`,
      },
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken, // Fallback if API doesn't return new refresh token
    };
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
        if (!credentials?.email || !credentials?.password) {
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

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data?.message || "Authentication failed");
          }

          if (data?.accessToken && data?.user) {
            return {
              id: data.user.id,
              name: data.user.email,
              email: data.user.email,
              roles: data.user.roles,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            };
          }

          return null;
        } catch (error: any) {
          console.error("Login error:", error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        return {
          ...token,
          id: user.id,
          roles: user.roles,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
        };
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
