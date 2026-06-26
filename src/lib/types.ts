export const rounds = ['ROUND_OF_32','ROUND_OF_16','QUARTER_FINAL','SEMI_FINAL','THIRD_PLACE','FINAL'] as const;
export type Round = typeof rounds[number];
export type MatchStatus = 'SCHEDULED' | 'LOCKED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
export type Outcome = 'HOME' | 'DRAW' | 'AWAY';
export type ProfileRole = 'user' | 'admin';

export type Team = {
  id: string;
  name: string;
  shortName: string;
  fifaCode?: string | null;
  isoCode?: string | null;
  flagUrl?: string | null;
  externalId?: string | null;
  isActive: boolean;
};

export type Match = {
  id: string;
  round: Round;
  roundOrder: number;
  homeTeam?: Team | null;
  awayTeam?: Team | null;
  kickoffAt?: string | null;
  lockAt?: string | null;
  stadium?: string | null;
  city?: string | null;
  status: MatchStatus;
  homeScore90?: number | null;
  awayScore90?: number | null;
  qualifiedTeamId?: string | null;
  winnerTeamId?: string | null;
  loserTeamId?: string | null;
  manuallyLocked?: boolean;
  homeSourceMatchId?: string | null;
  awaySourceMatchId?: string | null;
  homeSourceType?: 'WINNER' | 'LOSER' | null;
  awaySourceType?: 'WINNER' | 'LOSER' | null;
};

export type Prediction = {
  id?: string;
  userId: string;
  matchId: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedOutcome: Outcome;
  predictedQualifiedTeamId?: string | null;
  resultPoints: number;
  qualifiedPoints: number;
  totalPoints: number;
  calculationStatus: 'PENDING' | 'CALCULATED';
};

export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: ProfileRole;
  is_active: boolean;
  profile_completed: boolean;
};

export type PublicLeaderboardEntry = {
  position: number;
  participantName: string;
  totalPoints: number;
  exactScores: number;
  outcomes: number;
  qualified: number;
  counted: number;
};

export type TeamRow = {
  id: string;
  name: string;
  short_name: string;
  fifa_code: string | null;
  iso_code: string | null;
  flag_url: string | null;
  external_id: string | null;
  is_active: boolean;
};

export type MatchRow = {
  id: string;
  round: Round;
  round_order: number;
  home_team: TeamRow | null;
  away_team: TeamRow | null;
  kickoff_at: string | null;
  lock_at: string | null;
  stadium: string | null;
  city: string | null;
  status: MatchStatus;
  home_score_90: number | null;
  away_score_90: number | null;
  qualified_team_id: string | null;
  winner_team_id: string | null;
  loser_team_id: string | null;
  manually_locked: boolean;
  home_source_match_id: string | null;
  away_source_match_id: string | null;
  home_source_type: 'WINNER' | 'LOSER' | null;
  away_source_type: 'WINNER' | 'LOSER' | null;
};

export type PredictionRow = {
  id: string;
  user_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  predicted_outcome: Outcome;
  predicted_qualified_team_id: string | null;
  result_points: number;
  qualified_points: number;
  total_points: number;
  calculation_status: 'PENDING' | 'CALCULATED';
};

export type ProfileRow = Profile;

export type PublicLeaderboardRow = {
  position: number;
  participant_name: string;
  total_points: number;
  exact_scores: number;
  outcomes: number;
  qualified: number;
  counted: number;
};
