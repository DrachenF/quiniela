import Link from 'next/link';
import { signOutAction } from '@/server/actions';
import { getProfile } from '@/lib/data';

export async function Nav() {
  const app = process.env.NEXT_PUBLIC_APP_NAME || 'Quiniela Mundial 2026';
  const profile = await getProfile();

  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link className="font-black text-teal-800" href={profile ? '/quiniela' : '/'}>
          {app}
        </Link>
        <div className="hidden gap-4 md:flex">
          <Link href="/quiniela">Quiniela</Link>
          <Link href="/clasificacion">Clasificación</Link>
          <Link href="/reglas">Reglas</Link>
          {profile?.role === 'admin' && <Link href="/admin">Admin</Link>}
        </div>
        {profile ? (
          <form action={signOutAction}>
            <button className="btn">Salir</button>
          </form>
        ) : (
          <Link className="btn" href="/login">
            Entrar
          </Link>
        )}
      </nav>
    </header>
  );
}
