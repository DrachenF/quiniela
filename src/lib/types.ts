export const rounds = ['ROUND_OF_32','ROUND_OF_16','QUARTER_FINAL','SEMI_FINAL','THIRD_PLACE','FINAL'] as const;
export type Round = typeof rounds[number];
export type MatchStatus='SCHEDULED'|'LOCKED'|'LIVE'|'FINISHED'|'POSTPONED'|'CANCELLED';
export type Outcome='HOME'|'DRAW'|'AWAY';
export type Team={id:string;name:string;shortName:string;fifaCode:string;isoCode:string;flagUrl?:string;isActive:boolean};
export type Match={id:string;round:Round;roundOrder:number;homeTeam?:Team|null;awayTeam?:Team|null;kickoffAt:string;lockAt:string;stadium?:string;city?:string;status:MatchStatus;homeScore90?:number|null;awayScore90?:number|null;qualifiedTeamId?:string|null;winnerTeamId?:string|null;loserTeamId?:string|null;manuallyLocked?:boolean;homeSourceMatchId?:string|null;awaySourceMatchId?:string|null;homeSourceType?:'WINNER'|'LOSER'|null;awaySourceType?:'WINNER'|'LOSER'|null};
export type Prediction={userId:string;matchId:string;predictedHomeScore:number;predictedAwayScore:number;predictedOutcome:Outcome;predictedQualifiedTeamId?:string|null;resultPoints:number;qualifiedPoints:number;totalPoints:number;calculationStatus:'PENDING'|'CALCULATED'};
