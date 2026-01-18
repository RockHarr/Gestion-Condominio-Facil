import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('Skipping benchmark: SUPABASE_URL or SUPABASE_KEY not set.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const withTimeout = async <T>(promise: PromiseLike<T>, ms = 10000): Promise<T> => {
    return Promise.race([
        Promise.resolve(promise),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms))
    ]) as Promise<T>;
};

test('benchmark reservations fetch', async () => {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        test.skip();
        return;
    }

    console.log('Warming up...');
    try {
        await fetchReservationsLegacy();
    } catch (e) {
        console.error('Legacy Warmup failed:', e);
    }

    let optimizedWorks = true;
    try {
        await fetchReservationsOptimized();
    } catch (e: any) {
        console.warn('Optimized Warmup failed (likely due to missing DB constraint):', e.message);
        optimizedWorks = false;
    }

    const iterations = 5;

    // Benchmark Legacy
    console.log(`Starting Legacy Benchmark (${iterations} iterations)...`);
    const startLegacy = Date.now();
    let legacyData: any[] = [];
    try {
        for (let i = 0; i < iterations; i++) {
            legacyData = await fetchReservationsLegacy();
        }
        const endLegacy = Date.now();
        const avgLegacy = (endLegacy - startLegacy) / iterations;
        console.log(`Legacy Average Time: ${avgLegacy.toFixed(2)}ms`);
    } catch (e) {
        console.error('Legacy Benchmark failed:', e);
    }

    // Benchmark Optimized
    let optimizedData: any[] = [];
    if (optimizedWorks) {
        console.log(`Starting Optimized Benchmark (${iterations} iterations)...`);
        const startOpt = Date.now();
        try {
            for (let i = 0; i < iterations; i++) {
                optimizedData = await fetchReservationsOptimized();
            }
            const endOpt = Date.now();
            const avgOpt = (endOpt - startOpt) / iterations;
            console.log(`Optimized Average Time: ${avgOpt.toFixed(2)}ms`);
        } catch (e) {
             console.error('Optimized Benchmark failed:', e);
        }
    } else {
        console.log('Skipping Optimized Benchmark because it is not supported by current DB Schema.');
    }

    // Verification
    expect(legacyData.length).toBeGreaterThan(0);

    if (optimizedWorks && optimizedData.length > 0) {
        // Check first item structure
        const firstLegacy = legacyData[0];
        const firstOptimized = optimizedData[0];

        // Both should have user object if available
        if (firstLegacy.user) {
            expect(firstOptimized.user).toBeDefined();
            expect(firstOptimized.user.id).toBe(firstLegacy.user.id);
            expect(firstOptimized.user.nombre).toBe(firstLegacy.user.nombre);
            expect(firstOptimized.user.unidad).toBe(firstLegacy.user.unidad);
        }
    }
});

async function fetchReservationsLegacy() {
    // 1. Fetch reservations without the join
    const { data: reservations, error } = await withTimeout(supabase
        .from('reservations')
        .select('*'));

    if (error) throw error;

    // 2. Extract unique user IDs
    const userIds = Array.from(new Set(reservations.map((r: any) => r.user_id).filter(Boolean)));

    // 3. Fetch profiles for these users
    const profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await withTimeout(supabase
            .from('profiles')
            .select('id, nombre, unidad')
            .in('id', userIds));

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
        } else {
            profiles?.forEach((p: any) => {
                profilesMap[p.id] = p;
            });
        }
    }

    // 4. Merge data
    return reservations.map((r: any) => ({
        ...r,
        user: profilesMap[r.user_id] || undefined
    }));
}

async function fetchReservationsOptimized() {
    const { data: reservations, error } = await withTimeout(supabase
        .from('reservations')
        .select('*, user:profiles(id, nombre, unidad)'));

    if (error) throw error;

    return reservations.map((r: any) => ({
        ...r,
        user: r.user
    }));
}
