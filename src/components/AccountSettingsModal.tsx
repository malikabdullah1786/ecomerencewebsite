import { X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../lib/supabase';

export const AccountSettingsModal = ({ onClose }: { onClose: () => void }) => {
    const { user, role } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        if (user) {
            const loadData = async () => {
                setLoading(true);
                // Pre-populate from metadata as fallback
                setFormData({
                    fullName: user.user_metadata?.full_name || '',
                    email: user.email || '',
                    phone: ''
                });

                try {
                    const { data } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (data) {
                        setFormData(prev => ({
                            ...prev,
                            fullName: data.full_name || prev.fullName,
                            phone: data.phone || ''
                        }));
                        // Update global store role as well
                        if (data.role !== role) {
                            useAuthStore.setState({ role: data.role });
                        }
                    }
                } catch (err) {
                    console.error('Error fetching profile:', err);
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }
    }, [user, role]);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: formData.fullName,
                    phone: formData.phone,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            alert('Profile updated successfully!');
            onClose();
        } catch (error: any) {
            alert('Error updating profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="bg-background w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-white/10 relative">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-foreground/5">
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-black mb-6 italic tracking-tighter uppercase underline decoration-primary decoration-4">Account Settings</h2>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-1">Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="Your full name"
                                className="w-full bg-foreground/5 rounded-2xl px-4 py-4 outline-none focus:ring-2 ring-primary/20 text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-1">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="w-full bg-foreground/5 rounded-2xl px-4 py-4 outline-none opacity-50 cursor-not-allowed text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-1">Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+92 3XX XXXXXXX"
                                className="w-full bg-foreground/5 rounded-2xl px-4 py-4 outline-none focus:ring-2 ring-primary/20 text-sm font-bold"
                            />
                        </div>

                        <div className="pt-4 border-t border-white/10 flex gap-4">
                            <button
                                onClick={() => {
                                    const fetch = async () => {
                                        setLoading(true);
                                        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                                        if (data) {
                                            useAuthStore.setState({ role: data.role });
                                            alert('Settings Refreshed! Profile Status: ' + data.role);
                                        }
                                        setLoading(false);
                                    };
                                    fetch();
                                }}
                                className="flex-grow py-4 bg-foreground/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-foreground/10 transition-colors"
                            >
                                Refresh Data
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
