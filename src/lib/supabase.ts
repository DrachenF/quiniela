import { createBrowserClient } from '@supabase/ssr';
export function hasSupabaseEnv(){return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}
export function browserSupabase(){ if(!hasSupabaseEnv()) throw new Error('Supabase no configurado'); return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); }
