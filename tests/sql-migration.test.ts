import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sql = readFileSync('supabase/migrations/001_init.sql', 'utf8');
const rejectFunction = sql.slice(sql.indexOf('create or replace function reject_locked_prediction'), sql.indexOf('create trigger predictions_lock'));
const recalculateFunction = sql.slice(sql.indexOf('create or replace function recalculate_match_predictions'), sql.indexOf('create or replace function public_leaderboard'));

describe('SQL migration critical logic', () => {
  it('primer INSERT de un pronóstico no utiliza OLD e inicializa puntos en cero y estado PENDING', () => {
    const insertBranch = rejectFunction.slice(rejectFunction.indexOf("TG_OP = 'INSERT'"), rejectFunction.indexOf("TG_OP = 'UPDATE'"));
    expect(insertBranch).not.toContain('old.');
    expect(insertBranch).toContain('new.result_points := 0');
    expect(insertBranch).toContain('new.qualified_points := 0');
    expect(insertBranch).toContain('new.total_points := 0');
    expect(insertBranch).toContain("new.calculation_status := 'PENDING'");
  });

  it('UPDATE conserva los puntos existentes', () => {
    const updateBranch = rejectFunction.slice(rejectFunction.indexOf("TG_OP = 'UPDATE'"));
    expect(updateBranch).toContain('new.result_points := old.result_points');
    expect(updateBranch).toContain('new.qualified_points := old.qualified_points');
    expect(updateBranch).toContain('new.total_points := old.total_points');
    expect(updateBranch).toContain('new.calculation_status := old.calculation_status');
  });

  it('pronóstico con clasificado ajeno es rechazado', () => {
    expect(rejectFunction).toContain('new.predicted_qualified_team_id <> m.home_team_id and new.predicted_qualified_team_id <> m.away_team_id');
  });

  it('pronóstico con equipos por definir es rechazado', () => {
    expect(rejectFunction).toContain('m.home_team_id is null or m.away_team_id is null');
  });

  it('propaga ganador y perdedor hacia partidos dependientes', () => {
    expect(recalculateFunction).toContain("dep.home_source_type='WINNER'");
    expect(recalculateFunction).toContain("dep.away_source_type='WINNER'");
    expect(recalculateFunction).toContain("dep.home_source_type='LOSER'");
    expect(recalculateFunction).toContain("dep.away_source_type='LOSER'");
  });

  it('propagación idempotente y auditada', () => {
    expect(recalculateFunction).toContain('old_dep is distinct from new_dep');
    expect(recalculateFunction).toContain('PROPAGATE_BRACKET');
  });
});
