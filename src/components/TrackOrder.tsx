import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Truck, CheckCircle, Clock, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const TrackOrder = ({ onClose }: { onClose: () => void }) => {
    const [orderId, setOrderId] = useState('');
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setStatus(null);

        try {
            // Ensure ID is alphanumeric (for new format)
            const id = orderId.trim().toUpperCase();
            if (!id) throw new Error("Invalid Order ID");

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('order_number', id)
                .single();

            if (error) throw error;
            setStatus(data);
        } catch (err: any) {
            setError('Order not found. Please check your ID.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStep = (currentStatus: string) => {
        const steps = ['pending', 'processing', 'shipped', 'delivered'];
        return steps.indexOf(currentStatus.toLowerCase());
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl bg-background border border-white/10 rounded-[3rem] p-10 shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-foreground/5 bg-foreground/5">
                    <X className="w-6 h-6" />
                </button>

                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black italic tracking-tighter mb-4">TRACK YOUR ORDER</h2>
                    <p className="opacity-60">Enter your Order ID (e.g., AB123456) to see live status.</p>
                </div>

                <form onSubmit={handleTrack} className="flex gap-4 mb-12">
                    <div className="flex-grow relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 opacity-30" />
                        <input
                            type="text"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            placeholder="Enter Order ID..."
                            className="w-full bg-foreground/5 border-none rounded-2xl py-5 pl-14 pr-6 text-lg font-bold outline-none focus:ring-2 ring-primary/50"
                        />
                    </div>
                    <button disabled={loading} className="px-8 bg-primary text-white rounded-2xl font-black tracking-widest hover:scale-105 transition-transform disabled:opacity-50">
                        {loading ? 'TRACKING...' : 'TRACK'}
                    </button>
                </form>

                {error && (
                    <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-center font-bold mb-8">
                        {error}
                    </div>
                )}

                {status && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center pb-8 border-b border-white/5">
                            <div>
                                <h3 className="text-sm font-black opacity-40 uppercase tracking-widest mb-1">Order ID</h3>
                                <p className="text-2xl font-black text-primary">#{status.order_number}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-sm font-black opacity-40 uppercase tracking-widest mb-1">Total</h3>
                                <p className="text-2xl font-black">Rs. {status.total_amount.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Tracker Steps */}
                        <div className="relative flex justify-between">
                            {/* Connecting Line */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-foreground/5 -z-10 -translate-y-1/2" />
                            <div
                                className="absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 transition-all duration-1000"
                                style={{ width: `${(getStatusStep(status.status) / 3) * 100}%` }}
                            />

                            {[
                                { label: 'Pending', icon: Clock },
                                { label: 'Processing', icon: Package },
                                { label: 'Shipped', icon: Truck },
                                { label: 'Delivered', icon: CheckCircle }
                            ].map((step, index) => {
                                const isActive = index <= getStatusStep(status.status);
                                const isCurrent = index === getStatusStep(status.status);
                                const Icon = step.icon;

                                return (
                                    <div key={step.label} className="flex flex-col items-center gap-4 bg-background px-2">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-foreground/10 opacity-30'} ${isCurrent ? 'animate-pulse ring-4 ring-primary/20' : ''}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-30'}`}>{step.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
