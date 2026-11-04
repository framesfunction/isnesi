-- Editorial workflow transitions in the application layer are driven by the
-- content.review and content.publish permissions. The base grants in
-- 202611030002_cms_editorial.sql only let authors (content.create) and
-- content.edit_any holders update content_items, which would block a reviewer
-- or publisher who does not hold either: a reviewer could record an approval
-- row but never move the item out of `in_review`, and a publisher could not
-- flip someone else's approved work to `published`.
--
-- These policies deliberately grant UPDATE only (never insert or delete):
-- creation stays with content.create/edit_any, so a reviewer or publisher can
-- never mint content.

create policy cms_reviewer_transition on public.content_items
for update to authenticated
using (app_private.has_permission('content.review') or app_private.has_permission('content.publish'))
with check (app_private.has_permission('content.review') or app_private.has_permission('content.publish'));

create policy cms_publisher_transition on public.content_items
for update to authenticated
using (app_private.has_permission('content.publish'))
with check (app_private.has_permission('content.publish'));
