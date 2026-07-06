import { NextRequest, NextResponse } from 'next/server';
import { clearAdminCookie } from '@/lib/auth';

function getPublicBaseUrl(req: NextRequest): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  const protocol =
    req.headers.get('x-forwarded-proto') ||
    req.nextUrl.protocol.replace(':', '') ||
    'https';

  const host =
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host');

  if (host) {
    return `${protocol}://${host}`;
  }

  return req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  await clearAdminCookie();

  const baseUrl = getPublicBaseUrl(req);

  return NextResponse.redirect(
    new URL('/admin/login', baseUrl),
    303,
  );
}
