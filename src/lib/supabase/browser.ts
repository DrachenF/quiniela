'use client';
import { createBrowserClient } from '@supabase/ssr';
import { hasSupabaseEnv } from './config';
export function createClient() {
  if (!hasSupabaseEnv()) throw new Error('Supabase no configurado');
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
