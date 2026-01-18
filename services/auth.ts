import { supabase } from '../lib/supabase';
import { User } from '../types';

export const authService = {
    async signIn(email: string) {
        // For the "Magic Link" experience (easier for users):
        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
            },
        });
        return { data, error };
    },

    async signInWithPassword(email: string, password: string) {
        try {
            const { data, error } = await Promise.race([
                supabase.auth.signInWithPassword({ email, password }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 60000))
            ]) as any;
            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    },

    async signOut() {
        console.log("AuthService: signOut called");
        const { error } = await supabase.auth.signOut();
        console.log("AuthService: signOut result", error);
        return { error };
    },

    async updatePassword(password: string) {
        console.log("AuthService: updatePassword called");
        try {
            const { data, error } = await Promise.race([
                supabase.auth.updateUser({ password: password }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: El servidor tardó mucho en responder')), 60000))
            ]) as any;
            console.log("AuthService: updatePassword result", data, error);
            return { data, error };
        } catch (err) {
            console.error("AuthService: updatePassword timeout or error", err);
            return { data: null, error: err };
        }
    },

    async getCurrentUser() {
        try {
            // Use getSession instead of getUser for initial load to avoid network hangs
            // getSession reads from local storage and is instant
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session?.user) {
                return null;
            }

            const user = session.user;

            // Fetch profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            return { user, profile };
        } catch (error) {
            console.error("AuthService: getCurrentUser error", error);
            return null;
        }
    },

    onAuthStateChange(callback: (user: any) => void) {
        return supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("AuthService: onAuthStateChange event:", event, "Session:", session?.user?.email);
            if (session?.user) {
                // Try to fetch profile once
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile && !error) {
                    callback({ ...session.user, ...profile });
                } else {
                    // Profile not found yet (Trigger latency).
                    // 1. Send Optimistic Update immediately so UI is unblocked
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
                    const channel = supabase.channel(`profile_creation:${session.user.id}`)
                        .on('postgres_changes', {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'profiles',
                            filter: `id=eq.${session.user.id}`
                        }, (payload) => {
                            console.log("AuthService: Profile created event received", payload);
                            const newProfile = payload.new;
                            // Update with actual data
                            callback({ ...session.user, ...newProfile });
                            // Cleanup
                            supabase.removeChannel(channel);
                        })
                        .subscribe();

                    // Safety cleanup if profile never arrives
                    setTimeout(() => {
                        supabase.removeChannel(channel);
                    }, 60000);
                }
            } else {
                callback(null);
            }
        });
    }
};
