ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read all reservations" ON public.reservations;
CREATE POLICY "Read all reservations" ON public.reservations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin all reservations" ON public.reservations;
CREATE POLICY "Admin all reservations" ON public.reservations FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read units" ON public.units;
CREATE POLICY "Public read units" ON public.units FOR SELECT USING (true);

ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read amenities" ON public.amenities;
CREATE POLICY "Public read amenities" ON public.amenities FOR SELECT USING (true);
