import { describe, expect, it } from 'vitest';
import { parseResultForm, validateResultForMatch, type MatchForResultValidation } from '../src/server/result-validation';

const homeId = '11111111-1111-4111-8111-111111111111';
const awayId = '22222222-2222-4222-8222-222222222222';
const otherId = '33333333-3333-4333-8333-333333333333';

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

const baseMatch: MatchForResultValidation = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  round: 'FINAL',
  home_team_id: homeId,
  away_team_id: awayId,
  home_score_90: null,
  away_score_90: null,
  qualified_team_id: null,
  winner_team_id: null,
  loser_team_id: null,
  status: 'SCHEDULED',
};

describe('result validation', () => {
  it('rechaza resultado con marcador local vacío', () => {
    expect(() => parseResultForm(form({ id: baseMatch.id, home_score_90: '', away_score_90: '1' }))).toThrow('marcador local');
  });

  it('rechaza resultado con marcador visitante vacío', () => {
    expect(() => parseResultForm(form({ id: baseMatch.id, home_score_90: '1', away_score_90: '' }))).toThrow('marcador visitante');
  });

  it('un campo vacío no se convierte en cero', () => {
    expect(() => parseResultForm(form({ id: baseMatch.id, home_score_90: '', away_score_90: '0' }))).toThrow();
  });

  it('rechaza goles negativos', () => {
    expect(() => parseResultForm(form({ id: baseMatch.id, home_score_90: '-1', away_score_90: '0' }))).toThrow();
  });

  it('rechaza goles mayores a 20', () => {
    expect(() => parseResultForm(form({ id: baseMatch.id, home_score_90: '21', away_score_90: '0' }))).toThrow();
  });

  it('rechaza ID de partido inválido', () => {
    expect(() => parseResultForm(form({ id: 'nope', home_score_90: '1', away_score_90: '0' }))).toThrow('ID de partido inválido');
  });

  it('rechaza empate sin clasificado', () => {
    expect(() => validateResultForMatch({ match: baseMatch, homeScore: 1, awayScore: 1, requestedQualifiedTeamId: null })).toThrow('Seleccione quién clasifica');
  });

  it('rechaza clasificado que no pertenece al partido', () => {
    expect(() => validateResultForMatch({ match: baseMatch, homeScore: 1, awayScore: 1, requestedQualifiedTeamId: otherId })).toThrow('local o visitante');
  });

  it('victoria local asigna automáticamente local', () => {
    expect(validateResultForMatch({ match: baseMatch, homeScore: 2, awayScore: 1, requestedQualifiedTeamId: otherId }).qualified_team_id).toBe(homeId);
  });

  it('victoria visitante asigna automáticamente visitante', () => {
    expect(validateResultForMatch({ match: baseMatch, homeScore: 1, awayScore: 2, requestedQualifiedTeamId: otherId }).qualified_team_id).toBe(awayId);
  });

  it('tercer puesto no guarda clasificado', () => {
    expect(validateResultForMatch({ match: { ...baseMatch, round: 'THIRD_PLACE' }, homeScore: 1, awayScore: 1, requestedQualifiedTeamId: homeId }).qualified_team_id).toBeNull();
  });
});
