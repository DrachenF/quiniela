insert into app_settings(key,value) values ('scoring','{"exact":3,"outcome":1,"qualified":1}'::jsonb) on conflict (key) do update set value=excluded.value, updated_at=now();
