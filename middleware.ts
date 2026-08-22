import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    console.log(`[Middleware] Path: ${path}, Token exists: ${!!token}, Onboarding Complete: ${token?.onboarding_complete}`);

    // Check onboarding status
    // If authenticated (token exists) and onboarding is not complete
    if (token && !token.onboarding_complete && path !== "/onboarding") {
      console.log("[Middleware] Redirecting to /onboarding");
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // If user is already onboarded and tries to access /onboarding, redirect them away
    if (token && token.onboarding_complete && path === "/onboarding") {
      console.log("[Middleware] Redirecting to /profile");
      return NextResponse.redirect(new URL("/profile", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/",
    },
    secret: process.env.NEXTAUTH_SECRET,
    cookies: {
      sessionToken: {
        name: `next-auth.session-token`,
      },
    },
  }
);

export const config = {
  matcher: [
    "/feed",
    "/feed/:path*",
    "/profile/:path*",
    "/jobs/:path*",
    "/events/:path*",
    "/messaging/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/showcase/:path*",
    "/notifications/:path*",
    "/onboarding",
    "/company-onboarding",
    "/organization/:path*/settings",
  ]
};

