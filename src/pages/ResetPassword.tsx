import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToastStore } from '../stores/useToastStore';

export const ResetPassword = ({ onComplete }: { onComplete: () => void }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const toast = useToastStore();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            toast.show('Password updated successfully!', 'success');
            onComplete();
        } catch (err: any) {
            setError(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass w-full max-w-md p-10 rounded-[2.5rem] border-white/10 shadow-2xl relative overflow-hidden"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                </div>

                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black tracking-tighter mb-2 text-white">
                        Reset Password
                    </h2>
                    <p className="text-base font-medium text-white/70">
                        Please enter your new password below.
                    </p>
                </div>

                <form onSubmit={handleReset} className="space-y-6">
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 group-focus-within:text-white transition-opacity" />
                        <input
                            type="password"
                            placeholder="New Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 ring-primary/50 transition-all outline-none text-white placeholder:text-white/40 font-medium"
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 group-focus-within:text-white transition-opacity" />
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 ring-primary/50 transition-all outline-none text-white placeholder:text-white/40 font-medium"
                        />
                    </div>

                    {error && <p className="text-red-400 text-xs font-bold text-center">{error}</p>}

                    <button
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 group mt-4"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                Update Password
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
