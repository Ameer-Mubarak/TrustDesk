create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'admin', 'analyst', 'viewer');
create type public.vendor_status as enum ('prospect', 'reviewing', 'approved', 'restricted', 'offboarded');
create type public.risk_rating as enum ('low', 'medium', 'high', 'critical');
create type public.assessment_status as enum ('draft', 'in_review', 'approved', 'rejected');
create type public.task_status as enum ('open', 'in_progress', 'blocked', 'done');
create type public.billing_plan as enum ('starter', 'growth', 'enterprise');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 140),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  domain text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'analyst',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  role public.member_role not null default 'analyst',
  invited_by uuid not null references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table public.subscriptions (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  plan public.billing_plan not null default 'growth',
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled')),
  seats integer not null default 8 check (seats between 1 and 5000),
  renewal_date date not null default (current_date + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 180),
  owner_email text not null check (owner_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  category text not null check (char_length(category) between 2 and 80),
  status public.vendor_status not null default 'prospect',
  risk public.risk_rating not null default 'medium',
  annual_spend numeric(12,2) not null default 0 check (annual_spend >= 0),
  data_access text not null default 'Business metadata only',
  next_review_date date not null default (current_date + interval '90 days'),
  notes text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 180),
  status public.assessment_status not null default 'draft',
  due_date date not null default (current_date + interval '30 days'),
  score integer not null default 0 check (score between 0 and 100),
  approved_by uuid references auth.users(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assessment_controls (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  section text not null check (char_length(section) between 2 and 80),
  question text not null check (char_length(question) between 8 and 260),
  answer text not null default '',
  evidence_url text not null default '',
  risk public.risk_rating not null default 'medium',
  passed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 180),
  description text not null default '',
  status public.task_status not null default 'open',
  priority public.risk_rating not null default 'medium',
  assignee_id uuid references auth.users(id),
  due_date date not null default (current_date + interval '14 days'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null check (entity_type in ('organization', 'vendor', 'assessment', 'task', 'member', 'subscription')),
  entity_id uuid not null,
  action text not null check (char_length(action) between 2 and 80),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_members_user on public.organization_members(user_id);
create index idx_vendors_org_status_risk on public.vendors(organization_id, status, risk);
create index idx_vendors_search on public.vendors using gin (to_tsvector('english', name || ' ' || category || ' ' || owner_email));
create index idx_assessments_org_vendor on public.assessments(organization_id, vendor_id, status);
create index idx_tasks_org_status_due on public.tasks(organization_id, status, due_date);
create index idx_activity_org_created on public.activity_events(organization_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger orgs_touch before update on public.organizations for each row execute function public.touch_updated_at();
create trigger subs_touch before update on public.subscriptions for each row execute function public.touch_updated_at();
create trigger vendors_touch before update on public.vendors for each row execute function public.touch_updated_at();
create trigger assessments_touch before update on public.assessments for each row execute function public.touch_updated_at();
create trigger controls_touch before update on public.assessment_controls for each row execute function public.touch_updated_at();
create trigger tasks_touch before update on public.tasks for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_org_member(org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id and user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(org_id uuid, allowed public.member_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id and user_id = auth.uid() and role = any(allowed)
  );
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;
alter table public.subscriptions enable row level security;
alter table public.vendors enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_controls enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_events enable row level security;

create policy "profiles self read" on public.profiles for select using (id = auth.uid());
create policy "profiles self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "org member read" on public.organizations for select using (public.is_org_member(id));
create policy "org creator insert" on public.organizations for insert with check (created_by = auth.uid());
create policy "org admins update" on public.organizations for update using (public.has_org_role(id, array['owner','admin']::public.member_role[]));

create policy "members read" on public.organization_members for select using (public.is_org_member(organization_id));
create policy "members admin write" on public.organization_members for all using (public.has_org_role(organization_id, array['owner','admin']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','admin']::public.member_role[]));

create policy "invites admin access" on public.organization_invites for all using (public.has_org_role(organization_id, array['owner','admin']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','admin']::public.member_role[]));
create policy "subs member read" on public.subscriptions for select using (public.is_org_member(organization_id));
create policy "subs owner update" on public.subscriptions for update using (public.has_org_role(organization_id, array['owner']::public.member_role[]));

create policy "vendors member read" on public.vendors for select using (public.is_org_member(organization_id));
create policy "vendors analyst write" on public.vendors for all using (public.has_org_role(organization_id, array['owner','admin','analyst']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','admin','analyst']::public.member_role[]));

create policy "assessments member read" on public.assessments for select using (public.is_org_member(organization_id));
create policy "assessments analyst write" on public.assessments for all using (public.has_org_role(organization_id, array['owner','admin','analyst']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','admin','analyst']::public.member_role[]));

create policy "controls member read" on public.assessment_controls for select using (public.is_org_member(organization_id));
create policy "controls analyst write" on public.assessment_controls for all using (public.has_org_role(organization_id, array['owner','admin','analyst']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','admin','analyst']::public.member_role[]));

create policy "tasks member read" on public.tasks for select using (public.is_org_member(organization_id));
create policy "tasks analyst write" on public.tasks for all using (public.has_org_role(organization_id, array['owner','admin','analyst']::public.member_role[])) with check (public.has_org_role(organization_id, array['owner','admin','analyst']::public.member_role[]));

create policy "activity member read" on public.activity_events for select using (public.is_org_member(organization_id));
create policy "activity service insert only" on public.activity_events for insert with check (public.is_org_member(organization_id));
