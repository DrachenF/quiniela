create extension if not exists pgcrypto;
create type profile_role as enum ('user','admin');
create type match_round as enum ('ROUND_OF_32','ROUND_OF_16','QUARTER_FINAL','SEMI_FINAL','THIRD_PLACE','FINAL');
create type match_status as enum ('SCHEDULED','LOCKED','LIVE','FINISHED','POSTPONED','CANCELLED');
create type prediction_outcome as enum ('HOME','DRAW','AWAY');
create table profiles(id uuid primary key references auth.users(id) on delete cascade, first_name text not null default '', last_name text not null default '', email text not null, avatar_url text, role profile_role not null default 'user', is_active boolean not null default true, profile_completed boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), last_login_at timestamptz);
create table teams(id uuid primary key default gen_random_uuid(), name text not null, short_name text not null, fifa_code text, iso_code text, flag_url text, external_id text unique, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table matches(id uuid primary key default gen_random_uuid(), external_id text unique, round match_round not null, round_order int not null, home_team_id uuid references teams(id), away_team_id uuid references teams(id), kickoff_at timestamptz, lock_at timestamptz generated always as (case when kickoff_at is null then null else kickoff_at - interval '5 minutes' end) stored, stadium text, city text, status match_status not null default 'SCHEDULED', home_score_90 int check(home_score_90 between 0 and 20), away_score_90 int check(away_score_90 between 0 and 20), qualified_team_id uuid references teams(id), winner_team_id uuid references teams(id), loser_team_id uuid references teams(id), home_source_match_id uuid references matches(id), away_source_match_id uuid references matches(id), home_source_type text check(home_source_type in ('WINNER','LOSER')), away_source_type text check(away_source_type in ('WINNER','LOSER')), manually_edited boolean not null default false, manually_locked boolean not null default false, sync_error text, last_synced_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table predictions(id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id) on delete cascade, match_id uuid not null references matches(id) on delete cascade, predicted_home_score int not null check(predicted_home_score between 0 and 20), predicted_away_score int not null check(predicted_away_score between 0 and 20), predicted_outcome prediction_outcome not null, predicted_qualified_team_id uuid references teams(id), result_points int not null default 0, qualified_points int not null default 0, total_points int not null default 0, calculation_status text not null default 'PENDING', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,match_id));
create table audit_logs(id bigserial primary key, admin_user_id uuid references profiles(id), action text not null, entity text not null, entity_id text, old_value jsonb, new_value jsonb, ip_address inet, context jsonb, created_at timestamptz not null default now());
create table app_settings(key text primary key, value jsonb not null, updated_at timestamptz not null default now());
create index on matches(kickoff_at); create index on matches(round); create index on predictions(user_id); create index on predictions(match_id);
create or replace function is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin' and is_active) $$;
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into profiles(id,first_name,last_name,email,avatar_url,profile_completed) values(new.id, coalesce(new.raw_user_meta_data->>'first_name', split_part(coalesce(new.raw_user_meta_data->>'full_name',''),' ',1),''), coalesce(new.raw_user_meta_data->>'last_name',''), new.email, new.raw_user_meta_data->>'avatar_url', (coalesce(new.raw_user_meta_data->>'first_name','')<>'' and coalesce(new.raw_user_meta_data->>'last_name','')<>'')) on conflict(id) do nothing; return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
create or replace function reject_locked_prediction() returns trigger language plpgsql security definer set search_path=public as $$
declare
  m matches;
  p profiles;
begin
  select * into m from matches where id = new.match_id;
  if not found then raise exception 'Partido no encontrado'; end if;
  select * into p from profiles where id = new.user_id;
  if not found or p.is_active is not true or p.profile_completed is not true then raise exception 'Perfil incompleto o inactivo'; end if;
  if m.home_team_id is null or m.away_team_id is null then raise exception 'No se puede pronosticar equipos Por definir'; end if;
  if m.lock_at is null or now() >= m.lock_at or m.manually_locked or m.status in ('LOCKED','LIVE','FINISHED','CANCELLED') then raise exception 'Pronóstico cerrado'; end if;
  if new.predicted_home_score > new.predicted_away_score then
    if new.predicted_outcome <> 'HOME' then raise exception 'Pronóstico inconsistente'; end if;
    new.predicted_qualified_team_id := case when m.round = 'THIRD_PLACE' then null else m.home_team_id end;
  elsif new.predicted_home_score < new.predicted_away_score then
    if new.predicted_outcome <> 'AWAY' then raise exception 'Pronóstico inconsistente'; end if;
    new.predicted_qualified_team_id := case when m.round = 'THIRD_PLACE' then null else m.away_team_id end;
  else
    if new.predicted_outcome <> 'DRAW' then raise exception 'Pronóstico inconsistente'; end if;
    if m.round = 'THIRD_PLACE' then
      new.predicted_qualified_team_id := null;
    elsif new.predicted_qualified_team_id is null then
      raise exception 'Seleccione quién clasifica';
    elsif new.predicted_qualified_team_id <> m.home_team_id and new.predicted_qualified_team_id <> m.away_team_id then
      raise exception 'El equipo clasificado debe ser local o visitante';
    end if;
  end if;
  if TG_OP = 'INSERT' then
    new.result_points := 0; new.qualified_points := 0; new.total_points := 0; new.calculation_status := 'PENDING';
  elsif TG_OP = 'UPDATE' then
    new.result_points := old.result_points; new.qualified_points := old.qualified_points; new.total_points := old.total_points; new.calculation_status := old.calculation_status;
  end if;
  return new;
end $$;
create trigger predictions_lock before insert or update on predictions for each row execute function reject_locked_prediction();
create or replace function recalculate_match_predictions(p_match_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare
  m matches;
  computed_winner_team_id uuid;
  computed_loser_team_id uuid;
  dep matches;
  old_dep jsonb;
  new_dep jsonb;
begin
  select * into m from matches where id = p_match_id;
  if not found then raise exception 'Partido no encontrado'; end if;
  if m.status <> 'FINISHED' then raise exception 'El partido no está finalizado'; end if;
  if m.home_team_id is null or m.away_team_id is null or m.home_score_90 is null or m.away_score_90 is null then raise exception 'Resultado incompleto'; end if;
  if m.round = 'THIRD_PLACE' then
    computed_winner_team_id := case when m.home_score_90 > m.away_score_90 then m.home_team_id when m.away_score_90 > m.home_score_90 then m.away_team_id else null end;
  elsif m.home_score_90 > m.away_score_90 then computed_winner_team_id := m.home_team_id;
  elsif m.away_score_90 > m.home_score_90 then computed_winner_team_id := m.away_team_id;
  else computed_winner_team_id := m.qualified_team_id;
  end if;
  if computed_winner_team_id is null or (computed_winner_team_id <> m.home_team_id and computed_winner_team_id <> m.away_team_id) then raise exception 'Ganador inválido'; end if;
  computed_loser_team_id := case when computed_winner_team_id = m.home_team_id then m.away_team_id else m.home_team_id end;
  update matches set winner_team_id = computed_winner_team_id, loser_team_id = computed_loser_team_id, updated_at = now() where id = p_match_id and (winner_team_id is distinct from computed_winner_team_id or loser_team_id is distinct from computed_loser_team_id);
  update predictions p set result_points=case when p.predicted_home_score=m.home_score_90 and p.predicted_away_score=m.away_score_90 then 3 when (p.predicted_home_score>p.predicted_away_score and m.home_score_90>m.away_score_90) or (p.predicted_home_score<p.predicted_away_score and m.home_score_90<m.away_score_90) or (p.predicted_home_score=p.predicted_away_score and m.home_score_90=m.away_score_90) then 1 else 0 end, qualified_points=case when m.round<>'THIRD_PLACE' and p.predicted_qualified_team_id=computed_winner_team_id then 1 else 0 end, total_points=case when p.predicted_home_score=m.home_score_90 and p.predicted_away_score=m.away_score_90 then 3 when (p.predicted_home_score>p.predicted_away_score and m.home_score_90>m.away_score_90) or (p.predicted_home_score<p.predicted_away_score and m.home_score_90<m.away_score_90) or (p.predicted_home_score=p.predicted_away_score and m.home_score_90=m.away_score_90) then 1 else 0 end + case when m.round<>'THIRD_PLACE' and p.predicted_qualified_team_id=computed_winner_team_id then 1 else 0 end, calculation_status='CALCULATED', updated_at=now() where p.match_id=p_match_id;
  for dep in select * from matches where home_source_match_id = p_match_id or away_source_match_id = p_match_id loop
    old_dep := to_jsonb(dep);
    update matches set home_team_id=case when dep.home_source_match_id=p_match_id and dep.home_source_type='WINNER' then computed_winner_team_id when dep.home_source_match_id=p_match_id and dep.home_source_type='LOSER' then computed_loser_team_id else home_team_id end, away_team_id=case when dep.away_source_match_id=p_match_id and dep.away_source_type='WINNER' then computed_winner_team_id when dep.away_source_match_id=p_match_id and dep.away_source_type='LOSER' then computed_loser_team_id else away_team_id end, updated_at=now() where id=dep.id and ((dep.home_source_match_id=p_match_id and dep.home_source_type in ('WINNER','LOSER')) or (dep.away_source_match_id=p_match_id and dep.away_source_type in ('WINNER','LOSER'))) and (home_team_id is distinct from case when dep.home_source_match_id=p_match_id and dep.home_source_type='WINNER' then computed_winner_team_id when dep.home_source_match_id=p_match_id and dep.home_source_type='LOSER' then computed_loser_team_id else home_team_id end or away_team_id is distinct from case when dep.away_source_match_id=p_match_id and dep.away_source_type='WINNER' then computed_winner_team_id when dep.away_source_match_id=p_match_id and dep.away_source_type='LOSER' then computed_loser_team_id else away_team_id end) returning to_jsonb(matches) into new_dep;
    if new_dep is not null and old_dep is distinct from new_dep then insert into audit_logs(action,entity,entity_id,old_value,new_value,context) values('PROPAGATE_BRACKET','matches',dep.id::text,old_dep,new_dep,jsonb_build_object('source_match_id',p_match_id)); end if;
  end loop;
  insert into audit_logs(action,entity,entity_id,new_value) values('RECALCULATE','matches',p_match_id::text,jsonb_build_object('winner_team_id',computed_winner_team_id,'loser_team_id',computed_loser_team_id));
end $$;
create or replace function public_leaderboard() returns table(position bigint, participant_name text, total_points bigint, exact_scores bigint, outcomes bigint, qualified bigint, counted bigint) language sql stable security definer set search_path=public as $$ with agg as (select p.id, p.first_name, coalesce(sum(pr.total_points),0) total_points, count(*) filter(where pr.result_points=3) exact_scores, count(*) filter(where pr.result_points=1) outcomes, count(*) filter(where pr.qualified_points=1) qualified, count(*) filter(where pr.calculation_status='CALCULATED') counted from profiles p join predictions pr on pr.user_id=p.id where p.is_active and p.profile_completed and pr.calculation_status='CALCULATED' group by p.id,p.first_name having coalesce(sum(pr.total_points),0)>0), ranked as (select *, rank() over(order by total_points desc, exact_scores desc, outcomes desc, qualified desc) position from agg) select position, first_name, total_points, exact_scores, outcomes, qualified, counted from ranked order by position $$;
alter table profiles enable row level security; alter table teams enable row level security; alter table matches enable row level security; alter table predictions enable row level security; alter table audit_logs enable row level security;
create policy profiles_own_read on profiles for select using(id=auth.uid() or is_admin()); create policy profiles_own_update on profiles for update using(id=auth.uid()) with check(id=auth.uid() and role=(select role from profiles where id=auth.uid()) and is_active=(select is_active from profiles where id=auth.uid()));
create policy teams_read on teams for select using(true); create policy teams_admin on teams for all using(is_admin()) with check(is_admin());
create policy matches_read on matches for select using(true); create policy matches_admin on matches for all using(is_admin()) with check(is_admin());
create policy predictions_own_read on predictions for select using(user_id=auth.uid() or is_admin()); create policy predictions_insert on predictions for insert with check(user_id=auth.uid()); create policy predictions_update on predictions for update using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy audit_admin_read on audit_logs for select using(is_admin()); create policy audit_admin_insert on audit_logs for insert with check(is_admin());
