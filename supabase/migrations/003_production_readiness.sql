-- Production readiness updates for existing databases. This migration is additive/idempotent and preserves data.

create or replace function set_match_lock_at() returns trigger language plpgsql security definer set search_path=public as $$
begin
  new.lock_at := case when new.kickoff_at is null then null else new.kickoff_at - interval '5 minutes' end;
  return new;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'matches' and column_name = 'lock_at' and is_generated <> 'NEVER'
  ) then
    alter table matches drop column lock_at;
    alter table matches add column lock_at timestamptz;
  end if;
end $$;

update matches set lock_at = case when kickoff_at is null then null else kickoff_at - interval '5 minutes' end;

drop trigger if exists matches_set_lock_at on matches;
create trigger matches_set_lock_at before insert or update of kickoff_at on matches for each row execute function set_match_lock_at();

create or replace function public_leaderboard() returns table("position" bigint, participant_name text, total_points bigint, exact_scores bigint, outcomes bigint, qualified bigint, counted bigint) language sql stable security definer set search_path=public as $$
  with agg as (
    select
      p.id,
      p.first_name,
      p.created_at,
      coalesce(sum(pr.total_points) filter (where pr.calculation_status='CALCULATED'),0)::bigint total_points,
      count(pr.id) filter(where pr.calculation_status='CALCULATED' and pr.result_points=3)::bigint exact_scores,
      count(pr.id) filter(where pr.calculation_status='CALCULATED' and pr.result_points=1)::bigint outcomes,
      count(pr.id) filter(where pr.calculation_status='CALCULATED' and pr.qualified_points=1)::bigint qualified,
      count(pr.id) filter(where pr.calculation_status='CALCULATED')::bigint counted
    from profiles p
    left join predictions pr on pr.user_id=p.id
    where p.is_active and p.profile_completed
    group by p.id,p.first_name,p.created_at
  ), ranked as (
    select *, row_number() over(order by total_points desc, exact_scores desc, outcomes desc, qualified desc, created_at asc, id asc) ranking_position from agg
  )
  select ranking_position as "position", first_name, total_points, exact_scores, outcomes, qualified, counted from ranked order by ranking_position
$$;

create or replace function my_leaderboard_entry() returns table("position" bigint, participant_name text, total_points bigint, exact_scores bigint, outcomes bigint, qualified bigint, counted bigint) language sql stable security definer set search_path=public as $$
  select ranked."position", ranked.participant_name, ranked.total_points, ranked.exact_scores, ranked.outcomes, ranked.qualified, ranked.counted
  from (
    with agg as (
      select
        p.id,
        p.first_name,
        p.created_at,
        coalesce(sum(pr.total_points) filter (where pr.calculation_status='CALCULATED'),0)::bigint total_points,
        count(pr.id) filter(where pr.calculation_status='CALCULATED' and pr.result_points=3)::bigint exact_scores,
        count(pr.id) filter(where pr.calculation_status='CALCULATED' and pr.result_points=1)::bigint outcomes,
        count(pr.id) filter(where pr.calculation_status='CALCULATED' and pr.qualified_points=1)::bigint qualified,
        count(pr.id) filter(where pr.calculation_status='CALCULATED')::bigint counted
      from profiles p
      left join predictions pr on pr.user_id=p.id
      where p.is_active and p.profile_completed
      group by p.id,p.first_name,p.created_at
    )
    select row_number() over(order by total_points desc, exact_scores desc, outcomes desc, qualified desc, created_at asc, id asc) as "position", id, first_name as participant_name, total_points, exact_scores, outcomes, qualified, counted
    from agg
  ) ranked
  where ranked.id = auth.uid()
$$;
