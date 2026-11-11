create table if not exists public.player_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_display_name_format check (
    display_name ~ '^[A-Za-z0-9 _-]{2,16}$'
  )
);

create unique index if not exists player_profiles_display_name_ci
  on public.player_profiles (lower(display_name));

alter table public.player_profiles enable row level security;

create policy "Players can read their own profile"
  on public.player_profiles for select to authenticated
  using (user_id = auth.uid());

create policy "Players can update their own profile"
  on public.player_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, update on public.player_profiles to authenticated;

create or replace function public.create_player_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_name text := trim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  requested_meta jsonb := new.raw_user_meta_data -> 'initial_meta';
begin
  if requested_name !~ '^[A-Za-z0-9 _-]{2,16}$' then
    raise exception 'El nombre debe tener entre 2 y 16 caracteres permitidos';
  end if;

  if requested_meta is null or jsonb_typeof(requested_meta) <> 'object' then
    requested_meta := '{}'::jsonb;
  end if;

  insert into public.player_profiles(user_id, display_name, meta)
  values (new.id, requested_name, requested_meta);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_keyrunner on auth.users;
create trigger on_auth_user_created_keyrunner
  after insert on auth.users
  for each row execute procedure public.create_player_profile();

create table if not exists public.run_scores (
  user_id uuid not null references public.player_profiles(user_id) on delete cascade,
  mode text not null check (mode in ('global', 'daily', 'weekly')),
  challenge_key text not null default '',
  score integer not null check (score between 0 and 1000000),
  wpm integer not null check (wpm between 0 and 500),
  words_typed integer not null check (words_typed between 0 and 1000000),
  elapsed_ms integer not null check (elapsed_ms between 0 and 3600000),
  floor_reached integer not null default 0 check (floor_reached between 0 and 999),
  runner_id text,
  updated_at timestamptz not null default now(),
  primary key (user_id, mode, challenge_key),
  constraint run_scores_challenge_key_format check (
    (mode = 'global' and challenge_key = '') or
    (mode = 'daily' and challenge_key ~ '^\d{4}-\d{2}-\d{2}$') or
    (mode = 'weekly' and challenge_key ~ '^\d{4}-\d{2}-\d{2}$')
  )
);

alter table public.run_scores enable row level security;
revoke all on public.run_scores from anon, authenticated;
revoke all on public.player_profiles from anon;

create or replace function public.submit_run_score(
  p_mode text,
  p_challenge_key text,
  p_score integer,
  p_wpm integer,
  p_words_typed integer,
  p_elapsed_ms integer,
  p_floor_reached integer,
  p_runner_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Inicia sesion para guardar puntuaciones';
  end if;
  if p_mode not in ('global', 'daily', 'weekly') then
    raise exception 'Modo de ranking invalido';
  end if;
  if (p_mode = 'global' and p_challenge_key <> '') then
    raise exception 'La clave global debe estar vacia';
  end if;
  if p_mode = 'daily' and p_challenge_key <> to_char(now() at time zone 'utc', 'YYYY-MM-DD') then
    raise exception 'El reto diario ya no esta activo';
  end if;
  if p_mode = 'weekly' and p_challenge_key <> to_char(date_trunc('week', now() at time zone 'utc'), 'YYYY-MM-DD') then
    raise exception 'El reto semanal ya no esta activo';
  end if;
  if p_score not between 0 and 1000000 or p_wpm not between 0 and 500 or
     p_words_typed not between 0 and 1000000 or p_elapsed_ms not between 0 and 3600000 or
     p_floor_reached not between 0 and 999 then
    raise exception 'Puntuacion fuera de rango';
  end if;

  insert into public.run_scores(user_id, mode, challenge_key, score, wpm, words_typed, elapsed_ms, floor_reached, runner_id)
  values (current_user_id, p_mode, p_challenge_key, p_score, p_wpm, p_words_typed, p_elapsed_ms, p_floor_reached, left(p_runner_id, 16))
  on conflict (user_id, mode, challenge_key) do update set
    score = excluded.score,
    wpm = excluded.wpm,
    words_typed = excluded.words_typed,
    elapsed_ms = excluded.elapsed_ms,
    floor_reached = excluded.floor_reached,
    runner_id = excluded.runner_id,
    updated_at = now()
  where excluded.score > public.run_scores.score;

  return found;
end;
$$;

create or replace function public.leaderboard_top(p_mode text, p_challenge_key text)
returns table (
  player_name text,
  score integer,
  wpm integer,
  words_typed integer,
  elapsed_ms integer,
  floor_reached integer,
  runner_id text,
  updated_at timestamptz,
  player_rank bigint,
  total_players bigint,
  is_you boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select p.display_name, s.score, s.wpm, s.words_typed, s.elapsed_ms,
      s.floor_reached, s.runner_id, s.updated_at,
      row_number() over (order by s.score desc, s.updated_at asc) as rank_value,
      count(*) over () as total_value,
      (s.user_id = auth.uid()) as is_current_user
    from public.run_scores s
    join public.player_profiles p on p.user_id = s.user_id
    where s.mode = p_mode and s.challenge_key = p_challenge_key
  )
  select display_name, ranked.score, ranked.wpm, ranked.words_typed,
    ranked.elapsed_ms, ranked.floor_reached, ranked.runner_id, ranked.updated_at,
    ranked.rank_value, ranked.total_value, ranked.is_current_user
  from ranked
  where rank_value <= 10 or is_current_user
  order by rank_value;
$$;

grant execute on function public.submit_run_score(text, text, integer, integer, integer, integer, integer, text) to authenticated;
grant execute on function public.leaderboard_top(text, text) to anon, authenticated;
