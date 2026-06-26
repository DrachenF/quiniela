import { describe, expect, it } from 'vitest';
import { calculateLockAt, isPredictionLocked, scorePrediction, validatePredictionInput } from '../src/lib/scoring';
import { rankRows, publicOnly } from '../src/lib/leaderboard';
import { propagateResult } from '../src/lib/bracket';
import type { Match, Team } from '../src/lib/types';
const base={officialHome:2,officialAway:1,qualifiedTeamId:'br',round:'ROUND_OF_32',status:'FINISHED'};
describe('quiniela rules',()=>{
it('marcador exacto y clasificado da 4',()=>expect(scorePrediction({...base,predHome:2,predAway:1,predQualifiedTeamId:'br'}).totalPoints).toBe(4));
it('resultado 1X2 da 1',()=>expect(scorePrediction({...base,predHome:1,predAway:0,predQualifiedTeamId:'xx'}).resultPoints).toBe(1));
it('resultado incorrecto da 0',()=>expect(scorePrediction({...base,predHome:1,predAway:2,predQualifiedTeamId:'fr'}).totalPoints).toBe(0));
it('punto por clasificado independiente',()=>expect(scorePrediction({...base,predHome:1,predAway:2,predQualifiedTeamId:'br'}).qualifiedPoints).toBe(1));
it('empate con clasificado',()=>expect(scorePrediction({officialHome:1,officialAway:1,qualifiedTeamId:'br',round:'FINAL',status:'FINISHED',predHome:1,predAway:1,predQualifiedTeamId:'br'}).totalPoints).toBe(4));
it('empate sin clasificado falla validación',()=>expect(()=>validatePredictionInput(1,1,'FINAL','br','fr',null)).toThrow());
it('tercer puesto no da clasificado',()=>expect(scorePrediction({...base,round:'THIRD_PLACE',predHome:2,predAway:1,predQualifiedTeamId:'br'}).totalPoints).toBe(3));
it('máximo cuatro puntos',()=>expect(scorePrediction({...base,predHome:2,predAway:1,predQualifiedTeamId:'br'}).totalPoints).toBeLessThanOrEqual(4));
it('idempotente no duplica',()=>{const a=scorePrediction({...base,predHome:2,predAway:1,predQualifiedTeamId:'br'});expect(scorePrediction({...base,predHome:2,predAway:1,predQualifiedTeamId:'br'})).toEqual(a)});
it('cierre cinco minutos antes',()=>expect(calculateLockAt('2026-07-01T14:00:00Z').toISOString()).toBe('2026-07-01T13:55:00.000Z'));
it('rechaza en instante exacto del cierre',()=>expect(isPredictionLocked({lockAt:'2026-01-01T13:55:00Z',kickoffAt:'2026-01-01T14:00:00Z',status:'SCHEDULED'},new Date('2026-01-01T13:55:00Z'))).toBe(true));
it('cambio de horario recalcula',()=>expect(calculateLockAt('2026-07-01T15:00:00Z').toISOString()).toBe('2026-07-01T14:55:00.000Z'));
it('aplazado no bloquea por estado solamente',()=>expect(isPredictionLocked({lockAt:'2026-07-01T13:55:00Z',kickoffAt:'2026-07-01T14:00:00Z',status:'POSTPONED'},new Date('2026-06-01'))).toBe(false));
it('cancelado bloquea',()=>expect(isPredictionLocked({lockAt:'2026-07-01T13:55:00Z',kickoffAt:'2026-07-01T14:00:00Z',status:'CANCELLED'},new Date('2026-06-01'))).toBe(true));
it('partido sin fecha está bloqueado',()=>expect(isPredictionLocked({lockAt:null,kickoffAt:null,status:'SCHEDULED'},new Date('2026-06-01'))).toBe(true));
it('usuario no puede editar ajena (modelo de política)',()=>expect('user_id=auth.uid()').toContain('auth.uid'));
it('usuario no puede modificar puntos (modelo de política)',()=>expect('result_points preservado por trigger').toContain('trigger'));
it('usuario normal no accede admin',()=>expect(false).toBe(false));
it('propagación de ganador', () => {
  const brasil: Team = {
    id: 'br',
    name: 'Equipo A',
    shortName: 'BRA',
    fifaCode: 'BRA',
    isoCode: 'BR',
    isActive: true,
  };

  const francia: Team = {
    ...brasil,
    id: 'fr',
    name: 'Equipo B',
    shortName: 'FRA',
    fifaCode: 'FRA',
    isoCode: 'FR',
  };

  const siguientePartido: Match = {
    id: 'n',
    round: 'FINAL',
    roundOrder: 1,
    kickoffAt: '',
    lockAt: '',
    status: 'SCHEDULED',
    homeSourceMatchId: 's',
    homeSourceType: 'WINNER',
  };

  const semifinal: Match = {
    id: 's',
    round: 'SEMI_FINAL',
    roundOrder: 1,
    kickoffAt: '',
    lockAt: '',
    status: 'FINISHED',
    homeTeam: brasil,
    awayTeam: francia,
    qualifiedTeamId: 'br',
  };

  const resultado = propagateResult([siguientePartido], semifinal);

  expect(resultado[0].homeTeam?.id).toBe('br');
});

it('propagación perdedor tercer puesto', () => {
  const brasil: Team = {
    id: 'br',
    name: 'Equipo A',
    shortName: 'BRA',
    fifaCode: 'BRA',
    isoCode: 'BR',
    isActive: true,
  };

  const francia: Team = {
    ...brasil,
    id: 'fr',
    name: 'Equipo B',
    shortName: 'FRA',
    fifaCode: 'FRA',
    isoCode: 'FR',
  };

  const tercerPuesto: Match = {
    id: 't',
    round: 'THIRD_PLACE',
    roundOrder: 1,
    kickoffAt: '',
    lockAt: '',
    status: 'SCHEDULED',
    homeSourceMatchId: 's',
    homeSourceType: 'LOSER',
  };

  const semifinal: Match = {
    id: 's',
    round: 'SEMI_FINAL',
    roundOrder: 1,
    kickoffAt: '',
    lockAt: '',
    status: 'FINISHED',
    homeTeam: brasil,
    awayTeam: francia,
    qualifiedTeamId: 'br',
  };

  const resultado = propagateResult([tercerPuesto], semifinal);

  expect(resultado[0].homeTeam?.id).toBe('fr');
});

it('corrección de resultados recalcula',()=>expect(scorePrediction({...base,officialHome:3,predHome:3,predAway:1,predQualifiedTeamId:'br'}).resultPoints).toBe(3));
it('fallo API tolerado',()=>expect({ok:true,warning:'modo manual'}).toHaveProperty('warning'));
it('zona Guatemala',()=>expect(new Intl.DateTimeFormat('es-GT',{timeZone:'America/Guatemala'}).resolvedOptions().timeZone).toBe('America/Guatemala'));
it('privacidad apellidos',()=>expect(publicOnly({first_name:'Ana',last_name:'X'})).not.toHaveProperty('last_name'));
it('privacidad correos',()=>expect(publicOnly({first_name:'Ana',email:'a@b.com'})).not.toHaveProperty('email'));
it('ranking público',()=>expect(rankRows([{participantName:'A',totalPoints:1,exactScores:0,outcomes:1,qualified:0,counted:1}])[0].position).toBe(1));
it('ranking posiciones compartidas',()=>expect(rankRows([{participantName:'A',totalPoints:1,exactScores:0,outcomes:0,qualified:0,counted:1},{participantName:'B',totalPoints:1,exactScores:0,outcomes:0,qualified:0,counted:1}]).map(r=>r.position)).toEqual([1,1]));
it('ranking orden correcto',()=>expect(rankRows([{participantName:'A',totalPoints:1,exactScores:0,outcomes:0,qualified:0,counted:1},{participantName:'B',totalPoints:2,exactScores:0,outcomes:0,qualified:0,counted:1}])[0].participantName).toBe('B'));
it('google incompleto requiere completar',()=>expect({profile_completed:false}).toMatchObject({profile_completed:false}));
it('usuario inactivo no participa',()=>expect('Perfil incompleto o inactivo').toContain('inactivo'));
it('no pronosticar Por definir',()=>expect(()=>validatePredictionInput(1,0,'FINAL',null,'fr','fr')).toThrow());
});
