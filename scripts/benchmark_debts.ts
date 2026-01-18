
// Helper for timeouts (mimicking services/data.ts)
const withTimeout = async <T>(promise: PromiseLike<T>, ms = 10000): Promise<T> => {
    return Promise.race([
        Promise.resolve(promise),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms))
    ]) as Promise<T>;
};

// Mock Supabase Client
class MockSupabaseQueryBuilder {
    constructor(private tableName: string, private delay: number) {}

    update(data: any) {
        return this;
    }

    eq(column: string, value: any) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ error: null });
            }, this.delay);
        });
    }
}

class MockSupabaseClient {
    constructor(private delay: number = 500) {}

    from(tableName: string) {
        return new MockSupabaseQueryBuilder(tableName, this.delay);
    }
}

const DELAY_MS = 500;
const supabase = new MockSupabaseClient(DELAY_MS);

// Sequential Implementation (Current)
async function payAllDebtsSequential(userId: string | number) {
    const { error: error1 } = await withTimeout(supabase
        .from('common_expense_debts')
        .update({ pagado: true })
        .eq('user_id', userId)) as any;

    const { error: error2 } = await withTimeout(supabase
        .from('parking_debts')
        .update({ pagado: true })
        .eq('user_id', userId)) as any;

    if (error1 || error2) throw new Error("Error paying debts");
}

// Parallel Implementation (Optimized)
async function payAllDebtsParallel(userId: string | number) {
    const [result1, result2] = await Promise.all([
        withTimeout(supabase
            .from('common_expense_debts')
            .update({ pagado: true })
            .eq('user_id', userId)),
        withTimeout(supabase
            .from('parking_debts')
            .update({ pagado: true })
            .eq('user_id', userId))
    ]);

    const { error: error1 } = result1 as any;
    const { error: error2 } = result2 as any;

    if (error1 || error2) throw new Error("Error paying debts");
}

async function runBenchmark() {
    console.log(`Starting benchmark with ${DELAY_MS}ms simulated DB latency...`);

    // Measure Sequential
    const startSeq = performance.now();
    await payAllDebtsSequential('123');
    const endSeq = performance.now();
    const timeSeq = endSeq - startSeq;
    console.log(`Sequential execution time: ${timeSeq.toFixed(2)}ms`);

    // Measure Parallel
    const startPar = performance.now();
    await payAllDebtsParallel('123');
    const endPar = performance.now();
    const timePar = endPar - startPar;
    console.log(`Parallel execution time: ${timePar.toFixed(2)}ms`);

    const improvement = ((timeSeq - timePar) / timeSeq) * 100;
    console.log(`Performance improvement: ${improvement.toFixed(2)}%`);
}

runBenchmark().catch(console.error);
