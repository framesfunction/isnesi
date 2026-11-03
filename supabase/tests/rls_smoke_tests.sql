-- Run in local Supabase SQL editor / psql as database owner after db reset.
-- These are structural checks, not a substitute for end-to-end JWT/RLS tests.

do $$
begin
  if not exists(select 1 from pg_tables where schemaname='public' and tablename='content_items' and rowsecurity) then
    raise exception 'RLS missing on public.content_items';
  end if;
  if not exists(select 1 from pg_tables where schemaname='public' and tablename='general_enquiries' and rowsecurity) then
    raise exception 'RLS missing on public.general_enquiries';
  end if;
  if not exists(select 1 from pg_tables where schemaname='safeguarding' and tablename='cases') then
    raise exception 'Safeguarding cases table missing';
  end if;
  if has_table_privilege('authenticated','safeguarding.cases','SELECT') then
    raise exception 'Authenticated role unexpectedly has direct safeguarding SELECT';
  end if;
  if has_schema_privilege('authenticated','safeguarding','USAGE') then
    raise exception 'Authenticated role unexpectedly has safeguarding schema usage';
  end if;
  if not exists(select 1 from storage.buckets where id='safeguarding-private' and public=false) then
    raise exception 'Safeguarding bucket must exist and be private';
  end if;
end $$;

select 'ISNESI structural smoke tests passed' as result;
