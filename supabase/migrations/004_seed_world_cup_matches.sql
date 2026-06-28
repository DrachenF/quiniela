-- Idempotent seed for the first nine published knockout fixtures.
with team_seed(name, short_name, fifa_code, iso_code, flag_url, external_id) as (
  values
    ('Sudáfrica','Sudáfrica','RSA','ZA','https://flagcdn.com/w80/za.png','fifa-team-RSA'),
    ('Canadá','Canadá','CAN','CA','https://flagcdn.com/w80/ca.png','fifa-team-CAN'),
    ('Brasil','Brasil','BRA','BR','https://flagcdn.com/w80/br.png','fifa-team-BRA'),
    ('Japón','Japón','JPN','JP','https://flagcdn.com/w80/jp.png','fifa-team-JPN'),
    ('Alemania','Alemania','GER','DE','https://flagcdn.com/w80/de.png','fifa-team-GER'),
    ('Paraguay','Paraguay','PAR','PY','https://flagcdn.com/w80/py.png','fifa-team-PAR'),
    ('Países Bajos','Países Bajos','NED','NL','https://flagcdn.com/w80/nl.png','fifa-team-NED'),
    ('Marruecos','Marruecos','MAR','MA','https://flagcdn.com/w80/ma.png','fifa-team-MAR'),
    ('Costa de Marfil','Costa de Marfil','CIV','CI','https://flagcdn.com/w80/ci.png','fifa-team-CIV'),
    ('Noruega','Noruega','NOR','NO','https://flagcdn.com/w80/no.png','fifa-team-NOR'),
    ('Francia','Francia','FRA','FR','https://flagcdn.com/w80/fr.png','fifa-team-FRA'),
    ('Suecia','Suecia','SWE','SE','https://flagcdn.com/w80/se.png','fifa-team-SWE'),
    ('Estados Unidos','Estados Unidos','USA','US','https://flagcdn.com/w80/us.png','fifa-team-USA'),
    ('Bosnia y Herzegovina','Bosnia','BIH','BA','https://flagcdn.com/w80/ba.png','fifa-team-BIH'),
    ('Argentina','Argentina','ARG','AR','https://flagcdn.com/w80/ar.png','fifa-team-ARG'),
    ('Cabo Verde','Cabo Verde','CPV','CV','https://flagcdn.com/w80/cv.png','fifa-team-CPV'),
    ('Australia','Australia','AUS','AU','https://flagcdn.com/w80/au.png','fifa-team-AUS'),
    ('Egipto','Egipto','EGY','EG','https://flagcdn.com/w80/eg.png','fifa-team-EGY')
)
insert into teams(name, short_name, fifa_code, iso_code, flag_url, external_id)
select name, short_name, fifa_code, iso_code, flag_url, external_id from team_seed
on conflict (external_id) do update set
  name=excluded.name,
  short_name=excluded.short_name,
  fifa_code=excluded.fifa_code,
  iso_code=excluded.iso_code,
  flag_url=excluded.flag_url,
  is_active=true,
  updated_at=now();

with fixtures(external_id, round_order, home_external_id, away_external_id, kickoff_at, stadium, city) as (
  values
    ('fifa-2026-match-73', 73, 'fifa-team-RSA', 'fifa-team-CAN', '2026-06-28 13:00 America/Guatemala'::timestamptz, 'Los Angeles Stadium', 'Inglewood'),
    ('fifa-2026-match-76', 76, 'fifa-team-BRA', 'fifa-team-JPN', '2026-06-29 11:00 America/Guatemala'::timestamptz, 'Houston Stadium', 'Houston'),
    ('fifa-2026-match-74', 74, 'fifa-team-GER', 'fifa-team-PAR', '2026-06-29 14:30 America/Guatemala'::timestamptz, 'Boston Stadium', 'Foxborough'),
    ('fifa-2026-match-75', 75, 'fifa-team-NED', 'fifa-team-MAR', '2026-06-29 19:00 America/Guatemala'::timestamptz, 'Monterrey Stadium', 'Guadalupe'),
    ('fifa-2026-match-78', 78, 'fifa-team-CIV', 'fifa-team-NOR', '2026-06-30 11:00 America/Guatemala'::timestamptz, 'Dallas Stadium', 'Arlington'),
    ('fifa-2026-match-77', 77, 'fifa-team-FRA', 'fifa-team-SWE', '2026-06-30 15:00 America/Guatemala'::timestamptz, 'New York New Jersey Stadium', 'East Rutherford'),
    ('fifa-2026-match-81', 81, 'fifa-team-USA', 'fifa-team-BIH', '2026-07-01 18:00 America/Guatemala'::timestamptz, 'San Francisco Bay Area Stadium', 'Santa Clara'),
    ('fifa-2026-match-86', 86, 'fifa-team-ARG', 'fifa-team-CPV', '2026-07-02 16:00 America/Guatemala'::timestamptz, 'Miami Stadium', 'Miami Gardens'),
    ('fifa-2026-match-88', 88, 'fifa-team-AUS', 'fifa-team-EGY', '2026-07-03 12:00 America/Guatemala'::timestamptz, 'Dallas Stadium', 'Arlington')
)
insert into matches(external_id, round, round_order, home_team_id, away_team_id, kickoff_at, stadium, city, status)
select f.external_id, 'ROUND_OF_32'::match_round, f.round_order, ht.id, at.id, f.kickoff_at, f.stadium, f.city, 'SCHEDULED'::match_status
from fixtures f
join teams ht on ht.external_id = f.home_external_id
join teams at on at.external_id = f.away_external_id
on conflict (external_id) do update set
  round=excluded.round,
  round_order=excluded.round_order,
  home_team_id=excluded.home_team_id,
  away_team_id=excluded.away_team_id,
  kickoff_at=excluded.kickoff_at,
  stadium=excluded.stadium,
  city=excluded.city,
  status=excluded.status,
  updated_at=now();
