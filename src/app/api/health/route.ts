import { NextResponse } from "next/server";

/**
 * Liveness check for Railway (healthcheckPath = /api/health).
 * App Router filesystem routes are matched before next.config rewrites,
 * so this is served by Next.js and never proxied to the backend.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { status: "ok", service: "frontend", uptime: Math.round(process.uptime()) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
