import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sql = readFileSync('supabase/migrations/001_init.sql', 'utf8');

describe('database prediction/result safeguards', () => {
  it('usa TG_OP para no leer OLD durante INSERT y fija puntos pendientes', () => {
    expect(sql).toContain("if TG_OP = 'INSERT' then");
    expect(sql).toContain('new.result_points := 0;');
    expect(sql).toContain("new.calculation_status := 'PENDING';");
    expect(sql).toContain("elsif TG_OP = 'UPDATE' then");
    expect(sql).toContain('new.result_points := old.result_points;');
  });

  it('verifica que el clasificado pronosticado pertenezca al partido', () => {
    expect(sql).toContain('new.predicted_qualified_team_id <> m.home_team_id');
    expect(sql).toContain('new.predicted_qualified_team_id <> m.away_team_id');
  });

  it('propaga ganador y perdedor mediante columnas source de forma idempotente', () => {
    expect(sql).toContain('dependent.home_source_match_id = p_match_id');
    expect(sql).toContain("dependent.home_source_type = 'WINNER'");
    expect(sql).toContain("dependent.home_source_type = 'LOSER'");
    expect(sql).toContain('dependent.away_source_match_id = p_match_id');
    expect(sql).toContain("dependent.away_source_type = 'WINNER'");
    expect(sql).toContain("dependent.away_source_type = 'LOSER'");
    expect(sql).toContain('else dependent.home_team_id');
    expect(sql).toContain('else dependent.away_team_id');
  });
});
