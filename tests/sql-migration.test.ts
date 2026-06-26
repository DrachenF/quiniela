import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sql = readFileSync('supabase/migrations/001_init.sql', 'utf8');
const rejectFunction = sql.slice(sql.indexOf('create or replace function reject_locked_prediction'), sql.indexOf('create trigger predictions_lock'));
const pointsGuardFunction = sql.slice(sql.indexOf('create or replace function reject_manual_prediction_points_update'), sql.indexOf('create trigger predictions_points_internal_only'));
const recalculateFunction = sql.slice(sql.indexOf('create or replace function recalculate_match_predictions'), sql.indexOf('create or replace function save_match_result'));
const saveResultFunction = sql.slice(sql.indexOf('create or replace function save_match_result'), sql.indexOf('create or replace function public_leaderboard'));

describe('SQL migration critical logic', () => {
  it('primer INSERT de un pronóstico no utiliza OLD e inicializa puntos en cero y estado PENDING', () => {
    const insertBranch = rejectFunction.slice(rejectFunction.indexOf("TG_OP = 'INSERT'"), rejectFunction.indexOf("TG_OP = 'UPDATE'"));
    expect(insertBranch).not.toContain('old.');
    expect(insertBranch).toContain('new.result_points := 0');
    expect(insertBranch).toContain('new.qualified_points := 0');
    expect(insertBranch).toContain('new.total_points := 0');
    expect(insertBranch).toContain("new.calculation_status := 'PENDING'");
  });

  it('UPDATE de campos pronosticados conserva los puntos existentes', () => {
    const updateBranch = rejectFunction.slice(rejectFunction.indexOf("TG_OP = 'UPDATE'"));
    expect(updateBranch).toContain('new.result_points := old.result_points');
    expect(updateBranch).toContain('new.qualified_points := old.qualified_points');
    expect(updateBranch).toContain('new.total_points := old.total_points');
    expect(updateBranch).toContain('new.calculation_status := old.calculation_status');
  });

  it('un partido FINISHED puede recalcular puntos sin que predictions_lock lo bloquee', () => {
    const predictionsLockTrigger = sql.match(/create trigger predictions_lock[^;]+;/)?.[0] ?? '';
    expect(predictionsLockTrigger).toContain('before insert or update of user_id, match_id, predicted_home_score, predicted_away_score, predicted_outcome, predicted_qualified_team_id');
    expect(predictionsLockTrigger).not.toContain('result_points');
    expect(predictionsLockTrigger).not.toContain('qualified_points');
    expect(predictionsLockTrigger).not.toContain('total_points');
    expect(recalculateFunction).toContain("set_config('app.recalculating_predictions', 'on', true)");
    expect(recalculateFunction).toContain('update predictions p set result_points=');
  });

  it('un usuario no puede modificar manualmente sus puntos calculados', () => {
    const pointsTrigger = sql.match(/create trigger predictions_points_internal_only[^;]+;/)?.[0] ?? '';
    expect(pointsTrigger).toContain('before update of result_points, qualified_points, total_points, calculation_status');
    expect(pointsGuardFunction).toContain("current_setting('app.recalculating_predictions', true)");
    expect(pointsGuardFunction).toContain('No se pueden modificar manualmente los puntos');
    expect(sql).toContain('revoke update(result_points, qualified_points, total_points, calculation_status) on predictions from authenticated');
  });

  it('un UPDATE del pronóstico después del cierre sí es rechazado', () => {
    expect(rejectFunction).toContain("m.status in ('LOCKED','LIVE','FINISHED','CANCELLED')");
    expect(rejectFunction).toContain('now() >= m.lock_at');
  });

  it('pronóstico con clasificado ajeno o equipos por definir es rechazado', () => {
    expect(rejectFunction).toContain('new.predicted_qualified_team_id <> m.home_team_id and new.predicted_qualified_team_id <> m.away_team_id');
    expect(rejectFunction).toContain('m.home_team_id is null or m.away_team_id is null');
  });

  it('tercer puesto empatado puede guardar ganador oficial sin otorgar punto por clasificado', () => {
    expect(saveResultFunction).toContain("m.round = 'THIRD_PLACE'");
    expect(saveResultFunction).toContain('Seleccione quién ganó el tercer puesto');
    expect(recalculateFunction).toContain("qualified_points=case when m.round<>'THIRD_PLACE'");
  });

  it('guardado de resultado es atómico porque una sola RPC transaccional actualiza, audita y recalcula', () => {
    const updateIndex = saveResultFunction.indexOf('update matches set home_score_90');
    const auditIndex = saveResultFunction.indexOf('insert into audit_logs');
    const recalculateIndex = saveResultFunction.indexOf('perform recalculate_match_predictions(p_match_id)');
    expect(updateIndex).toBeGreaterThan(0);
    expect(auditIndex).toBeGreaterThan(updateIndex);
    expect(recalculateIndex).toBeGreaterThan(auditIndex);
  });

  it('propaga ganador y perdedor hacia partidos dependientes de forma idempotente y auditada', () => {
    expect(recalculateFunction).toContain("dep.home_source_type='WINNER'");
    expect(recalculateFunction).toContain("dep.away_source_type='WINNER'");
    expect(recalculateFunction).toContain("dep.home_source_type='LOSER'");
    expect(recalculateFunction).toContain("dep.away_source_type='LOSER'");
    expect(recalculateFunction).toContain('old_dep is distinct from new_dep');
    expect(recalculateFunction).toContain('PROPAGATE_BRACKET');
  });
});
