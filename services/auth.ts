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
                let profile = null;
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (error) {
                        // If not found (PGRST116 or 406), try to create it
                        const newProfile = {
                            id: session.user.id,
                            email: session.user.email,
                            role: 'resident',
                            nombre: session.user.email?.split('@')[0] || 'Usuario',
                            unidad: 'Sin Asignar'
                        };

                        const { data: createdProfile } = await supabase
                            .from('profiles')
                            .insert(newProfile)
                            .select()
                            .single();

                        profile = createdProfile;
                    } else {
                        profile = data;
                    }
                } catch (err) {
                    console.error("AuthService: Exception fetching/creating profile", err);
                }

                // Fallback if creation failed or still null
                if (!profile && session.user) {
                    callback({
                        id: session.user.id,
                        email: session.user.email,
                        role: 'resident', // Default role
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
    }
};
