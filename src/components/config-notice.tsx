import { hasSupabaseEnv, supabaseConfigMessage } from '@/lib/supabase/config';
export function ConfigNotice() { return hasSupabaseEnv() ? null : <section className="card border-amber-300 bg-amber-50 p-4 text-amber-900"><b>Configuración pendiente:</b> {supabaseConfigMessage}</section>; }
