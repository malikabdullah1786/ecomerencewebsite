import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const AuthPage = ({ type = 'login', onClose }: { type?: 'login' | 'signup', onClose?: () => void }) => {
    const [mode, setMode] = useState<'login' | 'signup'>(type);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName }
                    }
                });
                if (error) throw error;
                alert('Verification email sent!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6 pt-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass w-full max-w-md p-10 rounded-[2.5rem] border-white/10 shadow-2xl relative overflow-hidden"
            >
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 z-10 p-2 hover:bg-foreground/5 rounded-full transition-colors opacity-50 hover:opacity-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -mr-16 -mt-16" />

                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black tracking-tighter mb-2">
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-sm opacity-50">
                        {mode === 'login' ? 'The premium shopping experience awaits.' : 'Join the All-in-One Store today.'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    {mode === 'signup' && (
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
                            <input
                                type="text"
                                placeholder="Full Name"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-foreground/5 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 ring-primary/30 transition-all outline-none"
                            />
                        </div>
                    )}

                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
                        <input
                            type="email"
                            placeholder="Email Address"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-foreground/5 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 ring-primary/30 transition-all outline-none"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-foreground/5 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 ring-primary/30 transition-all outline-none"
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

                    <button
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 group"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                {mode === 'login' ? 'Sign In' : 'Sign Up'}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm">
                    <span className="opacity-50">
                        {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                    </span>
                    <button
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        className="text-primary font-black hover:underline"
                    >
                        {mode === 'login' ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
