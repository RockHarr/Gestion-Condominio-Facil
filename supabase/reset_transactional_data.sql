-- Script para limpiar datos transaccionales (Reset para Demo/QA)
-- Mantiene: Usuarios, Perfiles, Amenities y Configuración de Comunidad.
-- Borra: Reservas, Pagos, Cargos, Tickets, Avisos, Votaciones.

BEGIN;

-- 1. Truncate con CASCADE para limpiar tablas dependientes
TRUNCATE TABLE 
    poll_responses,
    poll_options,
    polls,
    deposit_decisions,
    incidents,
    charges,
    payments,
    common_expense_debts,
    parking_debts,
    reservations,
    tickets,
    notices,
    financial_statements
RESTART IDENTITY CASCADE;

-- 2. Resetear secuencias si es necesario (generalmente RESTART IDENTITY lo hace)

COMMIT;

-- Opcional: Insertar datos semilla mínimos si se requiere
-- \i supabase/seed_phase4.sql 
