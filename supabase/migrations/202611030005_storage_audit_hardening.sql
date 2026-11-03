begin;

-- Create buckets idempotently. Public assets must be rights-cleared before publication.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
 ('public-media','public-media',true,10485760,array['image/jpeg','image/png','image/webp','image/avif','application/pdf']),
 ('private-documents','private-documents',false,20971520,array['application/pdf','image/jpeg','image/png']),
 ('safeguarding-private','safeguarding-private',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set
 public=excluded.public,
 file_size_limit=excluded.file_size_limit,
 allowed_mime_types=excluded.allowed_mime_types;

-- Public media upload/change is limited to media managers; public reads use the public bucket.
create policy public_media_read on storage.objects for select to anon,authenticated
using(bucket_id='public-media');
create policy media_manager_upload on storage.objects for insert to authenticated
with check(bucket_id in ('public-media','private-documents') and app_private.has_permission('media.manage'));
create policy media_manager_update on storage.objects for update to authenticated
using(bucket_id in ('public-media','private-documents') and app_private.has_permission('media.manage'))
with check(bucket_id in ('public-media','private-documents') and app_private.has_permission('media.manage'));
create policy media_manager_delete on storage.objects for delete to authenticated
using(bucket_id in ('public-media','private-documents') and app_private.has_permission('media.manage'));

-- There are intentionally NO authenticated/anon policies for safeguarding-private.
-- Server-side Edge Functions using service_role must perform authorization and access logging.

-- Audit events are append-only from clients. Trigger-generated rows are written by owner.
revoke insert,update,delete,truncate,references,trigger on public.audit_events from anon,authenticated;
create policy audit_no_client_insert on public.audit_events for insert to authenticated with check(false);
create policy audit_no_client_update on public.audit_events for update to authenticated using(false);
create policy audit_no_client_delete on public.audit_events for delete to authenticated using(false);

-- Attach audit triggers to important admin-managed tables.
do $$
declare t text;
begin
 foreach t in array array[
 'user_roles','site_settings','pages','content_items','content_approvals',
 'programmes','media_assets','partners','general_enquiries','donations',
 'finance_reconciliations','newsletter_subscribers','newsletter_campaigns','kids_resources'
 ] loop
  execute format('drop trigger if exists audit_%I on public.%I',t,t);
  execute format('create trigger audit_%I after insert or update or delete on public.%I for each row execute function app_private.audit_row_change()',t,t);
 end loop;
end $$;

-- Audit events cannot be altered/deleted by application roles, even if future grants change.
create or replace function app_private.prevent_audit_mutation()
returns trigger language plpgsql set search_path = ''
as $$ begin raise exception 'audit_events is append-only'; end $$;
create trigger audit_events_immutable before update or delete on public.audit_events
for each row execute function app_private.prevent_audit_mutation();

commit;
