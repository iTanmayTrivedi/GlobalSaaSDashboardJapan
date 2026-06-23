-- ============================================================
-- Lynt / Japanese Business SaaS — Full Local Setup
-- Run this ONCE in your own Supabase project's SQL Editor.
-- Project: drzmcrrbpmsntartowjk
-- ============================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
do $$ begin
  create type public.app_role as enum ('super_admin', 'org_admin', 'member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_plan as enum ('free', 'pro');
exception when duplicate_object then null; end $$;

-- ---------- Tables ----------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  plan public.subscription_plan not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.organizations to authenticated;
grant all on public.organizations to service_role;
alter table public.organizations enable row level security;

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
grant select, insert, update, delete on public.organization_members to authenticated;
grant all on public.organization_members to service_role;
alter table public.organization_members enable row level security;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  language text not null default 'en',
  timezone text not null default 'UTC',
  current_organization_id uuid references public.organizations(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;

-- ---------- Helper Functions (SECURITY DEFINER, avoid RLS recursion) ----------
create or replace function public.is_org_member(_user_id uuid, _org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members where user_id = _user_id and organization_id = _org_id);
$$;

create or replace function public.has_org_role(_user_id uuid, _org_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members where user_id = _user_id and organization_id = _org_id and role = _role);
$$;

create or replace function public.is_super_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members where user_id = _user_id and role = 'super_admin');
$$;

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name, timezone)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'display_name', new.email),
          coalesce(new.raw_user_meta_data->>'timezone', 'UTC'));
  return new;
end; $$;

create or replace function public.log_audit_event(_org_id uuid, _action text, _entity_type text default null, _entity_id uuid default null, _metadata jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare _log_id uuid;
begin
  insert into public.audit_logs (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (_org_id, auth.uid(), _action, _entity_type, _entity_id, _metadata)
  returning id into _log_id;
  return _log_id;
end; $$;

create or replace function public.create_org_with_member(_name text, _role public.app_role default 'org_admin')
returns uuid language plpgsql security definer set search_path = public as $$
declare _org_id uuid; _user_id uuid := auth.uid();
begin
  if _user_id is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from public.organizations where name = _name) then
    raise exception 'Organization name already exists';
  end if;
  insert into public.organizations (name) values (_name) returning id into _org_id;
  insert into public.organization_members (organization_id, user_id, role) values (_org_id, _user_id, _role);
  update public.profiles set current_organization_id = _org_id where user_id = _user_id;
  insert into public.audit_logs (organization_id, user_id, action, entity_type, entity_id)
  values (_org_id, _user_id, 'organization.created', 'organization', _org_id);
  return _org_id;
end; $$;

-- ---------- Triggers ----------
drop trigger if exists update_organizations_updated_at on public.organizations;
create trigger update_organizations_updated_at before update on public.organizations
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RLS Policies ----------
-- organizations
drop policy if exists "Members can view their organizations" on public.organizations;
create policy "Members can view their organizations" on public.organizations
  for select using (public.is_org_member(auth.uid(), id) or public.is_super_admin(auth.uid()));

drop policy if exists "Authenticated users can create organizations" on public.organizations;
create policy "Authenticated users can create organizations" on public.organizations
  for insert with check (auth.uid() is not null);

drop policy if exists "Org admins can update their organization" on public.organizations;
create policy "Org admins can update their organization" on public.organizations
  for update using (public.has_org_role(auth.uid(), id, 'org_admin') or public.is_super_admin(auth.uid()));

-- organization_members
drop policy if exists "Members can view org members" on public.organization_members;
create policy "Members can view org members" on public.organization_members
  for select using (public.is_org_member(auth.uid(), organization_id) or public.is_super_admin(auth.uid()));

drop policy if exists "Users can add themselves as org creator" on public.organization_members;
create policy "Users can add themselves as org creator" on public.organization_members
  for insert with check (auth.uid() = user_id and role = 'org_admin');

drop policy if exists "Org admins can insert members" on public.organization_members;
create policy "Org admins can insert members" on public.organization_members
  for insert with check (public.has_org_role(auth.uid(), organization_id, 'org_admin') or public.is_super_admin(auth.uid()));

drop policy if exists "Org admins can update members" on public.organization_members;
create policy "Org admins can update members" on public.organization_members
  for update using (public.has_org_role(auth.uid(), organization_id, 'org_admin') or public.is_super_admin(auth.uid()));

drop policy if exists "Org admins can remove members" on public.organization_members;
create policy "Org admins can remove members" on public.organization_members
  for delete using (public.has_org_role(auth.uid(), organization_id, 'org_admin') or public.is_super_admin(auth.uid()));

-- profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = user_id);

-- audit_logs
drop policy if exists "Org members can view audit logs" on public.audit_logs;
create policy "Org members can view audit logs" on public.audit_logs
  for select using (public.is_org_member(auth.uid(), organization_id));

drop policy if exists "Authenticated can insert audit logs" on public.audit_logs;
create policy "Authenticated can insert audit logs" on public.audit_logs
  for insert with check (auth.uid() = user_id and public.is_org_member(auth.uid(), organization_id));

-- ============================================================
-- DONE. Next steps:
-- 1. Enable Email auth (Authentication > Providers > Email)
-- 2. (Optional) Enable Google OAuth
-- 3. Deploy edge functions: supabase functions deploy ai-chat ai-tools seed-demo-user
-- 4. Set edge function secret: supabase secrets set LOVABLE_API_KEY=<gemini-or-lovable-key>
-- ============================================================
