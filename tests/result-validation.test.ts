import { describe, expect, it } from 'vitest';
import { validateResultInput, type ResultMatchContext } from '../src/lib/result-validation';

const homeId = '11111111-1111-4111-8111-111111111111';
const awayId = '22222222-2222-4222-8222-222222222222';
const matchId = '33333333-3333-4333-8333-333333333333';
const otherId = '44444444-4444-4444-8444-444444444444';
const baseMatch: ResultMatchContext = {
  id: matchId,
  round: 'FINAL',
  home_team_id: homeId,
  away_team_id: awayId,
};

function validate(overrides: Partial<Parameters<typeof validateResultInput>[0]> = {}) {
  return validateResultInput({
    id: matchId,
    homeScore: '1',
    awayScore: '0',
    qualifiedTeamId: homeId,
    match: baseMatch,
    ...overrides,
  });
}

describe('admin result validation', () => {
  it('rechaza id de partido que no es UUID', () => {
    expect(() => validate({ id: 'not-a-uuid' })).toThrow();
  });

  it('no convierte marcadores vacíos en cero', () => {
    expect(() => validate({ homeScore: '' })).toThrow('Ambos marcadores son obligatorios.');
    expect(() => validate({ awayScore: '' })).toThrow('Ambos marcadores son obligatorios.');
  });

  it('exige goles enteros entre 0 y 20', () => {
    expect(() => validate({ homeScore: '1.5' })).toThrow();
    expect(() => validate({ awayScore: '21' })).toThrow();
    expect(() => validate({ awayScore: '-1' })).toThrow();
  });

  it('exige clasificado si hay empate excepto tercer puesto', () => {
    expect(() => validate({ homeScore: '1', awayScore: '1', qualifiedTeamId: '' })).toThrow('Seleccione quién clasifica.');
    expect(
      validate({
        homeScore: '1',
        awayScore: '1',
        qualifiedTeamId: '',
        match: { ...baseMatch, round: 'THIRD_PLACE' },
      }).qualified_team_id,
    ).toBeNull();
  });

  it('verifica que el clasificado pertenezca al partido', () => {
    expect(() => validate({ qualifiedTeamId: otherId })).toThrow('El clasificado debe ser uno de los dos equipos del partido.');
  });

  it('devuelve payload FINISHED solo cuando todo es válido', () => {
    expect(validate()).toEqual({
      id: matchId,
      home_score_90: 1,
      away_score_90: 0,
      qualified_team_id: homeId,
      status: 'FINISHED',
    });
  });
});
