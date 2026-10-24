-- Noteboard: automatic version history for kv_store
--
-- Run once in Supabase → SQL Editor. Safe to re-run.
--
-- Whenever a row in kv_store is overwritten or deleted — by any device, any app
-- version, or a bug — the previous value is copied into kv_store_history first.
--   • Deletes and big drops (new value under half the old size) are ALWAYS kept.
--   • Ordinary edits keep at most one snapshot per board+key every 2 minutes,
--     so typing doesn't fill the free-tier database.
-- The public app key cannot read, change or delete this history.

create table if not exists public.kv_store_history (
  id          bigint generated always as identity primary key,
  board       text        not null,
  key         text        not null,
  value       text,
  operation   text        not null,              -- 'UPDATE' or 'DELETE'
  replaced_at timestamptz not null default now()
);

create index if not exists kv_store_history_lookup
  on public.kv_store_history (board, key, replaced_at desc);

alter table public.kv_store_history enable row level security;
revoke all on public.kv_store_history from anon, authenticated;

create or replace function public.kv_store_keep_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  last_snapshot timestamptz;
begin
  if tg_op = 'UPDATE' then
    if new.value is not distinct from old.value then
      return null;
    end if;

    select max(replaced_at) into last_snapshot
    from public.kv_store_history
    where board = old.board::text and key = old.key::text;

    if last_snapshot is not null
       and last_snapshot > now() - interval '2 minutes'
       and length(coalesce(new.value::text, '')) >= length(coalesce(old.value::text, '')) / 2 then
      return null;
    end if;
  end if;

  insert into public.kv_store_history (board, key, value, operation)
  values (old.board::text, old.key::text, old.value::text, tg_op);
  return null;
end;
$$;

drop trigger if exists kv_store_keep_history on public.kv_store;
create trigger kv_store_keep_history
  after update or delete on public.kv_store
  for each row execute function public.kv_store_keep_history();

-- ── How to use it (run these separately when needed) ──
--
-- See recent versions:
--   select id, board, key, length(value) as size, operation, replaced_at
--   from kv_store_history
--   order by replaced_at desc
--   limit 50;
--
-- Restore one version (replace 123 with the id, and board/key to match):
--   update kv_store
--   set value = (select value from kv_store_history where id = 123)
--   where board = 'mohit' and key = 'noteboard_tasks';
