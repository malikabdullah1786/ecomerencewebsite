import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../lib/supabase';
import { Package, Clock, MapPin, ChevronRight, LogOut, Settings, Shield } from 'lucide-react';
import { AccountSettingsModal } from '../components/AccountSettingsModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { PrivacySecurityModal } from '../components/PrivacySecurityModal';

export const ProfilePage = () => {
    const { user, signOut } = useAuthStore();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [showPrivacy, setShowPrivacy] = useState(false);

    useEffect(() => {
        if (user) {
            const fetchOrders = async () => {
                const { data } = await supabase
                    .from('orders')
                    .select('*, order_items(*, products(*))')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (data) setOrders(data);
                setLoading(false);
            };
            fetchOrders();
        }
    }, [user]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background pt-32 pb-24 px-6 font-primary">
            {showSettings && <AccountSettingsModal onClose={() => setShowSettings(false)} />}
            {selectedOrder && <ReceiptModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
            {showPrivacy && <PrivacySecurityModal onClose={() => setShowPrivacy(false)} />}

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="glass p-8 rounded-[3rem] border-white/5 space-y-8 shadow-2xl">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-black">
                                {user.email?.[0].toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter">{user.user_metadata?.full_name || 'Member'}</h2>
                                <p className="text-sm opacity-50 font-medium">{user.email}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-8 border-t border-white/10">
                            <button onClick={() => setShowSettings(true)} className="flex items-center gap-4 w-full p-4 rounded-2xl bg-foreground/5 hover:bg-primary/10 hover:text-primary transition-all group">
                                <Settings className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                                <span className="font-black text-sm uppercase tracking-widest">Account Settings</span>
                            </button>
                            <button onClick={() => setShowPrivacy(true)} className="flex items-center gap-4 w-full p-4 rounded-2xl bg-foreground/5 hover:bg-primary/10 hover:text-primary transition-all group">
                                <Shield className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                                <span className="font-black text-sm uppercase tracking-widest">Privacy & Security</span>
                            </button>
                            <button
                                onClick={() => signOut()}
                                className="flex items-center gap-4 w-full p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all group"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-black text-sm uppercase tracking-widest">Sign Out</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-8 bg-primary rounded-[2.5rem] text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
                        <div className="relative z-10 space-y-2">
                            <h4 className="text-xl font-black italic">Premium Member 💎</h4>
                            <p className="text-xs opacity-70 font-medium">Enjoy exclusive discounts and priority delivery.</p>
                        </div>
                        <Shield className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 transition-transform group-hover:scale-110" />
                    </div>
                </div>

                {/* Order History */}
                <div className="lg:col-span-8 space-y-12">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter italic uppercase">Order History</h1>
                        <p className="opacity-50 mt-2 font-medium">Track and manage your past purchases.</p>
                    </div>

                    <div className="space-y-6">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-48 glass rounded-[2.5rem] animate-pulse" />)
                        ) : orders.length > 0 ? (
                            orders.map((order: any) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="glass p-8 rounded-[2.5rem] border-white/5 space-y-6 hover:translate-x-2 transition-transform cursor-pointer group shadow-xl"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                                <Package className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-black">Order #{order.order_number}</p>
                                                <p className="text-xs opacity-50 font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black tracking-tight">Rs. {order.total_amount.toLocaleString()}</p>
                                            <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-full">{order.status}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 pt-4 border-t border-white/10">
                                        <div className="flex items-center gap-2 opacity-50">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Estimated Delivery: 3 Days</span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-50">
                                            <MapPin className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider truncate max-w-[200px]">{order.shipping_address}</span>
                                        </div>
                                    </div>

                                    <div onClick={() => setSelectedOrder(order)} className="flex items-center justify-end text-primary group-hover:gap-2 transition-all">
                                        <span className="text-xs font-black uppercase tracking-widest">View Receipt</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-24 text-center glass rounded-[2.5rem] opacity-30 italic">
                                <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p className="text-2xl font-black">No orders found yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
