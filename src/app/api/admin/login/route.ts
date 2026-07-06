import { NextRequest, NextResponse } from 'next/server';
import {
  createAdminToken,
  credentialsValid,
  setAdminCookie,
} from '@/lib/auth';

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
  const form = await req.formData();

  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');

  const baseUrl = getPublicBaseUrl(req);

  if (!credentialsValid(email, password)) {
    return NextResponse.redirect(
      new URL('/admin/login?error=invalid', baseUrl),
      303,
    );
  }

  await setAdminCookie(createAdminToken(email));

  return NextResponse.redirect(
    new URL('/admin', baseUrl),
    303,
  );
}
