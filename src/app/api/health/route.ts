import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'dotvec-tools',
    timestamp: new Date().toISOString(),
  });
}
