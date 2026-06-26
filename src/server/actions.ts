'use server';
import { z } from 'zod';
import { validatePredictionInput } from '@/lib/scoring';
const predictionSchema=z.object({matchId:z.string(),home:z.coerce.number().int().min(0).max(20),away:z.coerce.number().int().min(0).max(20),round:z.string(),homeTeamId:z.string().nullable(),awayTeamId:z.string().nullable(),qualifiedTeamId:z.string().nullable().optional()});
export async function savePredictionAction(_:unknown, formData:FormData){ const parsed=predictionSchema.safeParse(Object.fromEntries(formData)); if(!parsed.success) return {ok:false,message:'Datos inválidos'}; try{const data=parsed.data; validatePredictionInput(data.home,data.away,data.round,data.homeTeamId,data.awayTeamId,data.qualifiedTeamId); return {ok:true,message:'Pronóstico guardado (modo demo). Con Supabase configurado se persiste en PostgreSQL.'};}catch(e){return {ok:false,message:e instanceof Error?e.message:'Error'}} }
