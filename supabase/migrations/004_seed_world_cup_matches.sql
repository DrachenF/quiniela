-- Idempotent seed for the first nine published knockout fixtures.
with team_seed(name, short_name, fifa_code, iso_code, flag_url, external_id) as (
  values
    ('Sudáfrica','Sudáfrica','RSA','ZA','https://flagcdn.com/w80/za.png','team-rsa'),
    ('Canadá','Canadá','CAN','CA','https://flagcdn.com/w80/ca.png','team-can'),
    ('Brasil','Brasil','BRA','BR','https://flagcdn.com/w80/br.png','team-bra'),
    ('Japón','Japón','JPN','JP','https://flagcdn.com/w80/jp.png','team-jpn'),
    ('Alemania','Alemania','GER','DE','https://flagcdn.com/w80/de.png','team-ger'),
    ('Paraguay','Paraguay','PAR','PY','https://flagcdn.com/w80/py.png','team-par'),
    ('Países Bajos','Países Bajos','NED','NL','https://flagcdn.com/w80/nl.png','team-ned'),
    ('Marruecos','Marruecos','MAR','MA','https://flagcdn.com/w80/ma.png','team-mar'),
    ('Costa de Marfil','Costa de Marfil','CIV','CI','https://flagcdn.com/w80/ci.png','team-civ'),
    ('Noruega','Noruega','NOR','NO','https://flagcdn.com/w80/no.png','team-nor'),
    ('Francia','Francia','FRA','FR','https://flagcdn.com/w80/fr.png','team-fra'),
    ('Suecia','Suecia','SWE','SE','https://flagcdn.com/w80/se.png','team-swe'),
    ('Estados Unidos','Estados Unidos','USA','US','https://flagcdn.com/w80/us.png','team-usa'),
    ('Bosnia y Herzegovina','Bosnia','BIH','BA','https://flagcdn.com/w80/ba.png','team-bih'),
    ('Argentina','Argentina','ARG','AR','https://flagcdn.com/w80/ar.png','team-arg'),
    ('Cabo Verde','Cabo Verde','CPV','CV','https://flagcdn.com/w80/cv.png','team-cpv'),
    ('Australia','Australia','AUS','AU','https://flagcdn.com/w80/au.png','team-aus'),
    ('Egipto','Egipto','EGY','EG','https://flagcdn.com/w80/eg.png','team-egy')
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
    ('wc2026-r32-01-rsa-can', 1, 'team-rsa', 'team-can', '2026-06-28 13:00 America/Guatemala'::timestamptz, 'BC Place', 'Vancouver'),
    ('wc2026-r32-02-bra-jpn', 2, 'team-bra', 'team-jpn', '2026-06-29 11:00 America/Guatemala'::timestamptz, 'Lumen Field', 'Seattle'),
    ('wc2026-r32-03-ger-par', 3, 'team-ger', 'team-par', '2026-06-29 14:30 America/Guatemala'::timestamptz, 'Levi''s Stadium', 'Santa Clara'),
    ('wc2026-r32-04-ned-mar', 4, 'team-ned', 'team-mar', '2026-06-29 19:00 America/Guatemala'::timestamptz, 'SoFi Stadium', 'Los Angeles'),
    ('wc2026-r32-05-civ-nor', 5, 'team-civ', 'team-nor', '2026-06-30 11:00 America/Guatemala'::timestamptz, 'Gillette Stadium', 'Foxborough'),
    ('wc2026-r32-06-fra-swe', 6, 'team-fra', 'team-swe', '2026-06-30 15:00 America/Guatemala'::timestamptz, 'MetLife Stadium', 'New York/New Jersey'),
    ('wc2026-r32-07-usa-bih', 7, 'team-usa', 'team-bih', '2026-07-01 18:00 America/Guatemala'::timestamptz, 'AT&T Stadium', 'Dallas'),
    ('wc2026-r32-08-arg-cpv', 8, 'team-arg', 'team-cpv', '2026-07-02 16:00 America/Guatemala'::timestamptz, 'Mercedes-Benz Stadium', 'Atlanta'),
    ('wc2026-r32-09-aus-egy', 9, 'team-aus', 'team-egy', '2026-07-03 12:00 America/Guatemala'::timestamptz, 'NRG Stadium', 'Houston')
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
