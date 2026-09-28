-- Sunny Magnet V2 core order schema.
-- Public tables are intentionally deny-by-default for anon/authenticated.
-- Server-side code will use service_role. Fine-grained portal policies come later.

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;
revoke all on function private.set_updated_at() from anon;
revoke all on function private.set_updated_at() from authenticated;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,

  customer_name text not null,
  phone text not null,
  email text not null,
  address text not null,

  channel text not null default 'retail'
    check (channel in ('retail', 'event')),
  source text not null default 'direct'
    check (source in ('direct', 'partner', 'event', 'staff')),
  artwork_mode text not null default 'self_service'
    check (artwork_mode in ('self_service', 'sunny_assist')),

  partner_id uuid null,
  event_id uuid null,
  ref_code text null,

  quantity integer not null
    check (quantity > 0),
  unit_price integer not null
    check (unit_price >= 0),
  subtotal bigint not null
    check (subtotal >= 0),
  shipping_fee bigint not null default 0
    check (shipping_fee >= 0),
  total_amount bigint not null
    check (total_amount >= 0),

  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid')),
  artwork_status text not null default 'draft'
    check (artwork_status in ('draft', 'needs_artwork', 'ready')),
  production_status text not null default 'waiting'
    check (production_status in (
      'waiting',
      'ready_to_print',
      'in_production',
      'packed',
      'ready_for_delivery',
      'completed'
    )),
  delivery_status text not null default 'pending'
    check (delivery_status in (
      'pending',
      'ready_for_pickup',
      'shipped',
      'delivered'
    )),
  delivery_method text not null default 'home'
    check (delivery_method in ('home', 'pickup_partner', 'event')),

  notes text null,
  drive_folder_id text null,

  paid_at timestamptz null,
  completed_at timestamptz null,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint orders_total_matches_parts
    check (total_amount = subtotal + shipping_fee),

  constraint sunny_assist_min_quantity
    check (artwork_mode <> 'sunny_assist' or quantity >= 6)
);

comment on table public.orders is
  'Sunny Magnet V2 order header. Guest checkout is allowed through the application backend, not direct public table access.';

comment on column public.orders.ref_code is
  'Referral code snapshot present at order submission time.';

comment on column public.orders.partner_id is
  'Reserved for future partner foreign key; nullable until partner module is introduced.';

comment on column public.orders.event_id is
  'Reserved for future event foreign key; nullable until event module is introduced.';

create trigger orders_set_updated_at
before update on public.orders
for each row execute function private.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  position integer not null check (position > 0),

  pan_x double precision not null default 0,
  pan_y double precision not null default 0,
  zoom double precision not null default 1,
  rotation double precision not null default 0,

  brightness double precision not null default 1,
  contrast double precision not null default 1,
  temperature double precision not null default 0,
  tint double precision not null default 0,
  filter_name text not null default 'original',

  artwork_status text not null default 'draft'
    check (artwork_status in ('draft', 'needs_artwork', 'ready')),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (order_id, position)
);

comment on table public.order_items is
  'One row per physical magnet. Stores edit parameters; binary originals/finals live in Google Drive and are referenced through assets.';

create trigger order_items_set_updated_at
before update on public.order_items
for each row execute function private.set_updated_at();

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid null references public.order_items(id) on delete cascade,

  asset_type text not null
    check (asset_type in ('original', 'artwork', 'print_pdf', 'print_preview')),
  provider text not null default 'google_drive'
    check (provider in ('google_drive')),

  drive_file_id text null,
  drive_folder_id text null,

  filename text not null,
  mime_type text null,
  size_bytes bigint null check (size_bytes is null or size_bytes >= 0),
  sha256 text null,

  version integer not null default 1 check (version > 0),
  is_current boolean not null default true,

  upload_status text not null default 'pending'
    check (upload_status in ('pending', 'ready', 'failed')),
  error_message text null,

  created_at timestamptz not null default now()
);

comment on table public.assets is
  'Metadata for files stored outside Supabase, initially Google Drive. Keeps originals, final artworks, print PDFs, and previews.';

create table public.print_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,

  template_version text not null default '104-v1',
  status text not null default 'pending'
    check (status in ('pending', 'generating', 'ready', 'failed')),

  pages integer not null default 0 check (pages >= 0),

  pdf_asset_id uuid null references public.assets(id) on delete set null,
  preview_asset_id uuid null references public.assets(id) on delete set null,

  generated_at timestamptz null,
  generated_by uuid null,
  error_message text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.print_jobs is
  'Versioned print-generation job metadata. Output is A4 Actual Size/100%, six slots per page, row-major fill, unused slots pure white.';

create trigger print_jobs_set_updated_at
before update on public.print_jobs
for each row execute function private.set_updated_at();

-- Useful indexes for operational dashboard and workers.
create index orders_created_at_idx
  on public.orders (created_at desc);

create index orders_payment_status_idx
  on public.orders (payment_status);

create index orders_artwork_status_idx
  on public.orders (artwork_status);

create index orders_production_status_idx
  on public.orders (production_status);

create index orders_ref_code_idx
  on public.orders (ref_code)
  where ref_code is not null;

create index orders_partner_id_idx
  on public.orders (partner_id)
  where partner_id is not null;

create index orders_event_id_idx
  on public.orders (event_id)
  where event_id is not null;

create index order_items_order_id_idx
  on public.order_items (order_id);

create index assets_order_id_idx
  on public.assets (order_id);

create index assets_order_item_id_idx
  on public.assets (order_item_id)
  where order_item_id is not null;

create index assets_current_type_idx
  on public.assets (order_id, order_item_id, asset_type)
  where is_current;

create index print_jobs_order_id_idx
  on public.print_jobs (order_id, created_at desc);

create index print_jobs_status_idx
  on public.print_jobs (status);

-- RLS explicitly enabled even though the project has auto-RLS enabled.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.assets enable row level security;
alter table public.print_jobs enable row level security;

-- Deny browser roles by default. The public website will use controlled backend endpoints.
revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;
revoke all on table public.assets from anon, authenticated;
revoke all on table public.print_jobs from anon, authenticated;

-- Server-side service role needs explicit table privileges.
grant select, insert, update, delete on table public.orders to service_role;
grant select, insert, update, delete on table public.order_items to service_role;
grant select, insert, update, delete on table public.assets to service_role;
grant select, insert, update, delete on table public.print_jobs to service_role;
