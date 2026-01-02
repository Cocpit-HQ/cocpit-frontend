import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      roles: string[]
      accessToken: string
      error?: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    roles: string[]
    accessToken: string
    refreshToken: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    roles: string[]
    accessToken: string
    refreshToken: string
    error?: string
  }
}
