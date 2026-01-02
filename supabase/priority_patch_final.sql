-- ============================================
-- RockCode | Condominios | DB Priority Patch (Final)
-- Objetivo: Cerrar RLS + permisos por rol (admin/resident)
-- Base: schema.sql actual + Mejoras de seguridad + Sugerencias Supabase
-- ============================================

BEGIN;

-- 0) Extensión necesaria
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Helper function: is_admin()
-- SECURITY DEFINER: Ejecuta con permisos del creador (para evitar recursión infinita en RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  );
$$;

-- Revocar ejecución pública (Mejora de seguridad)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- 2) Habilitar RLS en tablas (Idempotente)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.community_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.common_expense_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.parking_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.financial_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reserve_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;

-- 3) Limpiar policies antiguas (Combinación de nombres comunes para asegurar limpieza)
-- PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS profiles_view_public ON public.profiles;
DROP POLICY IF EXISTS users_insert_own_profile ON public.profiles;
DROP POLICY IF EXISTS users_update_own_profile ON public.profiles;
-- Limpiar las que vamos a crear para asegurar que se actualicen
DROP POLICY IF EXISTS profiles_select_own_or_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;

-- NOTICES
DROP POLICY IF EXISTS "Notices are viewable by everyone" ON public.notices;
DROP POLICY IF EXISTS notices_view_public ON public.notices;
DROP POLICY IF EXISTS notices_select_published ON public.notices;
DROP POLICY IF EXISTS notices_admin_all ON public.notices;

-- TICKETS
DROP POLICY IF EXISTS "Users can see own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS tickets_view_own ON public.tickets;
DROP POLICY IF EXISTS tickets_create_own ON public.tickets;
DROP POLICY IF EXISTS tickets_select_own_or_admin ON public.tickets;
DROP POLICY IF EXISTS tickets_insert_own ON public.tickets;
DROP POLICY IF EXISTS tickets_update_admin ON public.tickets;
DROP POLICY IF EXISTS tickets_delete_admin ON public.tickets;

-- 4) PROFILES policies
CREATE POLICY profiles_select_own_or_admin
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY profiles_insert_own
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5) NOTICES policies
-- Resident/auth ve solo Publicado
CREATE POLICY notices_select_published
  ON public.notices FOR SELECT
  USING (status = 'Publicado' AND auth.role() = 'authenticated');

-- Admin puede todo
CREATE POLICY notices_admin_all
  ON public.notices FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6) TICKETS policies
CREATE POLICY tickets_select_own_or_admin
  ON public.tickets FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY tickets_insert_own
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY tickets_update_admin
  ON public.tickets FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY tickets_delete_admin
  ON public.tickets FOR DELETE
  USING (public.is_admin());

-- 7) DEUDAS policies
-- Limpieza previa
DROP POLICY IF EXISTS common_debts_select_own_or_admin ON public.common_expense_debts;
DROP POLICY IF EXISTS common_debts_admin_write ON public.common_expense_debts;
DROP POLICY IF EXISTS parking_debts_select_own_or_admin ON public.parking_debts;
DROP POLICY IF EXISTS parking_debts_admin_write ON public.parking_debts;

CREATE POLICY common_debts_select_own_or_admin
  ON public.common_expense_debts FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY common_debts_admin_write
  ON public.common_expense_debts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY parking_debts_select_own_or_admin
  ON public.parking_debts FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY parking_debts_admin_write
  ON public.parking_debts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8) PAYMENTS policies
DROP POLICY IF EXISTS payments_select_own_or_admin ON public.payments;
DROP POLICY IF EXISTS payments_admin_write ON public.payments;

CREATE POLICY payments_select_own_or_admin
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY payments_admin_write
  ON public.payments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9) AMENITIES policies
DROP POLICY IF EXISTS amenities_select_authenticated ON public.amenities;
DROP POLICY IF EXISTS amenities_admin_write ON public.amenities;

CREATE POLICY amenities_select_authenticated
  ON public.amenities FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY amenities_admin_write
  ON public.amenities FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 10) RESERVATIONS policies
DROP POLICY IF EXISTS reservations_select_own_or_admin ON public.reservations;
DROP POLICY IF EXISTS reservations_insert_own ON public.reservations;
DROP POLICY IF EXISTS reservations_update_own_or_admin ON public.reservations;
DROP POLICY IF EXISTS reservations_delete_own_or_admin ON public.reservations;

CREATE POLICY reservations_select_own_or_admin
  ON public.reservations FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY reservations_insert_own
  ON public.reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY reservations_update_own_or_admin
  ON public.reservations FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY reservations_delete_own_or_admin
  ON public.reservations FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- 11) TRANSPARENCIA
-- Limpieza
DROP POLICY IF EXISTS settings_select_authenticated ON public.community_settings;
DROP POLICY IF EXISTS settings_admin_update ON public.community_settings;
DROP POLICY IF EXISTS community_settings_select_authenticated ON public.community_settings;
DROP POLICY IF EXISTS community_settings_admin_update ON public.community_settings;

CREATE POLICY settings_select_authenticated
  ON public.community_settings FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_admin());

CREATE POLICY settings_admin_update
  ON public.community_settings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Expenses
DROP POLICY IF EXISTS expenses_select_authenticated ON public.expenses;
DROP POLICY IF EXISTS expenses_admin_write ON public.expenses;

CREATE POLICY expenses_select_authenticated
  ON public.expenses FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_admin());

CREATE POLICY expenses_admin_write
  ON public.expenses FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Financial Statements
DROP POLICY IF EXISTS financial_select_authenticated ON public.financial_statements;
DROP POLICY IF EXISTS financial_admin_write ON public.financial_statements;

CREATE POLICY financial_select_authenticated
  ON public.financial_statements FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_admin());

CREATE POLICY financial_admin_write
  ON public.financial_statements FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Reserve Fund
DROP POLICY IF EXISTS reserve_select_authenticated ON public.reserve_fund;
DROP POLICY IF EXISTS reserve_admin_write ON public.reserve_fund;

CREATE POLICY reserve_select_authenticated
  ON public.reserve_fund FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_admin());

CREATE POLICY reserve_admin_write
  ON public.reserve_fund FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 12) Índices / unicidad
CREATE UNIQUE INDEX IF NOT EXISTS ux_common_debt_user_mes
  ON public.common_expense_debts(user_id, mes);

CREATE UNIQUE INDEX IF NOT EXISTS ux_parking_debt_user_pat_mes
  ON public.parking_debts(user_id, patente, mes);

CREATE UNIQUE INDEX IF NOT EXISTS ux_reservation_slot
  ON public.reservations(amenity_id, fecha, hora);

-- Performance básico
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON public.tickets(estado);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);

-- Índice adicional recomendado para is_admin lookup (Mejora Supabase)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

COMMIT;
