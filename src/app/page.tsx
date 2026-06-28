import Link from 'next/link';
import { getLeaderboard, getMatches, getProfile } from '@/lib/data';
import { MatchCard } from '@/components/match-card';

export default async function Home() {
  const [matches, top, profile] = await Promise.all([getMatches(), getLeaderboard(5), getProfile()]);
  const next = matches.find((match) => match.kickoffAt && match.lockAt && match.status === 'SCHEDULED');

  return (
    <div className="space-y-8">
      <section className="card p-8">
        <p className="badge w-fit">Mundial 2026 · fase eliminatoria</p>
        <h1 className="mt-4 text-4xl font-black md:text-6xl">Quiniela Mundial 2026</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Pronostica desde dieciseisavos hasta la final, suma puntos automáticos y compite en un ranking público que solo
          muestra nombres.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {profile ? (
            <Link className="btn" href="/quiniela">
              Ir a mis pronósticos
            </Link>
          ) : (
            <>
              <Link className="btn" href="/registro">
                Crear cuenta
              </Link>
              <Link className="btn secondary" href="/login">
                Entrar
              </Link>
            </>
          )}
          <Link className="btn secondary" href="/clasificacion">
            Ver ranking
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-black">Próximo cierre</h2>
        {next ? <MatchCard match={next} readOnly /> : <section className="card p-6">Próximamente se publicarán los partidos</section>}
      </section>

      <section className="card p-6">
        <h2 className="text-2xl font-black">Top 5</h2>
        {top.length ? (
          top.map((row) => (
            <p key={`${row.position}-${row.participantName}`} className="mt-3 flex justify-between">
              <span>
                {row.position}. {row.participantName}
              </span>
              <b>{row.totalPoints} pts</b>
            </p>
          ))
        ) : (
          <p className="mt-3">Todavía no hay participantes</p>
        )}
        <Link className="mt-4 inline-block font-bold text-teal-700" href="/clasificacion">
          Ver ranking completo
        </Link>
      </section>
    </div>
  );
}
