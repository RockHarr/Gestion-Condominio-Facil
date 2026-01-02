-- ============================================
-- RockCode | Condominios | DB Priority Patch (Improved)
-- Objetivo: Cerrar RLS + permisos por rol (admin/resident)
-- Base: schema.sql actual + Mejoras de seguridad
-- ============================================

begin;

-- 0) Extensión necesaria (si ya existe, no afecta)
create extension if not exists "uuid-ossp";

-- 1) Helper function: is_admin()
-- IMPROVEMENT: Added SECURITY DEFINER to prevent recursion and ensure consistent execution
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- 2) Habilitar RLS en TODAS las tablas (si alguna ya está, OK)
alter table public.profiles enable row level security;
alter table public.community_settings enable row level security;
alter table public.common_expense_debts enable row level security;
alter table public.parking_debts enable row level security;
alter table public.tickets enable row level security;
alter table public.notices enable row level security;
alter table public.amenities enable row level security;
alter table public.reservations enable row level security;
alter table public.financial_statements enable row level security;
alter table public.reserve_fund enable row level security;
alter table public.expenses enable row level security;
alter table public.payments enable row level security;

-- 3) Limpiar policies peligrosas o abiertas (idempotente)
-- PROFILES
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- NOTICES
drop policy if exists "Notices are viewable by everyone" on public.notices;

-- TICKETS
drop policy if exists "Users can see own tickets" on public.tickets;
drop policy if exists "Users can create tickets" on public.tickets;

-- (Opcional) si existen policies antiguas con otros nombres, se revisa en consola

-- 4) PROFILES policies (cerrar exposición de datos)
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- 5) NOTICES policies
-- Resident/auth ve solo Publicado
create policy "notices_select_published"
on public.notices
for select
using (status = 'Publicado');

-- Admin puede todo
create policy "notices_admin_all"
on public.notices
for all
using (public.is_admin())
with check (public.is_admin());

-- 6) TICKETS policies
-- Select: own or admin
create policy "tickets_select_own_or_admin"
on public.tickets
for select
using (auth.uid() = user_id or public.is_admin());

-- Insert: own
create policy "tickets_insert_own"
on public.tickets
for insert
with check (auth.uid() = user_id);

-- Update: admin only (estado/gestión)
create policy "tickets_update_admin"
on public.tickets
for update
using (public.is_admin())
with check (public.is_admin());

-- Delete: admin only (IMPROVEMENT: Enabled for cleanup)
create policy "tickets_delete_admin"
on public.tickets
for delete
using (public.is_admin());

-- 7) DEUDAS policies (solo admin escribe)
create policy "common_debts_select_own_or_admin"
on public.common_expense_debts
for select
using (auth.uid() = user_id or public.is_admin());

create policy "common_debts_admin_write"
on public.common_expense_debts
for all
using (public.is_admin())
with check (public.is_admin());

create policy "parking_debts_select_own_or_admin"
on public.parking_debts
for select
using (auth.uid() = user_id or public.is_admin());

create policy "parking_debts_admin_write"
on public.parking_debts
for all
using (public.is_admin())
with check (public.is_admin());

-- 8) PAYMENTS policies (admin escribe, user lee los suyos)
create policy "payments_select_own_or_admin"
on public.payments
for select
using (auth.uid() = user_id or public.is_admin());

create policy "payments_admin_write"
on public.payments
for all
using (public.is_admin())
with check (public.is_admin());

-- 9) AMENITIES policies (lectura autenticada, escritura admin)
-- IMPROVEMENT: Restricted to authenticated users instead of public
create policy "amenities_select_authenticated"
on public.amenities
for select
using (auth.role() = 'authenticated');

create policy "amenities_admin_write"
on public.amenities
for all
using (public.is_admin())
with check (public.is_admin());

-- 10) RESERVATIONS policies
create policy "reservations_select_own_or_admin"
on public.reservations
for select
using (auth.uid() = user_id or public.is_admin());

create policy "reservations_insert_own"
on public.reservations
for insert
with check (auth.uid() = user_id);

create policy "reservations_update_own_or_admin"
on public.reservations
for update
using (auth.uid() = user_id or public.is_admin());

create policy "reservations_delete_own_or_admin"
on public.reservations
for delete
using (auth.uid() = user_id or public.is_admin());

-- 11) TRANSPARENCIA (lectura autenticado; escritura admin)
-- community_settings
create policy "settings_select_authenticated"
on public.community_settings
for select
using (auth.role() = 'authenticated' or public.is_admin());

create policy "settings_admin_update"
on public.community_settings
for update
using (public.is_admin())
with check (public.is_admin());

-- expenses
create policy "expenses_select_authenticated"
on public.expenses
for select
using (auth.role() = 'authenticated' or public.is_admin());

create policy "expenses_admin_write"
on public.expenses
for all
using (public.is_admin())
with check (public.is_admin());

-- financial_statements
create policy "financial_select_authenticated"
on public.financial_statements
for select
using (auth.role() = 'authenticated' or public.is_admin());

create policy "financial_admin_write"
on public.financial_statements
for all
using (public.is_admin())
with check (public.is_admin());

-- reserve_fund
create policy "reserve_select_authenticated"
on public.reserve_fund
for select
using (auth.role() = 'authenticated' or public.is_admin());

create policy "reserve_admin_write"
on public.reserve_fund
for all
using (public.is_admin())
with check (public.is_admin());

-- 12) Índices / unicidad (evita duplicados y choques)
-- Deudas únicas por período
create unique index if not exists ux_common_debt_user_mes
on public.common_expense_debts(user_id, mes);

create unique index if not exists ux_parking_debt_user_pat_mes
on public.parking_debts(user_id, patente, mes);

-- Reservas: evitar doble booking del mismo bloque
create unique index if not exists ux_reservation_slot
on public.reservations(amenity_id, fecha, hora);

-- Performance básico
create index if not exists idx_tickets_user_id on public.tickets(user_id);
create index if not exists idx_tickets_estado on public.tickets(estado);
create index if not exists idx_reservations_user_id on public.reservations(user_id);

commit;
