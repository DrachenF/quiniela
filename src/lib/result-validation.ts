import { z } from 'zod';
import type { Round } from './types';

export type ResultMatchContext = {
  id: string;
  round: Round;
  home_team_id: string | null;
  away_team_id: string | null;
};

export type ValidatedResultInput = {
  id: string;
  home_score_90: number;
  away_score_90: number;
  qualified_team_id: string | null;
  status: 'FINISHED';
};

const uuidSchema = z.string().uuid();
const scoreSchema = z
  .string()
  .trim()
  .min(1, 'Ambos marcadores son obligatorios.')
  .regex(/^\d+$/, 'Los goles deben ser enteros entre 0 y 20.')
  .transform((value) => Number(value))
  .refine((value) => value >= 0 && value <= 20, 'Los goles deben ser enteros entre 0 y 20.');

export function validateResultInput(input: {
  id: FormDataEntryValue | null;
  homeScore: FormDataEntryValue | null;
  awayScore: FormDataEntryValue | null;
  qualifiedTeamId: FormDataEntryValue | null;
  match: ResultMatchContext;
}): ValidatedResultInput {
  const id = uuidSchema.parse(String(input.id ?? ''));
  const homeScore = scoreSchema.parse(String(input.homeScore ?? ''));
  const awayScore = scoreSchema.parse(String(input.awayScore ?? ''));
  const qualifiedTeamId = String(input.qualifiedTeamId ?? '').trim() || null;

  if (id !== input.match.id) {
    throw new Error('El partido no coincide con el resultado enviado.');
  }
  if (!input.match.home_team_id || !input.match.away_team_id) {
    throw new Error('No se puede registrar resultado sin ambos equipos definidos.');
  }
  if (qualifiedTeamId !== null && !uuidSchema.safeParse(qualifiedTeamId).success) {
    throw new Error('El clasificado no es válido.');
  }
  if (homeScore === awayScore && input.match.round !== 'THIRD_PLACE' && !qualifiedTeamId) {
    throw new Error('Seleccione quién clasifica.');
  }
  if (qualifiedTeamId !== null && qualifiedTeamId !== input.match.home_team_id && qualifiedTeamId !== input.match.away_team_id) {
    throw new Error('El clasificado debe ser uno de los dos equipos del partido.');
  }

  return {
    id,
    home_score_90: homeScore,
    away_score_90: awayScore,
    qualified_team_id: input.match.round === 'THIRD_PLACE' ? null : qualifiedTeamId,
    status: 'FINISHED',
  };
}
