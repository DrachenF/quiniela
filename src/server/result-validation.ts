import { z } from 'zod';

const uuidSchema = z.string().uuid();

export type MatchForResultValidation = {
  id: string;
  round: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score_90: number | null;
  away_score_90: number | null;
  qualified_team_id: string | null;
  winner_team_id?: string | null;
  loser_team_id?: string | null;
  status: string;
};

export type ValidatedResultPayload = {
  home_score_90: number;
  away_score_90: number;
  qualified_team_id: string | null;
  status: 'FINISHED';
};

export type ResultAuditSnapshot = {
  home_score_90: number | null;
  away_score_90: number | null;
  qualified_team_id: string | null;
  winner_team_id: string | null;
  loser_team_id: string | null;
  status: string;
};

export function parseRequiredGoal(value: FormDataEntryValue | null, fieldName: string): number {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${fieldName} es obligatorio.`);
  }

  if (!/^\d+$/.test(value.trim())) {
    throw new Error(`${fieldName} debe ser un número entero entre 0 y 20.`);
  }

  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 20) {
    throw new Error(`${fieldName} debe ser un número entero entre 0 y 20.`);
  }

  return parsed;
}

export function parseResultForm(formData: FormData): {
  id: string;
  homeScore: number;
  awayScore: number;
  requestedQualifiedTeamId: string | null;
} {
  const id = String(formData.get('id') ?? '').trim();
  if (!uuidSchema.safeParse(id).success) {
    throw new Error('ID de partido inválido.');
  }

  const homeScore = parseRequiredGoal(formData.get('home_score_90'), 'El marcador local');
  const awayScore = parseRequiredGoal(formData.get('away_score_90'), 'El marcador visitante');
  const rawQualifiedTeamId = String(formData.get('qualified_team_id') ?? '').trim();
  const requestedQualifiedTeamId = rawQualifiedTeamId === '' ? null : rawQualifiedTeamId;

  if (requestedQualifiedTeamId !== null && !uuidSchema.safeParse(requestedQualifiedTeamId).success) {
    throw new Error('Equipo clasificado inválido.');
  }

  return { id, homeScore, awayScore, requestedQualifiedTeamId };
}

export function validateResultForMatch(args: {
  match: MatchForResultValidation;
  homeScore: number;
  awayScore: number;
  requestedQualifiedTeamId: string | null;
}): ValidatedResultPayload {
  const { match, homeScore, awayScore, requestedQualifiedTeamId } = args;

  if (!match.home_team_id || !match.away_team_id) {
    throw new Error('El partido debe tener equipo local y visitante definidos.');
  }

  if (match.round === 'THIRD_PLACE') {
    return {
      home_score_90: homeScore,
      away_score_90: awayScore,
      qualified_team_id: null,
      status: 'FINISHED',
    };
  }

  if (homeScore > awayScore) {
    return {
      home_score_90: homeScore,
      away_score_90: awayScore,
      qualified_team_id: match.home_team_id,
      status: 'FINISHED',
    };
  }

  if (awayScore > homeScore) {
    return {
      home_score_90: homeScore,
      away_score_90: awayScore,
      qualified_team_id: match.away_team_id,
      status: 'FINISHED',
    };
  }

  if (!requestedQualifiedTeamId) {
    throw new Error('Seleccione quién clasifica.');
  }

  if (requestedQualifiedTeamId !== match.home_team_id && requestedQualifiedTeamId !== match.away_team_id) {
    throw new Error('El equipo clasificado debe ser local o visitante.');
  }

  return {
    home_score_90: homeScore,
    away_score_90: awayScore,
    qualified_team_id: requestedQualifiedTeamId,
    status: 'FINISHED',
  };
}

export function resultAuditSnapshot(match: MatchForResultValidation): ResultAuditSnapshot {
  return {
    home_score_90: match.home_score_90,
    away_score_90: match.away_score_90,
    qualified_team_id: match.qualified_team_id,
    winner_team_id: match.winner_team_id ?? null,
    loser_team_id: match.loser_team_id ?? null,
    status: match.status,
  };
}
