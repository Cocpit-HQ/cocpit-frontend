import { NextResponse } from 'next/server';

// NOTE: this is a simple stub for local dev.
// Replace with database lookup (Prisma) and proper normalization.
const taken = new Set(['admin', 'test', 'john', 'demo']);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = (searchParams.get('username') || '').trim().toLowerCase();
  if (!username) return NextResponse.json({ available: false });

  const available = !taken.has(username);
  return NextResponse.json({ available });
}
