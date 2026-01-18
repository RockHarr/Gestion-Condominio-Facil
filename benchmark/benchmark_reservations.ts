
import { performance } from 'perf_hooks';

// --- Mock Data ---
const USERS = [
    { id: 'user1', nombre: 'Alice', unidad: '101' },
    { id: 'user2', nombre: 'Bob', unidad: '102' },
    { id: 'user3', nombre: 'Charlie', unidad: '201' },
];

const RESERVATIONS = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    amenity_id: 1,
    user_id: USERS[i % USERS.length].id, // Cyclic assignment
    start_at: new Date().toISOString(),
    end_at: new Date().toISOString(),
    status: 'CONFIRMED',
    is_system: false,
    system_reason: null,
    form_data: {}
}));

// --- Mock Supabase Client ---

const SIMULATED_LATENCY_MS = 50;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockSupabaseQuery {
    private table: string;
    private selectStr: string = '*';
    private filters: any[] = [];

    constructor(table: string) {
        this.table = table;
    }

    select(selector: string) {
        this.selectStr = selector;
        return this;
    }

    in(column: string, values: any[]) {
        this.filters.push({ type: 'in', column, values });
        return this;
    }

    eq(column: string, value: any) {
        this.filters.push({ type: 'eq', column, value });
        return this;
    }

    order(column: string, opts: any) {
        return this; // Ignore order for benchmark
    }

    // This makes the object awaitable (Thenable)
    async then(resolve: any, reject: any) {
        await sleep(SIMULATED_LATENCY_MS);

        try {
            let result: any[] = [];

            if (this.table === 'reservations') {
                result = JSON.parse(JSON.stringify(RESERVATIONS)); // Deep copy

                // Handle Join
                if (this.selectStr.includes('user:profiles')) {
                     result = result.map(r => {
                        const user = USERS.find(u => u.id === r.user_id);
                        return {
                            ...r,
                            user: user ? { id: user.id, nombre: user.nombre, unidad: user.unidad } : null
                        };
                     });
                }
            } else if (this.table === 'profiles') {
                result = JSON.parse(JSON.stringify(USERS)); // Deep copy
                // Apply filters
                const inFilter = this.filters.find(f => f.type === 'in');
                if (inFilter) {
                    result = result.filter(u => inFilter.values.includes(u.id));
                }
            }

            resolve({ data: result, error: null });
        } catch (e) {
            resolve({ data: null, error: e });
        }
    }
}

const mockSupabase = {
    from: (table: string) => new MockSupabaseQuery(table)
};

// Helper for timeouts (copied from services/data.ts)
const withTimeout = async <T>(promise: PromiseLike<T>, ms = 10000): Promise<T> => {
    return Promise.race([
        Promise.resolve(promise),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms))
    ]) as Promise<T>;
};

// --- Implementations ---

async function getReservationsOriginal() {
    // 1. Fetch reservations without the join
    const { data: reservations, error } = await withTimeout(mockSupabase
        .from('reservations')
        .select('*'));

    if (error) throw error;

    // 2. Extract unique user IDs
    const userIds = Array.from(new Set(reservations.map((r: any) => r.user_id).filter(Boolean)));

    // 3. Fetch profiles for these users
    let profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await withTimeout(mockSupabase
            .from('profiles')
            .select('id, nombre, unidad')
            .in('id', userIds));

        if (profilesError) {
            console.error('DataService: Error fetching profiles for reservations:', profilesError);
        } else {
            profiles?.forEach((p: any) => {
                profilesMap[p.id] = p;
            });
        }
    }

    // 4. Merge data
    return reservations.map((r: any) => ({
        id: r.id,
        amenityId: r.amenity_id,
        userId: r.user_id,
        startAt: r.start_at,
        endAt: r.end_at,
        status: r.status,
        isSystem: r.is_system,
        systemReason: r.system_reason,
        formData: r.form_data,
        user: profilesMap[r.user_id] || undefined
    }));
}

async function getReservationsOptimized() {
    const { data: reservations, error } = await withTimeout(mockSupabase
        .from('reservations')
        .select('*, user:profiles(id, nombre, unidad)'));

    if (error) throw error;

    return reservations.map((r: any) => ({
        id: r.id,
        amenityId: r.amenity_id,
        userId: r.user_id,
        startAt: r.start_at,
        endAt: r.end_at,
        status: r.status,
        isSystem: r.is_system,
        systemReason: r.system_reason,
        formData: r.form_data,
        user: r.user || undefined // Handle null -> undefined to match original
    }));
}

// --- Benchmark Runner ---

async function runBenchmark() {
    console.log('--- Starting Benchmark ---');
    console.log(`Simulated Network Latency: ${SIMULATED_LATENCY_MS}ms per request`);

    // Run Original
    const startOriginal = performance.now();
    const resultOriginal = await getReservationsOriginal();
    const endOriginal = performance.now();
    const timeOriginal = endOriginal - startOriginal;
    console.log(`Original Implementation: ${timeOriginal.toFixed(2)}ms`);

    // Run Optimized
    const startOptimized = performance.now();
    const resultOptimized = await getReservationsOptimized();
    const endOptimized = performance.now();
    const timeOptimized = endOptimized - startOptimized;
    console.log(`Optimized Implementation: ${timeOptimized.toFixed(2)}ms`);

    // Verify Equality
    const jsonOriginal = JSON.stringify(resultOriginal);
    const jsonOptimized = JSON.stringify(resultOptimized);

    if (jsonOriginal === jsonOptimized) {
        console.log('✅ Correctness Verified: Results are identical.');
    } else {
        console.log('⚠️ Results differ!');
        // Simple check
        if (resultOriginal.length !== resultOptimized.length) {
             console.log('Length mismatch');
        } else {
             // Inspect first difference
             for(let i=0; i<resultOriginal.length; i++) {
                 if (JSON.stringify(resultOriginal[i]) !== JSON.stringify(resultOptimized[i])) {
                     console.log(`Mismatch at index ${i}`);
                     console.log('Original:', JSON.stringify(resultOriginal[i], null, 2));
                     console.log('Optimized:', JSON.stringify(resultOptimized[i], null, 2));
                     break;
                 }
             }
        }
    }
}

runBenchmark().catch(console.error);
