import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", service: "cocpit-frontend" }, { status: 200 });
}
