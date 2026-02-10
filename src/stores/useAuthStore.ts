import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

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
        const { data: { session } } = await supabase.auth.getSession();

        const fetchRole = async (userId: string) => {
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();
            return data?.role || 'customer';
        };

        if (session?.user) {
            const role = await fetchRole(session.user.id);
            set({ user: session.user, role, loading: false });
        } else {
            set({ user: null, role: null, loading: false });
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const role = await fetchRole(session.user.id);
                set({ user: session.user, role, loading: false });
            } else {
                set({ user: null, role: null, loading: false });
            }
        });
    },
}));
