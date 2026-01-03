-- Add new columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS metodo_pago text,
ADD COLUMN IF NOT EXISTS observacion text;

-- Update the check constraint for 'type' to allow 'Gasto Común' (with accent)
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_type_check;

ALTER TABLE public.payments 
ADD CONSTRAINT payments_type_check 
CHECK (type IN ('Gasto Común', 'Gasto Comun', 'Estacionamiento', 'Multa', 'Reserva', 'Otro'));
