begin;

insert into public.permissions(key, description)
values ('centers.manage', 'Manage center locations')
on conflict (key) do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key = 'centers.manage'
where r.key in ('super_admin', 'website_admin')
on conflict (role_id, permission_id) do nothing;

commit;
