import { NextRequest, NextResponse } from 'next/server';
import { createAdminToken, credentialsValid, setAdminCookie } from '@/lib/auth';
export async function POST(req:NextRequest){const form=await req.formData();const email=String(form.get('email')||'');const password=String(form.get('password')||'');if(!credentialsValid(email,password))return NextResponse.redirect(new URL('/admin/login?error=invalid',req.url),303);await setAdminCookie(createAdminToken(email));return NextResponse.redirect(new URL('/admin',req.url),303)}
