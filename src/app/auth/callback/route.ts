import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getSafeNext(request: NextRequest) {
  const url = new URL(request.url);
  const next = url.searchParams.get('next') ?? '/quiniela';

  if (!next.startsWith('/') || next.startsWith('//') || next.includes('://')) return '/quiniela';
  return next;
}

export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get('code');
  const destination = getSafeNext(request);
  const supabase = await createClient();

  if (!code || !supabase) return NextResponse.redirect(new URL('/login', request.url));

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) return NextResponse.redirect(new URL('/login', request.url));

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_active,profile_completed')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.is_active === false) return NextResponse.redirect(new URL('/403', request.url));
  if (!profile?.profile_completed) return NextResponse.redirect(new URL('/completar-perfil', request.url));

  return NextResponse.redirect(new URL(destination, request.url));
}
