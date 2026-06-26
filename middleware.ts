import { NextResponse, type NextRequest } from 'next/server';
export function middleware(req:NextRequest){const protectedPaths=['/quiniela','/perfil','/admin']; if(protectedPaths.some(p=>req.nextUrl.pathname.startsWith(p)) && process.env.NEXT_PUBLIC_SUPABASE_URL && !req.cookies.get('sb-access-token')) return NextResponse.redirect(new URL('/login',req.url)); return NextResponse.next();}
export const config={matcher:['/quiniela/:path*','/perfil/:path*','/admin/:path*']};
