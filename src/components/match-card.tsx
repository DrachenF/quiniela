'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { isPredictionLocked, outcome } from '@/lib/scoring';
import type { Match, Outcome, PredictionRow } from '@/lib/types';
import { savePredictionAction } from '@/server/actions';

const roundNames: Record<string, string> = {
  ROUND_OF_32: 'Dieciseisavos',
  ROUND_OF_16: 'Octavos de final',
  QUARTER_FINAL: 'Cuartos de final',
  SEMI_FINAL: 'Semifinales',
  THIRD_PLACE: 'Tercer puesto',
  FINAL: 'Final',
};

type MatchCardProps = {
  match: Match;
  prediction?: PredictionRow;
  readOnly?: boolean;
};

type SavePredictionState = Awaited<ReturnType<typeof savePredictionAction>> | null;

function flag(iso?: string | null) {
  return iso ? String.fromCodePoint(...iso.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0))) : '🏳️';
}

type TeamFlagProps = {
  flagUrl?: string | null;
  isoCode?: string | null;
  name?: string | null;
};

function TeamFlag({ flagUrl, isoCode, name }: TeamFlagProps) {
  const [failed, setFailed] = useState(false);
  const fallback = flag(isoCode);

  if (flagUrl && !failed) {
    return (
      <img
        src={flagUrl}
        width={48}
        height={32}
        alt={name ? `Bandera de ${name}` : 'Bandera de selección'}
        className="mx-auto h-8 w-12 rounded-sm object-cover shadow-sm ring-1 ring-slate-200"
        style={{ objectFit: 'cover' }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span aria-label={name ? `Bandera de ${name}` : 'Bandera de selección'} className="block text-4xl" role="img">
      {fallback}
    </span>
  );
}

function getPredictedOutcome(home: string, away: string): Outcome | null {
  if (home === '' || away === '') return null;
  return outcome(Number(home), Number(away));
}

export function MatchCard({ match, prediction, readOnly = false }: MatchCardProps) {
  const [now, setNow] = useState(new Date());
  const [home, setHome] = useState(prediction?.predicted_home_score?.toString() ?? '');
  const [away, setAway] = useState(prediction?.predicted_away_score?.toString() ?? '');
  const [manualQualifiedTeamId, setManualQualifiedTeamId] = useState(prediction?.predicted_qualified_team_id ?? '');
  const [state, action, pending] = useActionState(savePredictionAction, null as SavePredictionState);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const locked = isPredictionLocked(match, now);
  const remaining = match.lockAt ? Math.max(0, new Date(match.lockAt).getTime() - now.getTime()) : 0;
  const hours = String(Math.floor(remaining / 3600000)).padStart(2, '0');
  const minutes = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
  const kickoffLabel = useMemo(
    () =>
      match.kickoffAt
        ? new Intl.DateTimeFormat('es-GT', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'America/Guatemala',
          }).format(new Date(match.kickoffAt))
        : 'Fecha oficial pendiente',
    [match.kickoffAt],
  );
  const predictedOutcome = getPredictedOutcome(home, away);
  const qualifiedTeamId =
    match.round === 'THIRD_PLACE'
      ? ''
      : predictedOutcome === 'HOME'
        ? match.homeTeam?.id ?? ''
        : predictedOutcome === 'AWAY'
          ? match.awayTeam?.id ?? ''
          : manualQualifiedTeamId;
  const disabled = readOnly || locked || !match.homeTeam || !match.awayTeam;

  return (
    <article className="card p-5">
      <div className="flex justify-between gap-3">
        <span className="badge">{roundNames[match.round]}</span>
        <span className={remaining < 1800000 && !locked ? 'font-bold text-amber-600' : 'text-slate-500'}>
          {!match.lockAt ? 'Sin fecha oficial' : locked ? 'Pronóstico cerrado' : `Cierra en ${hours}:${minutes}:${seconds}`}
        </span>
      </div>

      <div className="my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <div>
          <TeamFlag flagUrl={match.homeTeam?.flagUrl} isoCode={match.homeTeam?.isoCode} name={match.homeTeam?.name} />
          <b>{match.homeTeam?.name || 'Por definir'}</b>
        </div>
        <span className="font-black text-slate-400">vs</span>
        <div>
          <TeamFlag flagUrl={match.awayTeam?.flagUrl} isoCode={match.awayTeam?.isoCode} name={match.awayTeam?.name} />
          <b>{match.awayTeam?.name || 'Por definir'}</b>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        {kickoffLabel}
        {match.stadium ? ` · ${match.stadium}` : ''}
        {match.city ? ` · ${match.city}` : ''}
      </p>

      {!readOnly && (
        <form action={action} className="mt-4 grid gap-3">
          <input type="hidden" name="matchId" value={match.id} />
          <input type="hidden" name="qualifiedTeamId" value={qualifiedTeamId} />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="home"
              value={home}
              onChange={(event) => setHome(event.target.value)}
              disabled={disabled}
              className="input text-center text-xl"
              type="number"
              min={0}
              max={20}
              placeholder="0"
            />
            <input
              name="away"
              value={away}
              onChange={(event) => setAway(event.target.value)}
              disabled={disabled}
              className="input text-center text-xl"
              type="number"
              min={0}
              max={20}
              placeholder="0"
            />
          </div>

          {predictedOutcome === 'DRAW' && match.round !== 'THIRD_PLACE' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                className={manualQualifiedTeamId === match.homeTeam?.id ? 'btn' : 'btn secondary'}
                type="button"
                onClick={() => setManualQualifiedTeamId(match.homeTeam?.id ?? '')}
              >
                {match.homeTeam?.name} clasifica
              </button>
              <button
                className={manualQualifiedTeamId === match.awayTeam?.id ? 'btn' : 'btn secondary'}
                type="button"
                onClick={() => setManualQualifiedTeamId(match.awayTeam?.id ?? '')}
              >
                {match.awayTeam?.name} clasifica
              </button>
            </div>
          )}

          {!match.homeTeam || !match.awayTeam ? (
            <p className="text-sm text-amber-700">No se puede pronosticar partidos con equipos por definir.</p>
          ) : null}
          <button disabled={disabled || pending} className="btn disabled:opacity-40">
            {pending ? 'Guardando...' : prediction ? 'Actualizar pronóstico' : 'Guardar pronóstico'}
          </button>
          {state && <p className={state.ok ? 'text-teal-700' : 'text-red-700'}>{state.message}</p>}
        </form>
      )}

      {match.status === 'FINISHED' && (
        <p className="mt-3 font-bold">
          Oficial: {match.homeScore90}-{match.awayScore90}
        </p>
      )}
    </article>
  );
}
