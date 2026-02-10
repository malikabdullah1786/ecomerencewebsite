import { motion } from 'framer-motion';
import { X, Lock, Key } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const PrivacySecurityModal = ({ onClose }: { onClose: () => void }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return; // Prevent double submission

        setLoading(true);
        setMessage(null);
        console.log("Starting password update...");

        try {
            // 1. Check Session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                console.error("Session error:", sessionError);
                throw new Error("You must be logged in to change your password.");
            }

            // 2. Update Password with Timeout Safety
            console.log("Calling updateUser...");

            // Create a timeout promise that rejects after 15 seconds
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Request timed out. Please check your internet connection and try again.")), 15000);
            });

            // Race the update against the timeout
            const updatePromise = supabase.auth.updateUser({ password: password });

            const result: any = await Promise.race([updatePromise, timeoutPromise]);
            const { error } = result;

            if (error) {
                console.error("UpdateUser error:", error);
                throw error;
            }

            console.log("Password updated successfully.");
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setPassword('');

            // Shorter timeout for better UX
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err: any) {
            console.error("Catch block caught:", err);
            setMessage({ type: 'error', text: err.message || "Failed to update password. Please try again." });
        } finally {
            console.log("Finally block: Setting loading to false");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-background w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-foreground/5">
                    <X className="w-6 h-6" />
                </button>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase">Privacy & Security</h2>
                    <p className="opacity-60 text-sm">Manage your account security.</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest opacity-50">Change Password</h3>

                        {message && (
                            <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {message.type === 'success' ? '✅' : '⚠️'} {message.text}
                            </div>
                        )}

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="flex items-center gap-3 bg-foreground/5 p-4 rounded-2xl">
                                <Key className="w-5 h-5 opacity-30" />
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm font-bold w-full"
                                    minLength={6}
                                    required
                                />
                            </div>
                            <button disabled={loading} className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform disabled:opacity-50">
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>

                    <div className="pt-6 border-t border-white/5 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest opacity-50">Two-Factor Authentication</h3>
                        <div className="flex items-center justify-between bg-foreground/5 p-4 rounded-2xl opacity-50 cursor-not-allowed">
                            <span className="text-sm font-bold">Enable 2FA (SMS)</span>
                            <div className="w-10 h-5 bg-foreground/20 rounded-full relative">
                                <div className="w-5 h-5 bg-white rounded-full scale-75" />
                            </div>
                        </div>
                        <p className="text-[10px] opacity-40 text-center">Coming soon for all users.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
