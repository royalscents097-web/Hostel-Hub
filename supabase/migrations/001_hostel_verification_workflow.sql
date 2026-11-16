-- Hostel Hub: Phase 1 Refinement & Owner Verification Workflow Migration
-- Target: Supabase PostgreSQL with strict Row Level Security (RLS)

create extension if not exists "pgcrypto";

-- 1. User profiles with explicit RBAC roles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null default 'student' check (role in ('student', 'owner', 'admin')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Main public/owner hostel table (private admin review notes stored separately)
create table if not exists public.hostels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  slug text not null unique,
  name text not null,
  owner_name text not null,
  manager_name text,
  public_phone text not null,
  public_email text,
  city text not null default 'Lahore',
  area text not null,
  full_address text not null,
  category text not null check (category in ('boys', 'girls')),
  room_types jsonb not null default '[]'::jsonb,
  monthly_rent_min integer not null check (monthly_rent_min >= 0),
  monthly_rent_max integer not null check (monthly_rent_max >= monthly_rent_min),
  security_deposit integer not null default 0 check (security_deposit >= 0),
  available_beds_total integer not null default 0 check (available_beds_total >= 0),
  facilities text[] not null default '{}',
  meal_arrangements text not null,
  internet_availability text not null,
  electricity_backup text not null,
  security_arrangements text not null,
  hostel_rules text not null,
  photos text[] not null default '{}',
  owner_consent_signed boolean not null default false,
  verification_status text not null default 'awaiting_information'
    check (verification_status in (
      'awaiting_information',
      'verification_pending',
      'changes_requested',
      'approved',
      'rejected'
    )),
  admin_change_request text,
  authority_verified boolean not null default false,
  address_reviewed boolean not null default false,
  photos_reviewed boolean not null default false,
  approved_at timestamptz,
  last_availability_update_at timestamptz not null default now(),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Owner consent records (auditable legal/publishing permission trail)
create table if not exists public.owner_consents (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  signatory_name text not null,
  authority_role text not null check (authority_role in ('Owner', 'Authorized Manager')),
  authority_confirmed boolean not null default false,
  publishing_permission_granted boolean not null default false,
  terms_version text not null default 'v1.0-2026',
  consented_at timestamptz not null default now()
);

-- 4. Admin-only Hostel Acquisition & Contact CRM records
create table if not exists public.hostel_acquisition_contacts (
  id uuid primary key default gen_random_uuid(),
  hostel_name text not null,
  public_business_contact text not null,
  area text not null,
  category text not null check (category in ('boys', 'girls')),
  source_type text not null check (source_type in ('Public Directory', 'Campus Notice', 'Direct Inquiry', 'Referral')),
  contact_date date,
  contact_method text check (contact_method in ('Phone Call', 'WhatsApp Business', 'In-Person Visit', 'Email')),
  contact_status text not null default 'Not Contacted'
    check (contact_status in (
      'Not Contacted',
      'Contacted',
      'Interested',
      'Not Interested',
      'Awaiting Information',
      'Verification Pending',
      'Approved',
      'Rejected'
    )),
  follow_up_date date,
  notes text default '',
  linked_hostel_id uuid references public.hostels(id) on delete set null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Contact outreach history logs (admin-only)
create table if not exists public.hostel_contact_logs (
  id uuid primary key default gen_random_uuid(),
  acquisition_id uuid not null references public.hostel_acquisition_contacts(id) on delete cascade,
  contact_date timestamptz not null default now(),
  method text not null check (method in ('Phone Call', 'WhatsApp Business', 'In-Person Visit', 'Email')),
  resulting_status text not null,
  summary text not null,
  recorded_by uuid references public.profiles(id)
);

-- 6. Verification & admin review notes (strictly private to admins)
create table if not exists public.admin_review_notes (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  admin_id uuid not null references public.profiles(id),
  internal_note text not null,
  created_at timestamptz not null default now()
);

-- 7. Verification history audit log
create table if not exists public.verification_history (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

-- 8. Availability confirmation log
create table if not exists public.hostel_availability_updates (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  updated_by uuid not null references public.profiles(id),
  available_beds_total integer not null check (available_beds_total >= 0),
  confirmed_at timestamptz not null default now()
);

-- Helper function for RLS role checks
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Prevent owners from self-approving or self-verifying listings
create or replace function public.enforce_owner_verification_guard()
returns trigger
language plpgsql
as $$
begin
  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.verification_status := case
        when new.owner_consent_signed then 'verification_pending'
        else 'awaiting_information'
      end;
      new.approved_at := null;
      new.authority_verified := false;
      new.address_reviewed := false;
      new.photos_reviewed := false;
    elsif tg_op = 'UPDATE' then
      -- Owners cannot set verification_status to approved or toggle verification flags
      if new.verification_status = 'approved' and old.verification_status <> 'approved' then
        raise exception 'Only administrators can approve listings.';
      end if;
      new.authority_verified := old.authority_verified;
      new.address_reviewed := old.address_reviewed;
      new.photos_reviewed := old.photos_reviewed;
      new.approved_at := old.approved_at;
      -- Material changes to already-approved listings revert to verification_pending
      if old.verification_status = 'approved' and (
        new.name is distinct from old.name or
        new.area is distinct from old.area or
        new.full_address is distinct from old.full_address or
        new.category is distinct from old.category or
        new.photos is distinct from old.photos
      ) then
        new.verification_status := 'verification_pending';
        new.is_active := false;
      end if;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_hostel_verification_guard on public.hostels;
create trigger trg_hostel_verification_guard
  before insert or update on public.hostels
  for each row execute function public.enforce_owner_verification_guard();

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.hostels enable row level security;
alter table public.owner_consents enable row level security;
alter table public.hostel_acquisition_contacts enable row level security;
alter table public.hostel_contact_logs enable row level security;
alter table public.admin_review_notes enable row level security;
alter table public.verification_history enable row level security;
alter table public.hostel_availability_updates enable row level security;

-- RLS Policies: profiles
create policy "Users view own profile or admin views all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- RLS Policies: hostels
create policy "Public reads only approved consented active hostels"
  on public.hostels for select
  using (
    (verification_status = 'approved' and owner_consent_signed = true and is_active = true)
    or owner_id = auth.uid()
    or public.is_admin()
  );

create policy "Owners insert own hostel listings"
  on public.hostels for insert
  with check (owner_id = auth.uid());

create policy "Owners update own hostel listings or admins update any"
  on public.hostels for update
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- RLS Policies: owner_consents
create policy "Owners and admins view consent records"
  on public.owner_consents for select
  using (owner_id = auth.uid() or public.is_admin());

create policy "Owners insert own consent"
  on public.owner_consents for insert
  with check (owner_id = auth.uid());

-- RLS Policies: Admin-only tables
create policy "Admins manage acquisition contacts"
  on public.hostel_acquisition_contacts for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage contact logs"
  on public.hostel_contact_logs for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage private review notes"
  on public.admin_review_notes for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins and owning host view verification history"
  on public.verification_history for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.hostels h
      where h.id = verification_history.hostel_id and h.owner_id = auth.uid()
    )
  );

create policy "Admins insert verification history"
  on public.verification_history for insert
  with check (public.is_admin());

create policy "Public reads availability timestamps for approved hostels; owners manage own"
  on public.hostel_availability_updates for select
  using (
    public.is_admin()
    or updated_by = auth.uid()
    or exists (
      select 1 from public.hostels h
      where h.id = hostel_availability_updates.hostel_id
        and h.verification_status = 'approved'
        and h.is_active = true
    )
  );

create policy "Owners log own availability updates"
  on public.hostel_availability_updates for insert
  with check (updated_by = auth.uid());

-- Useful query indexes for Lahore discovery
create index if not exists idx_hostels_public_discovery
  on public.hostels (city, area, category, verification_status, is_active, monthly_rent_min);

create index if not exists idx_acquisition_status_area
  on public.hostel_acquisition_contacts (contact_status, area, category);
