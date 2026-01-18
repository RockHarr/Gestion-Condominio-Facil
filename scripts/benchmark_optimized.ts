
async function main() {
    console.log("Starting Optimized Benchmark...");
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
        },
        channel: (name: string) => ({
            on: (type: any, config: any, callback: any) => {
                // Check if this is the correct event subscription
                if (config.event === 'INSERT' && config.table === 'profiles') {
                    // Simulate event arrival when profile is ready
                    const delayRemaining = Math.max(0, PROFILE_CREATION_DELAY - (Date.now() - startTime));
                    setTimeout(() => {
                        callback({
                            new: {
                                id: 'user123',
                                nombre: 'Test User',
                                role: 'resident',
                                unidad: '101'
                            }
                        });
                    }, delayRemaining);
                }
                return { subscribe: () => {} };
            }
        }),
        removeChannel: () => {
            // No-op for mock
        }
    };

    // Optimized Logic (Simulating authService.onAuthStateChange)
    const onAuthStateChange = (callback: (user: any) => void) => {
        return mockSupabase.auth.onAuthStateChange(async (event: any, session: any) => {
            if (session?.user) {
                // Try to fetch profile once
                const { data: profile, error } = await mockSupabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile && !error) {
                    callback({ ...session.user, ...profile });
                } else {
                    // Profile not found yet (Trigger latency).
                    // 1. Send Optimistic Update immediately
                    console.log("AuthService: Profile not found, applying optimistic update...");
                    callback({
                        id: session.user.id,
                        email: session.user.email,
                        role: 'resident', // Default prediction
                        nombre: session.user.email?.split('@')[0] || 'Usuario',
                        unidad: 'Sin Asignar'
                    });

                    // 2. Listen for the profile creation in real-time
                    console.log("AuthService: Listening for profile creation...");
                    const channel = mockSupabase.channel(`profile_creation:${session.user.id}`)
                        .on('postgres_changes', {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'profiles',
                            filter: `id=eq.${session.user.id}`
                        }, (payload: any) => {
                            console.log("AuthService: Profile created event received");
                            const newProfile = payload.new;
                            // Update with actual data
                            callback({ ...session.user, ...newProfile });
                            // Cleanup
                            mockSupabase.removeChannel(channel);
                        })
                        .subscribe();

                    // Safety cleanup
                    setTimeout(() => {
                        mockSupabase.removeChannel(channel);
                    }, 60000);
                }
            } else {
                callback(null);
            }
        });
    };

    // Run the test
    return new Promise<void>((resolve) => {
        const start = Date.now();
        let callCount = 0;
        onAuthStateChange((user) => {
            callCount++;
            const end = Date.now();
            console.log(`Callback #${callCount} fired after: ${end - start}ms`);
            console.log(`User data received:`, user.nombre);

            if (callCount === 1) {
                // Optimistic check
                if (end - start > 100) {
                    console.error("FAIL: Optimistic update took too long");
                } else {
                    console.log("PASS: Optimistic update was immediate");
                }
            }

            if (callCount === 2) {
                // Final check
                 if (end - start >= PROFILE_CREATION_DELAY) {
                     console.log("PASS: Realtime update received correctly");
                 }
                 resolve();
            }
        });
    });
}

main().catch(console.error);
