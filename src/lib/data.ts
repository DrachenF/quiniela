import type {
  Match,
  MatchRow,
  MyLeaderboardEntry,
  MyLeaderboardRow,
  PredictionRow,
  ProfileRow,
  PublicLeaderboardEntry,
  PublicLeaderboardRow,
  Team,
  TeamRow,
} from './types';
import { createClient } from './supabase/server';

export function mapTeam(row: TeamRow | null): Team | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    fifaCode: row.fifa_code,
    isoCode: row.iso_code,
    flagUrl: row.flag_url,
    externalId: row.external_id,
    isActive: row.is_active,
  };
}

export function mapMatch(row: MatchRow): Match {
  return {
    id: row.id,
    round: row.round,
    roundOrder: row.round_order,
    homeTeam: mapTeam(row.home_team),
    awayTeam: mapTeam(row.away_team),
    kickoffAt: row.kickoff_at,
    lockAt: row.lock_at,
    stadium: row.stadium,
    city: row.city,
    status: row.status,
    homeScore90: row.home_score_90,
    awayScore90: row.away_score_90,
    qualifiedTeamId: row.qualified_team_id,
    winnerTeamId: row.winner_team_id,
    loserTeamId: row.loser_team_id,
    manuallyLocked: row.manually_locked,
    homeSourceMatchId: row.home_source_match_id,
    awaySourceMatchId: row.away_source_match_id,
    homeSourceType: row.home_source_type,
    awaySourceType: row.away_source_type,
  };
}

export function mapLeaderboardRow(row: PublicLeaderboardRow): PublicLeaderboardEntry {
  return {
    position: row.position,
    participantName: row.participant_name,
    totalPoints: row.total_points,
    exactScores: row.exact_scores,
    outcomes: row.outcomes,
    qualified: row.qualified,
    counted: row.counted,
  };
}

export async function getTeams(): Promise<TeamRow[]> {
  const sb = await createClient();
  if (!sb) return [];
  const { data, error } = await sb.from('teams').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as TeamRow[];
}

export async function getMatches(): Promise<Match[]> {
  const sb = await createClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from('matches')
    .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
    .order('round_order');
  if (error) throw error;
  return ((data ?? []) as MatchRow[]).map(mapMatch);
}

export async function getLeaderboard(limit?: number): Promise<PublicLeaderboardEntry[]> {
  const sb = await createClient();
  if (!sb) return [];
  const { data, error } = await sb.rpc('public_leaderboard');
  if (error) throw error;
  const rows = (data ?? []) as PublicLeaderboardRow[];
  return rows.slice(0, limit).map(mapLeaderboardRow);
}

export async function getMyLeaderboardEntry(): Promise<MyLeaderboardEntry | null> {
  const sb = await createClient();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb.rpc('my_leaderboard_entry');
  if (error) throw error;
  const rows = (data ?? []) as MyLeaderboardRow[];
  return rows[0] ? mapLeaderboardRow(rows[0]) : null;
}

export async function getProfile(): Promise<ProfileRow | null> {
  const sb = await createClient();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from('profiles').select('*').eq('id', user.id).single();
  return (data as ProfileRow | null) ?? null;
}

export async function getUserPredictions(userId: string): Promise<PredictionRow[]> {
  const sb = await createClient();
  if (!sb) return [];
  const { data, error } = await sb.from('predictions').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as PredictionRow[];
}
