import { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';

interface ProductFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const ProductForm = ({ onClose, onSuccess }: ProductFormProps) => {
    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore();
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        category: '',
        stock: '',
        image_url: '',
        is_returnable: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from('products')
                .insert({
                    merchant_id: user?.id,
                    name: formData.name,
                    sku: formData.sku || `SKU-${Date.now()}`,
                    price: parseFloat(formData.price),
                    category: formData.category,
                    stock: parseInt(formData.stock),
                    image_url: formData.image_url,
                    is_returnable: formData.is_returnable
                });

            if (error) throw error;
            onSuccess();
            onClose();
        } catch (err) {
            alert('Error adding product: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-background rounded-3xl w-full max-w-lg overflow-hidden border border-white/10 shadow-2xl"
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-foreground/5">
                    <h2 className="text-xl font-black">Add New Product</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest opacity-50 block mb-2">Product Name</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-foreground/5 border-none rounded-xl p-4 outline-none focus:ring-2 ring-primary/30"
                                placeholder="e.g. Wireless Headphones"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest opacity-50 block mb-2">SKU (Optional)</label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                className="w-full bg-foreground/5 border-none rounded-xl p-4 outline-none focus:ring-2 ring-primary/30"
                                placeholder="Auto-generated if empty"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest opacity-50 block mb-2">Price (Rs)</label>
                                <input
                                    required
                                    type="number"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full bg-foreground/5 border-none rounded-xl p-4 outline-none focus:ring-2 ring-primary/30"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest opacity-50 block mb-2">Stock</label>
                                <input
                                    required
                                    type="number"
                                    value={formData.stock}
                                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                    className="w-full bg-foreground/5 border-none rounded-xl p-4 outline-none focus:ring-2 ring-primary/30"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest opacity-50 block mb-2">Category</label>
                            <input
                                required
                                type="text"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-foreground/5 border-none rounded-xl p-4 outline-none focus:ring-2 ring-primary/30"
                                placeholder="e.g. Electronics"
                            />
                        </div>
                        <div className="flex items-center gap-3 bg-foreground/5 p-4 rounded-xl">
                            <input
                                type="checkbox"
                                id="is_returnable"
                                checked={formData.is_returnable}
                                onChange={e => setFormData({ ...formData, is_returnable: e.target.checked })}
                                className="w-5 h-5 accent-primary rounded cursor-pointer"
                            />
                            <label htmlFor="is_returnable" className="font-bold cursor-pointer select-none">
                                Accept Returns (7-Day Policy)
                            </label>
                        </div>
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest opacity-50 block mb-2">Image URL</label>
                            <input
                                required
                                type="url"
                                value={formData.image_url}
                                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                className="w-full bg-foreground/5 border-none rounded-xl p-4 outline-none focus:ring-2 ring-primary/30"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Product
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};
