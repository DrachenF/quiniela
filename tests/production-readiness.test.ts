import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { rankRows } from '../src/lib/leaderboard';

const nav = readFileSync('src/components/nav.tsx', 'utf8');
const home = readFileSync('src/app/page.tsx', 'utf8');
const matchCard = readFileSync('src/components/match-card.tsx', 'utf8');
const clasificacion = readFileSync('src/app/clasificacion/page.tsx', 'utf8');
const initSql = readFileSync('supabase/migrations/001_init.sql', 'utf8');
const prodSql = readFileSync('supabase/migrations/003_production_readiness.sql', 'utf8');
const seedSql = readFileSync('supabase/migrations/004_seed_world_cup_matches.sql', 'utf8');

describe('production readiness UI', () => {
  it('usuario conectado no ve Crear cuenta y sí ve Ir a mis pronósticos', () => {
    expect(home).toContain("{profile ? (");
    expect(home).toContain('Ir a mis pronósticos');
    expect(home.indexOf('Crear cuenta')).toBeGreaterThan(home.indexOf(': ('));
  });

  it('logo conduce a /quiniela cuando hay sesión', () => {
    expect(nav).toContain("href={profile ? '/quiniela' : '/'}");
  });

  it('banderas usan flagUrl con img estable y fallback por isoCode', () => {
    expect(matchCard).toContain('flagUrl && !failed');
    expect(matchCard).toContain('src={flagUrl}');
    expect(matchCard).toContain('width={48}');
    expect(matchCard).toContain('height={32}');
    expect(matchCard).toContain("style={{ objectFit: 'cover' }}");
    expect(matchCard).toContain('onError={() => setFailed(true)}');
    expect(matchCard).toContain('flag(isoCode)');
  });

  it('ranking muestra máximo 10 participantes y Mi posición', () => {
    expect(clasificacion).toContain('getLeaderboard(10)');
    expect(clasificacion).toContain('Mi posición');
    expect(clasificacion).toContain('myEntry.participantName');
    expect(clasificacion).toContain('myEntry.position');
    expect(clasificacion).toContain('myEntry.totalPoints');
  });
});

describe('production readiness SQL', () => {
  it('un usuario con cero puntos aparece en la clasificación', () => {
    expect(initSql).toContain('left join predictions pr on pr.user_id=p.id');
    expect(initSql).toContain("where p.is_active and p.profile_completed");
    expect(initSql).not.toContain('having coalesce(sum(pr.total_points),0)>0');
  });

  it('no expone apellido, correo ni UUID en funciones de leaderboard', () => {
    const leaderboardSql = initSql.slice(initSql.indexOf('create or replace function public_leaderboard'));
    expect(leaderboardSql).toContain('participant_name text');
    expect(leaderboardSql).toContain('first_name');
    expect(leaderboardSql).not.toContain('last_name');
    expect(leaderboardSql).not.toContain('email');
  });

  it('la migración usa trigger para lock_at', () => {
    expect(initSql).toContain('lock_at timestamptz');
    expect(initSql).not.toContain('generated always');
    expect(initSql).toContain('create or replace function set_match_lock_at()');
    expect(initSql).toContain('before insert or update of kickoff_at on matches');
    expect(prodSql).toContain('drop trigger if exists matches_set_lock_at on matches');
  });

  it('evita position como alias interno sin comillas', () => {
    expect(initSql).toContain('ranking_position');
    expect(initSql).toContain('ranking_position as "position"');
    expect(initSql).not.toMatch(/\) position from agg/);
  });

  it('seeds son idempotentes por external_id y ON CONFLICT', () => {
    expect(seedSql).toContain('external_id');
    expect(seedSql).toContain('on conflict (external_id) do update');
    expect(seedSql).toContain("insert into teams(name, short_name, fifa_code, iso_code, flag_url, external_id)");
    expect(seedSql).toContain('insert into matches(external_id, round, round_order, home_team_id, away_team_id, kickoff_at, stadium, city, status)');
  });

  it('usa los external_id oficiales fifa-team-* y fifa-2026-match-*', () => {
    const teamIds = [
      'fifa-team-RSA',
      'fifa-team-CAN',
      'fifa-team-BRA',
      'fifa-team-JPN',
      'fifa-team-GER',
      'fifa-team-PAR',
      'fifa-team-NED',
      'fifa-team-MAR',
      'fifa-team-CIV',
      'fifa-team-NOR',
      'fifa-team-FRA',
      'fifa-team-SWE',
      'fifa-team-USA',
      'fifa-team-BIH',
      'fifa-team-ARG',
      'fifa-team-CPV',
      'fifa-team-AUS',
      'fifa-team-EGY',
    ];
    const matchIds = [
      'fifa-2026-match-73',
      'fifa-2026-match-74',
      'fifa-2026-match-75',
      'fifa-2026-match-76',
      'fifa-2026-match-77',
      'fifa-2026-match-78',
      'fifa-2026-match-81',
      'fifa-2026-match-86',
      'fifa-2026-match-88',
    ];

    for (const externalId of teamIds) expect(seedSql).toContain(externalId);
    for (const externalId of matchIds) expect(seedSql).toContain(externalId);
    expect(seedSql).not.toContain('team-rsa');
    expect(seedSql).not.toContain('wc2026-r32-');
  });

  it('usa estadios, ciudades y round_order oficiales para cada fixture', () => {
    const fixtures = [
      ["'fifa-2026-match-73', 73", 'Los Angeles Stadium', 'Inglewood'],
      ["'fifa-2026-match-76', 76", 'Houston Stadium', 'Houston'],
      ["'fifa-2026-match-74', 74", 'Boston Stadium', 'Foxborough'],
      ["'fifa-2026-match-75', 75", 'Monterrey Stadium', 'Guadalupe'],
      ["'fifa-2026-match-78', 78", 'Dallas Stadium', 'Arlington'],
      ["'fifa-2026-match-77', 77", 'New York New Jersey Stadium', 'East Rutherford'],
      ["'fifa-2026-match-81', 81", 'San Francisco Bay Area Stadium', 'Santa Clara'],
      ["'fifa-2026-match-86', 86", 'Miami Stadium', 'Miami Gardens'],
      ["'fifa-2026-match-88', 88", 'Dallas Stadium', 'Arlington'],
    ];

    for (const [matchAndOrder, stadium, city] of fixtures) {
      expect(seedSql).toContain(matchAndOrder);
      expect(seedSql).toContain(stadium);
      expect(seedSql).toContain(city);
    }
    expect(seedSql).toContain("'ROUND_OF_32'::match_round");
    expect(seedSql).toContain("'SCHEDULED'::match_status");
    expect(seedSql).toContain('::timestamptz');
  });
});

describe('leaderboard ranking helper', () => {
  it('ordena usuarios con cero puntos de forma estable dentro de sus estadísticas', () => {
    const ranked = rankRows([
      { participantName: 'Francis', totalPoints: 0, exactScores: 0, outcomes: 0, qualified: 0, counted: 0 },
    ]);
    expect(ranked[0]).toMatchObject({ participantName: 'Francis', position: 1, totalPoints: 0 });
  });
});
