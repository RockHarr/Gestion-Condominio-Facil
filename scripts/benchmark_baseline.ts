
async function main() {
    console.log("Starting Baseline Benchmark...");
    const startTime = Date.now();
    const PROFILE_CREATION_DELAY = 2000; // Profile created after 2s

    // Mock Supabase
    const mockSupabase = {
        from: (table: string) => ({
            select: (columns: string) => ({
                eq: (col: string, val: string) => ({
                    single: async () => {
                        const elapsed = Date.now() - startTime;
                        if (elapsed < PROFILE_CREATION_DELAY) {
                            return { data: null, error: { message: 'Not found' } };
                        }
                        return {
                            data: {
                                id: val,
                                nombre: 'Test User',
                                role: 'resident',
                                unidad: '101'
                            },
                            error: null
                        };
                    }
                })
            })
        }),
        auth: {
            onAuthStateChange: (callback: any) => {
                // Trigger immediately
                callback('SIGNED_IN', { user: { id: 'user123', email: 'test@example.com' } });
                return { data: { subscription: { unsubscribe: () => {} } } };
            }
        }
    };

    // The Logic to Test (Simulating authService.onAuthStateChange)
    const onAuthStateChange = (callback: (user: any) => void) => {
        return mockSupabase.auth.onAuthStateChange(async (event: any, session: any) => {
            if (session?.user) {
                let profile = null;
                let attempts = 0;
                const maxAttempts = 3;

                // --- BLOCKING LOOP START ---
                while (attempts < maxAttempts && !profile) {
                    try {
                        const { data, error } = await mockSupabase
                            .from('profiles')
                            .select('*')
                            .eq('id', session.user.id)
                            .single();

                        if (!error && data) {
                            profile = data;
                            break;
                        } else {
                            // If not found, wait and retry (Trigger might be slow)
                            console.log(`AuthService: Profile not found (attempt ${attempts + 1}), waiting...`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    } catch (err) {
                        console.error("AuthService: Exception fetching profile", err);
                    }
                    attempts++;
                }
                // --- BLOCKING LOOP END ---

                if (!profile) {
                    callback({
                        id: session.user.id,
                        email: session.user.email,
                        role: 'resident',
                        nombre: session.user.email?.split('@')[0] || 'Usuario',
                        unidad: 'Sin Asignar'
                    });
                } else {
                    callback({ ...session.user, ...profile });
                }
            } else {
                callback(null);
            }
        });
    };

    // Run the test
    return new Promise<void>((resolve) => {
        const start = Date.now();
        onAuthStateChange((user) => {
            const end = Date.now();
            console.log(`Callback fired after: ${end - start}ms`);
            console.log(`User data received:`, user);
            resolve();
        });
    });
}

main().catch(console.error);
