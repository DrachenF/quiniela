import { calculateLockAt } from './scoring';
import type { Match } from './types';
const t=(id:string,name:string,iso:string)=>({id,name,shortName:name.slice(0,3).toUpperCase(),fifaCode:name.slice(0,3).toUpperCase(),isoCode:iso,isActive:true});
export const teams=[t('br','Brasil','BR'),t('fr','Francia','FR'),t('ar','Argentina','AR'),t('es','España','ES')];
export const matches:Match[]=Array.from({length:32},(_,i)=>{const round=i<16?'ROUND_OF_32':i<24?'ROUND_OF_16':i<28?'QUARTER_FINAL':i<30?'SEMI_FINAL':i===30?'THIRD_PLACE':'FINAL';const kickoff=new Date(Date.UTC(2026,5,28+i,20,0,0));return {id:`m${i+1}`,round:round as Match['round'],roundOrder:i+1,homeTeam:i<2?teams[i*2]:null,awayTeam:i<2?teams[i*2+1]:null,kickoffAt:kickoff.toISOString(),lockAt:calculateLockAt(kickoff).toISOString(),stadium:'Por definir',city:'Por definir',status:'SCHEDULED'};});
export const leaderboard=[{position:1,participantName:'Carlos',totalPoints:38,exactScores:8,outcomes:10,qualified:4,counted:22},{position:2,participantName:'Andrea',totalPoints:35,exactScores:7,outcomes:9,qualified:5,counted:21},{position:3,participantName:'José',totalPoints:33,exactScores:6,outcomes:11,qualified:4,counted:22}];
