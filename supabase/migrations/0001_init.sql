-- TallerOS — esquema inicial multi-tenant
-- Ejecutar en el SQL Editor de Supabase (una sola vez por proyecto).
-- Todas las tablas de negocio llevan tenant_id y quedan protegidas por RLS.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tenant_plan') then
    create type public.tenant_plan as enum ('basic', 'pro', 'premium');
  end if;
  if not exists (select 1 from pg_type where typname = 'tenant_status') then
    create type public.tenant_status as enum ('active', 'suspended');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('owner', 'technician', 'super_admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'inventory_unit') then
    create type public.inventory_unit as enum ('unidad', 'litro', 'metro', 'kit', 'otro');
  end if;
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum (
      'ingresado',
      'diagnostico',
      'esperando_repuesto',
      'reparacion',
      'listo',
      'entregado',
      'cancelado'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tenants y perfiles
-- ---------------------------------------------------------------------------

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan public.tenant_plan not null default 'basic',
  status public.tenant_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete cascade,
  role public.user_role not null default 'owner',
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_tenant_id_idx on public.profiles (tenant_id);

-- Tenant del usuario autenticado. SECURITY DEFINER para poder leer profiles
-- dentro de las políticas RLS sin recursión.
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Clientes y equipos
-- ---------------------------------------------------------------------------

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_tenant_id_idx on public.customers (tenant_id);
create index if not exists customers_tenant_name_idx on public.customers (tenant_id, name);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  brand text not null,
  model text not null,
  serial_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists equipment_tenant_id_idx on public.equipment (tenant_id);
create index if not exists equipment_customer_id_idx on public.equipment (customer_id);

-- ---------------------------------------------------------------------------
-- Inventario
-- ---------------------------------------------------------------------------

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  sku text not null,
  barcode text,
  name text not null,
  category text not null default 'General',
  brand text,
  model text,
  unit public.inventory_unit not null default 'unidad',
  cost_price integer not null default 0 check (cost_price >= 0),
  sale_price integer not null default 0 check (sale_price >= 0),
  stock numeric(12, 2) not null default 0 check (stock >= 0),
  min_stock numeric(12, 2) not null default 0 check (min_stock >= 0),
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, sku)
);

create index if not exists inventory_items_tenant_id_idx on public.inventory_items (tenant_id);
create index if not exists inventory_items_barcode_idx on public.inventory_items (tenant_id, barcode);

-- ---------------------------------------------------------------------------
-- Órdenes de servicio
-- ---------------------------------------------------------------------------

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  number integer not null,
  customer_id uuid not null references public.customers (id),
  equipment_id uuid references public.equipment (id),
  status public.order_status not null default 'ingresado',
  intake_notes text,
  diagnosis text,
  labor_price integer not null default 0 check (labor_price >= 0),
  labor_cost integer not null default 0 check (labor_cost >= 0),
  parts_total integer not null default 0 check (parts_total >= 0),
  total integer not null default 0 check (total >= 0),
  promised_at date,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, number)
);

create index if not exists service_orders_tenant_id_idx on public.service_orders (tenant_id);
create index if not exists service_orders_tenant_status_idx on public.service_orders (tenant_id, status);
create index if not exists service_orders_customer_id_idx on public.service_orders (customer_id);

create table if not exists public.service_order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  order_id uuid not null references public.service_orders (id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items (id),
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_price integer not null default 0 check (unit_price >= 0),
  unit_cost integer not null default 0 check (unit_cost >= 0),
  created_at timestamptz not null default now()
);

create index if not exists service_order_items_order_id_idx on public.service_order_items (order_id);
create index if not exists service_order_items_tenant_id_idx on public.service_order_items (tenant_id);

create table if not exists public.order_photos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  order_id uuid not null references public.service_orders (id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists order_photos_order_id_idx on public.order_photos (order_id);
create index if not exists order_photos_tenant_id_idx on public.order_photos (tenant_id);

-- ---------------------------------------------------------------------------
-- Triggers updated_at
-- ---------------------------------------------------------------------------

drop trigger if exists tenants_set_updated_at on public.tenants;
create trigger tenants_set_updated_at
before update on public.tenants
for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists equipment_set_updated_at on public.equipment;
create trigger equipment_set_updated_at
before update on public.equipment
for each row execute function public.set_updated_at();

drop trigger if exists inventory_items_set_updated_at on public.inventory_items;
create trigger inventory_items_set_updated_at
before update on public.inventory_items
for each row execute function public.set_updated_at();

drop trigger if exists service_orders_set_updated_at on public.service_orders;
create trigger service_orders_set_updated_at
before update on public.service_orders
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.equipment enable row level security;
alter table public.inventory_items enable row level security;
alter table public.service_orders enable row level security;
alter table public.service_order_items enable row level security;
alter table public.order_photos enable row level security;

-- tenants: el usuario ve y actualiza solo su taller.
drop policy if exists tenants_select on public.tenants;
create policy tenants_select on public.tenants
for select using (id = public.current_tenant_id());

drop policy if exists tenants_update on public.tenants;
create policy tenants_update on public.tenants
for update using (id = public.current_tenant_id())
with check (id = public.current_tenant_id());

-- profiles: cada usuario ve su propio perfil y los de su taller.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select using (
  id = auth.uid() or tenant_id = public.current_tenant_id()
);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
for update using (id = auth.uid())
with check (id = auth.uid());

-- Políticas genéricas por tenant para las tablas de negocio.
drop policy if exists customers_all on public.customers;
create policy customers_all on public.customers
for all using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists equipment_all on public.equipment;
create policy equipment_all on public.equipment
for all using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists inventory_items_all on public.inventory_items;
create policy inventory_items_all on public.inventory_items
for all using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists service_orders_all on public.service_orders;
create policy service_orders_all on public.service_orders
for all using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists service_order_items_all on public.service_order_items;
create policy service_order_items_all on public.service_order_items
for all using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists order_photos_all on public.order_photos;
create policy order_photos_all on public.order_photos
for all using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

-- ---------------------------------------------------------------------------
-- Storage para fotos (bucket privado)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('order-photos', 'order-photos', false)
on conflict (id) do nothing;

drop policy if exists order_photos_storage_all on storage.objects;
create policy order_photos_storage_all on storage.objects
for all using (
  bucket_id = 'order-photos'
  and (storage.foldername(name))[1] = public.current_tenant_id()::text
)
with check (
  bucket_id = 'order-photos'
  and (storage.foldername(name))[1] = public.current_tenant_id()::text
);

-- ---------------------------------------------------------------------------
-- Alta de taller + perfil
-- ---------------------------------------------------------------------------
-- Crea un tenant y vincula al usuario autenticado como owner.
-- Llamar desde el cliente después del primer login:
--   supabase.rpc('bootstrap_tenant', { p_name: 'Taller Los Robles' })

create or replace function public.bootstrap_tenant(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_existing uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  select tenant_id into v_existing from public.profiles where id = auth.uid();
  if v_existing is not null then
    return v_existing;
  end if;

  insert into public.tenants (name, plan)
  values (coalesce(nullif(trim(p_name), ''), 'Mi taller'), 'basic')
  returning id into v_tenant_id;

  insert into public.profiles (id, tenant_id, role, email)
  values (auth.uid(), v_tenant_id, 'owner', auth.email())
  on conflict (id) do update
    set tenant_id = excluded.tenant_id,
        role = 'owner',
        email = excluded.email;

  return v_tenant_id;
end;
$$;

grant execute on function public.bootstrap_tenant(text) to authenticated;
grant execute on function public.current_tenant_id() to authenticated;
