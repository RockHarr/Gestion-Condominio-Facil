DO $$$$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Public read profiles" ON profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'units') THEN
        ALTER TABLE units ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Public read units" ON units;
        CREATE POLICY "Public read units" ON units FOR SELECT USING (true);
    END IF;
END $$$$;
