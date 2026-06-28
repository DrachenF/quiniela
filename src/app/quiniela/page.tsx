import { redirect } from 'next/navigation';
import { MatchCard } from '@/components/match-card';
import { getMatches, getProfile, getUserPredictions } from '@/lib/data';

export default async function Quiniela() {
  const profile = await getProfile();
  if (!profile) redirect('/login');
  if (!profile.is_active) redirect('/403');
  if (!profile.profile_completed) redirect('/completar-perfil');

  const [matches, predictions] = await Promise.all([getMatches(), getUserPredictions(profile.id)]);
  const predictionsByMatch = new Map(predictions.map((prediction) => [prediction.match_id, prediction]));

  return (
    <div>
      <h1 className="text-3xl font-black">Mis pronósticos</h1>
      <p className="mt-2 text-slate-600">Horarios en America/Guatemala. Los partidos cierran cinco minutos antes.</p>
      {matches.length === 0 ? (
        <section className="card mt-6 p-6">Todavía no hay partidos disponibles</section>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} prediction={predictionsByMatch.get(match.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
