import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// Module-level subscription — prevents listener stacking on every initialize() call
let authSubscription: { unsubscribe: () => void } | null = null;

interface AuthState {
    user: User | null;
    role: 'admin' | 'merchant' | 'customer' | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    signOut: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    role: null,
    loading: true,
    setUser: (user) => set({ user, loading: false }),
    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, role: null });
    },
    initialize: async () => {
        try {
            console.log('🔄 Initializing Auth Store...');

            // Race getSession() against a 10-second timeout so we never hang forever
            const sessionResult = await Promise.race<ReturnType<typeof supabase.auth.getSession>>([
                supabase.auth.getSession(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Auth session fetch timed out')), 10000)
                ),
            ]);

            const { data: { session }, error: sessionError } = await sessionResult;

            if (sessionError) {
                console.error('❌ Session fetch error:', sessionError);
                throw sessionError;
            }

            const fetchRole = async (userId: string) => {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', userId)
                        .single();

                    if (error) {
                        console.warn('⚠️ Profile fetch error (might be first login):', error.message);
                        return 'customer';
                    }
                    return data?.role || 'customer';
                } catch (e) {
                    console.error('❌ Unexpected error fetching role:', e);
                    return 'customer';
                }
            };

            if (session?.user) {
                console.log('👤 User session found:', session.user.email);
                const role = await fetchRole(session.user.id);
                console.log('🎭 User role:', role);
                set({ user: session.user, role, loading: false });
            } else {
                console.log('📭 No active session');
                set({ user: null, role: null, loading: false });
            }

            // Unsubscribe from any previous listener before registering a new one
            if (authSubscription) {
                authSubscription.unsubscribe();
                authSubscription = null;
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('🔄 Auth state changed:', event, session?.user?.email);

                if (event === 'PASSWORD_RECOVERY') {
                    console.log('🔑 Password recovery mode detected');
                    window.location.hash = '#reset-password';
                }

                if (session?.user) {
                    const role = await fetchRole(session.user.id);
                    set({ user: session.user, role, loading: false });
                } else {
                    set({ user: null, role: null, loading: false });
                }
            });

            authSubscription = subscription;
        } catch (err) {
            console.error('❌ Auth initialization failed:', err);
            set({ user: null, role: null, loading: false });
        }
    },
}));
