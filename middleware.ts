export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/feed/:path*",
    "/profile/:path*",
    "/jobs/:path*",
    "/events/:path*",
    "/messaging/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/showcase/:path*",
    "/notifications/:path*",
  ]
}
