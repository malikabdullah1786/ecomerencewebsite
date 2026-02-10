import { X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../lib/supabase';

export const AccountSettingsModal = ({ onClose }: { onClose: () => void }) => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        if (user) {
            setLoading(true);
            const fetchProfile = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setFormData({
                        fullName: data.full_name || '',
                        email: user.email || '',
                        phone: data.phone || ''
                    });
                }
                setLoading(false);
            };
            fetchProfile();
        }
    }, [user]);

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

                <h2 className="text-2xl font-black mb-6">Account Settings</h2>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold opacity-70">Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="John Doe"
                                className="w-full bg-foreground/5 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold opacity-70">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="w-full bg-foreground/5 rounded-xl px-4 py-3 outline-none opacity-50 cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold opacity-70">Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+92 300 1234567"
                                className="w-full bg-foreground/5 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-primary/20"
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-4 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
