begin;

-- ISN-003: Edge Functions kept rate-limit counters in memory (`globalThis`),
-- so every concurrent isolate had its own bucket and the documented limits
-- (e.g. 5/h/IP on enquiry intake) were never global. Move the counters into
-- the database so they are shared across all isolates.
--
-- The Edge Functions call `app_private.consume_rate_limit()` through PostgREST
-- RPC. The table lives in app_private, is not exposed in the API schemas'
-- default views of public data, and every write runs through the security
-- definer function; there is deliberately no grant path for anon/authenticated.

create table if not exists app_private.rate_limit_buckets (
  bucket_key        text primary key,
  window_started_at timestamptz not null default now(),
  hits              int         not null default 0
);

create or replace function app_private.consume_rate_limit(
  p_bucket_key      text,
  p_limit           int,
  p_window_seconds  int
) returns boolean
language plpgsql
security definer
set search_path = app_private
as $$
declare
  v_hits int;
begin
  -- Atomic upsert: a new key starts the window with hit 1; an existing key
  -- either starts a new window (elapsed) or increments the current one. The
  -- RETURNING clause yields the post-update row, so concurrent calls are
  -- serialized on the primary key row lock.
  insert into rate_limit_buckets (bucket_key, window_started_at, hits)
    values (p_bucket_key, clock_timestamp(), 1)
  on conflict (bucket_key) do update
    set hits = case
          when rate_limit_buckets.window_started_at
                 <= clock_timestamp() - make_interval(secs => p_window_seconds)
          then 1
          else rate_limit_buckets.hits + 1
        end,
    window_started_at = case
          when rate_limit_buckets.window_started_at
                 <= clock_timestamp() - make_interval(secs => p_window_seconds)
          then clock_timestamp()
          else rate_limit_buckets.window_started_at
        end
  returning hits into v_hits;

  return v_hits <= p_limit;
end;
$$;

revoke all on function app_private.consume_rate_limit(text, int, int) from anon, authenticated;
revoke all on app_private.rate_limit_buckets from anon, authenticated;

commit;
