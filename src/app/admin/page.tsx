import { redirect } from 'next/navigation';
import { SubmitMessage } from '@/components/action-form';
import { getMatches, getProfile, getTeams } from '@/lib/data';
import { saveMatchAction, saveResultAction, saveTeamAction } from '@/server/actions';

export default async function Admin() {
  const profile = await getProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'admin') redirect('/403');

  const [teams, matches] = await Promise.all([getTeams(), getMatches()]);

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h1 className="text-3xl font-black">Panel administrativo</h1>
        <p className="text-slate-600">Carga manual de equipos, partidos y resultados desde Supabase.</p>
      </section>

      <section className="card p-6">
        <h2 className="text-2xl font-black">Equipos</h2>
        <SubmitMessage action={saveTeamAction}>
          <div className="grid gap-3 md:grid-cols-4">
            <input name="name" className="input" placeholder="Nombre" />
            <input name="short_name" className="input" placeholder="Nombre corto" />
            <input name="fifa_code" className="input" placeholder="Código FIFA" />
            <input name="iso_code" className="input" placeholder="Código ISO" />
            <input name="flag_url" className="input" placeholder="Bandera URL" />
            <input name="external_id" className="input" placeholder="ID externo opcional" />
            <label className="flex gap-2">
              <input type="checkbox" name="is_active" defaultChecked /> Activo
            </label>
          </div>
        </SubmitMessage>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {teams.map((team) => (
            <p className="rounded border p-2" key={team.id}>
              {team.name} ({team.short_name})
            </p>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-2xl font-black">Crear partido</h2>
        <SubmitMessage action={saveMatchAction}>
          <div className="grid gap-3 md:grid-cols-3">
            <select name="round" className="input">
              <option value="ROUND_OF_32">Dieciseisavos</option>
              <option value="ROUND_OF_16">Octavos</option>
              <option value="QUARTER_FINAL">Cuartos</option>
              <option value="SEMI_FINAL">Semifinal</option>
              <option value="THIRD_PLACE">Tercer puesto</option>
              <option value="FINAL">Final</option>
            </select>
            <input name="round_order" className="input" type="number" placeholder="Orden" />
            <select name="home_team_id" className="input">
              <option value="">Local por definir</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <select name="away_team_id" className="input">
              <option value="">Visitante por definir</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <input name="kickoff_at" className="input" type="datetime-local" />
            <input name="stadium" className="input" placeholder="Estadio" />
            <input name="city" className="input" placeholder="Ciudad" />
            <select name="status" className="input">
              <option>SCHEDULED</option>
              <option>LOCKED</option>
              <option>POSTPONED</option>
              <option>CANCELLED</option>
            </select>
            <label className="flex gap-2">
              <input type="checkbox" name="manually_locked" /> Bloqueado manual
            </label>
          </div>
        </SubmitMessage>
      </section>

      <section className="card p-6">
        <h2 className="text-2xl font-black">Partidos y resultados</h2>
        {matches.length === 0 ? (
          <p className="mt-3">Todavía no hay partidos disponibles</p>
        ) : (
          matches.map((match) => (
            <div className="mt-3 grid gap-2 border-t pt-3 md:grid-cols-8" key={match.id}>
              <span>{match.round}</span>
              <span>
                {match.homeTeam?.name || 'Por definir'} vs {match.awayTeam?.name || 'Por definir'}
              </span>
              <SubmitMessage action={saveResultAction}>
                <input type="hidden" name="id" value={match.id} />
                <input className="input" name="home_score_90" placeholder="GL" type="number" />
                <input className="input" name="away_score_90" placeholder="GV" type="number" />
                <select className="input" name="qualified_team_id">
                  <option value="">Clasificado</option>
                  {match.homeTeam && <option value={match.homeTeam.id}>{match.homeTeam.name}</option>}
                  {match.awayTeam && <option value={match.awayTeam.id}>{match.awayTeam.name}</option>}
                </select>
              </SubmitMessage>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
