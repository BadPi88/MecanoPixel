create table if not exists public.run_verifications (
  run_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  rules_version integer not null check (rules_version > 0),
  verified_at timestamptz not null default now()
);

alter table public.run_verifications enable row level security;
revoke all on public.run_verifications from anon, authenticated;

revoke all on function public.submit_run_score(text, text, integer, integer, integer, integer, integer, text) from public, anon, authenticated;

create or replace function public.submit_verified_run_score(
  p_run_id uuid,
  p_rules_version integer,
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
  if current_user_id is null then raise exception 'Sesion requerida'; end if;
  if p_rules_version <> 1 then raise exception 'Version de reglas no soportada'; end if;
  if p_mode not in ('global', 'daily', 'weekly') or
     (p_mode = 'global' and p_challenge_key <> '') or
     (p_mode in ('daily', 'weekly') and p_challenge_key !~ '^\d{4}-\d{2}-\d{2}$') then
    raise exception 'Modo o clave de reto invalida';
  end if;
  if p_score not between 0 and 1000000 or p_wpm not between 0 and 500 or
     p_words_typed not between 0 and 200000 or p_elapsed_ms not between 0 and 3600000 or
     p_floor_reached not between 0 and 999 then raise exception 'Puntuacion fuera de rango'; end if;

  insert into public.run_verifications(run_id, user_id, rules_version)
  values (p_run_id, current_user_id, p_rules_version) on conflict do nothing;
  if not found then return false; end if;

  insert into public.run_scores(user_id, mode, challenge_key, score, wpm, words_typed, elapsed_ms, floor_reached, runner_id)
  values (current_user_id, p_mode, p_challenge_key, p_score, p_wpm, p_words_typed, p_elapsed_ms, p_floor_reached, left(p_runner_id, 16))
  on conflict (user_id, mode, challenge_key) do update set
    score = excluded.score, wpm = excluded.wpm, words_typed = excluded.words_typed,
    elapsed_ms = excluded.elapsed_ms, floor_reached = excluded.floor_reached,
    runner_id = excluded.runner_id, updated_at = now()
  where excluded.score > public.run_scores.score;
  return found;
end;
$$;

revoke all on function public.submit_verified_run_score(uuid, integer, text, text, integer, integer, integer, integer, integer, text) from public, anon;
grant execute on function public.submit_verified_run_score(uuid, integer, text, text, integer, integer, integer, integer, integer, text) to authenticated;
