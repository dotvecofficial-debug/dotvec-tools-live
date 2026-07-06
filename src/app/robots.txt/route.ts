import { NextResponse } from 'next/server';
import { readStore } from '@/lib/store';
export const dynamic='force-dynamic';
export async function GET(){const settings=(await readStore()).settings;return new NextResponse(settings.robotsTxt.replaceAll('{{DOMAIN}}',settings.canonicalDomain.replace(/\/$/,'')),{headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}})}
