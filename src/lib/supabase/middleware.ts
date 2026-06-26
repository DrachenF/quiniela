import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasSupabaseEnv } from './config';
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!hasSupabaseEnv()) return response;
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  if (!user && ['/quiniela','/perfil','/completar-perfil'].some((p) => path.startsWith(p))) return NextResponse.redirect(new URL('/login', request.url));
  if (path.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url));
    const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).single();
    if (profile?.role !== 'admin' || !profile?.is_active) return NextResponse.redirect(new URL('/403', request.url));
  }
  return response;
}
