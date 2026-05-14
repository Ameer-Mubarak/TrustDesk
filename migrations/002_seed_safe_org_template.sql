insert into public.organizations (id, name, slug, domain, created_by)
select '00000000-0000-0000-0000-000000000001', 'Seed TrustDesk Workspace', 'seed-trustdesk-workspace', 'example.com', id
from auth.users
where email = 'seed-owner@example.com'
on conflict (id) do nothing;

insert into public.organization_members (organization_id, user_id, role)
select '00000000-0000-0000-0000-000000000001', id, 'owner'
from auth.users
where email = 'seed-owner@example.com'
on conflict do nothing;

insert into public.subscriptions (organization_id, plan, status, seats)
values ('00000000-0000-0000-0000-000000000001', 'enterprise', 'trialing', 25)
on conflict do nothing;
