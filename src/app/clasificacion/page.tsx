import { getLeaderboard, getMyLeaderboardEntry, getProfile } from '@/lib/data';

export default async function Clasificacion() {
  const [leaderboard, profile, myEntry] = await Promise.all([getLeaderboard(10), getProfile(), getMyLeaderboardEntry()]);

  return (
    <section className="space-y-4">
      <div className="card p-6">
        <h1 className="text-3xl font-black">Clasificación pública</h1>
        <p className="text-slate-600">Solo se muestra el nombre; nunca apellido, correo ni UUID.</p>
      </div>

      {profile && myEntry ? (
        <aside className="card border-teal-200 bg-teal-50 p-6" aria-label="Mi posición">
          <p className="badge w-fit">Mi posición</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">{myEntry.participantName}</h2>
              <p className="text-slate-600">Puesto {myEntry.position}</p>
            </div>
            <p className="text-3xl font-black text-teal-800">{myEntry.totalPoints} pts</p>
          </div>
        </aside>
      ) : null}

      <div className="card p-6">
        {leaderboard.length === 0 ? (
          <p>Todavía no hay participantes</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th>Pos.</th>
                  <th>Nombre</th>
                  <th>Puntos</th>
                  <th>Exactos</th>
                  <th>1X2</th>
                  <th>Clasif.</th>
                  <th>Cont.</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row) => (
                  <tr className="border-t" key={`${row.position}-${row.participantName}`}>
                    <td>{row.position}</td>
                    <td>{row.participantName}</td>
                    <td>
                      <b>{row.totalPoints}</b>
                    </td>
                    <td>{row.exactScores}</td>
                    <td>{row.outcomes}</td>
                    <td>{row.qualified}</td>
                    <td>{row.counted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
