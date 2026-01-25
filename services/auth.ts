import { supabase } from '../lib/supabase';
import type { ProfileRow } from '../types';
import type { AuthResponse, UserResponse } from '@supabase/supabase-js';

// Type for the user object passed to callback
export interface AuthUser {
  id: string;
  email?: string;
  role?: 'resident' | 'admin';
  nombre?: string;
  unidad?: string;
  has_parking?: boolean;
}

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
      const result = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 60000)),
      ]);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      return { data: { user: null, session: null }, error };
    }
  },

  async signOut() {
    console.log('AuthService: signOut called');
    const { error } = await supabase.auth.signOut();
    console.log('AuthService: signOut result', error);
    return { error };
  },

  async updatePassword(password: string) {
    console.log('AuthService: updatePassword called');
    try {
      const result = await Promise.race([
        supabase.auth.updateUser({ password: password }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout: El servidor tardó mucho en responder')),
            60000,
          ),
        ),
      ]);
      console.log('AuthService: updatePassword result', result.data, result.error);
      return result;
    } catch (err) {
      console.error('AuthService: updatePassword timeout or error', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      return { data: { user: null }, error };
    }
  },

  async getCurrentUser() {
    try {
      // Use getSession instead of getUser for initial load to avoid network hangs
      // getSession reads from local storage and is instant
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

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
      console.error('AuthService: getCurrentUser error', error);
      return null;
    }
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`AuthService: Event ${event}`, session?.user?.email);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
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
            // Profile not found yet (Trigger latency) or error
            console.log('AuthService: Profile not found, applying optimistic update...');
            callback({
              id: session.user.id,
              email: session.user.email,
              role: 'resident', // Default prediction
              nombre: session.user.email?.split('@')[0] || 'Usuario',
              unidad: 'Sin Asignar',
            });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
      // Ignore other events like PASSWORD_RECOVERY to avoid state thrashing
    });
  },
};
