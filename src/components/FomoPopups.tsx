import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Notification {
    id: string;
    message: string;
    productName: string;
    time: string;
}

export const FomoPopups = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        // Subscribe to new orders for real-time FOMO
        const subscription = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async (payload) => {
                const { data: product } = await supabase
                    .from('products')
                    .select('name')
                    .eq('id', payload.new.items?.[0]?.product_id) // This assumes order_items or similar
                    .single();

                const newNotif = {
                    id: Math.random().toString(36).substr(2, 9),
                    message: 'Someone just purchased',
                    productName: product?.name || 'a premium item',
                    time: 'Just now'
                };

                setNotifications(prev => [...prev.slice(-2), newNotif]);

                // Auto-remove after 5s
                setTimeout(() => {
                    setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
                }, 5000);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    return (
        <div className="fixed bottom-8 left-8 z-[60] flex flex-col gap-4 pointer-events-none">
            <AnimatePresence>
                {notifications.map((notif) => (
                    <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -100, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                        className="glass p-4 rounded-2xl flex items-center gap-4 shadow-2xl border-white/10 pointer-events-auto min-w-[300px]"
                    >
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div className="flex-grow">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{notif.message}</p>
                            <p className="text-sm font-black truncate max-w-[180px]">{notif.productName}</p>
                            <p className="text-[9px] font-bold text-primary">{notif.time}</p>
                        </div>
                        <button
                            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                            className="p-1 hover:bg-foreground/5 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 opacity-30" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
