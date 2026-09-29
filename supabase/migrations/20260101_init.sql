-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles (Users)
-- Links to Supabase Auth via references auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  nombre text not null,
  unidad text,
  role text check (role in ('admin', 'resident')) default 'resident',
  has_parking boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 2. Community Settings
create table public.community_settings (
  id serial primary key,
  common_expense_amount integer not null default 65000,
  parking_cost_amount integer not null default 12000,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Insert default settings
insert into public.community_settings (common_expense_amount, parking_cost_amount)
values (65000, 12000);

-- 3. Common Expense Debts
create table public.common_expense_debts (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  mes text not null, -- Format: YYYY-MM
  monto integer not null,
  pagado boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Parking Debts
create table public.parking_debts (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  patente text,
  mes text not null, -- Format: YYYY-MM
  monto integer not null,
  pagado boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Tickets
create table public.tickets (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  titulo text not null,
  descripcion text not null,
  fecha date default CURRENT_DATE,
  estado text check (estado in ('Nuevo', 'En Proceso', 'Resuelto', 'Cerrado')) default 'Nuevo',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Notices
create table public.notices (
  id serial primary key,
  titulo text not null,
  contenido text not null,
  fecha date default CURRENT_DATE,
  tipo text check (tipo in ('Comunidad', 'Mantenimiento', 'Seguridad', 'Emergencia')) default 'Comunidad',
  status text check (status in ('Borrador', 'Publicado', 'Archivado')) default 'Borrador',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Amenities
create table public.amenities (
  id text primary key, -- e.g., 'quincho', 'sala_eventos'
  nombre text not null
);

insert into public.amenities (id, nombre) values 
('quincho', 'Quincho'),
('sala_eventos', 'Salón de Eventos');

-- 8. Reservations
create table public.reservations (
  id serial primary key,
  amenity_id text references public.amenities(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  fecha date not null,
  hora time not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 9. Financial Statements
create table public.financial_statements (
  id serial primary key,
  mes text not null, -- Display name e.g., "Octubre 2025"
  url text,
  ingresos integer default 0,
  egresos integer default 0,
  saldo integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 10. Reserve Fund
create table public.reserve_fund (
  id serial primary key,
  monto_actual integer default 0,
  meta integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

insert into public.reserve_fund (monto_actual, meta) values (8500000, 15000000);

-- 11. Expenses
create table public.expenses (
  id serial primary key,
  descripcion text not null,
  monto integer not null,
  fecha date default CURRENT_DATE,
  categoria text check (categoria in ('Mantenimiento', 'Seguridad', 'Limpieza', 'Administracion', 'Suministros', 'Otros')) default 'Otros',
  status text check (status in ('Aprobado', 'Rechazado', 'En Revision')) default 'En Revision',
  proveedor text,
  numero_documento text,
  evidencia_url text,
  motivo_rechazo text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 12. Payments History
create table public.payments (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  type text check (type in ('Gasto Comun', 'Estacionamiento', 'Multa', 'Reserva', 'Otro')) not null,
  periodo text not null,
  monto integer not null,
  fecha_pago date default CURRENT_DATE,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS Policies (Basic Setup - Refine as needed)
-- Allow read access to everyone for public info, restricted for private
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Notices are public
alter table public.notices enable row level security;
create policy "Notices are viewable by everyone" on public.notices for select using (true);

-- Tickets: Users see their own, Admins see all (Logic to be handled in app or advanced policies)
alter table public.tickets enable row level security;
create policy "Users can see own tickets" on public.tickets for select using (auth.uid() = user_id);
create policy "Users can create tickets" on public.tickets for insert with check (auth.uid() = user_id);

-- For now, we will allow authenticated users to read most tables to simplify development
-- In production, you would tighten these policies significantly.
