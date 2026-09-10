DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservation_types') THEN
    ALTER TABLE reservation_types
    ADD COLUMN IF NOT EXISTS rules TEXT,
    ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT TRUE;
  END IF;
END $$;
