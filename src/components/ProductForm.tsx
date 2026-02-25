import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Save, Upload, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { slugify } from '../lib/slugify';
import { useToastStore } from '../stores/useToastStore';
import { useCategories } from '../hooks/useCategories';

interface ProductFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const ProductForm = ({ onClose, onSuccess }: ProductFormProps) => {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { user } = useAuthStore();
    const { categories } = useCategories();
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        compare_at_price: '',
        category: '',
        stock: '',
        is_returnable: true
    });

    const widgetRef = useRef<any>(null);

    useEffect(() => {
        const initWidget = () => {
            if (!(window as any).cloudinary) return;

            widgetRef.current = (window as any).cloudinary.createUploadWidget(
                {
                    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
                    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
                    sources: ['local', 'url', 'camera', 'facebook', 'instagram', 'google_drive', 'dropbox', 'image_search'],
                    multiple: true,
                    maxFiles: 5,
                    clientAllowedFormats: ["jpg", "png", "webp", "jpeg"],
                    styles: {
                        palette: {
                            window: "#111111",
                            windowBorder: "#222222",
                            tabIcon: "#f85606",
                            menuIcons: "#f85606",
                            textDark: "#FFFFFF",
                            textLight: "#CCCCCC",
                            link: "#f85606",
                            action: "#f85606",
                            inactiveTabIcon: "#666666",
                            error: "#F44235",
                            inProgress: "#f85606",
                            complete: "#20B832",
                            sourceBg: "#111111"
                        }
                    }
                },
                (error: any, result: any) => {
                    if (!error && result && result.event === "success") {
                        setImageUrls(prev => [...prev, result.info.secure_url]);
                        setUploading(false);
                    } else if (result.event === "display-changed") {
                        if (result.info === 'hidden') setUploading(false);
                    }
                }
            );
        };

        if ((window as any).cloudinary) {
            initWidget();
        } else {
            const script = document.createElement('script');
            script.src = "https://upload-widget.cloudinary.com/global/all.js";
            script.async = true;
            script.onload = initWidget;
            document.body.appendChild(script);
        }

        // Lock scroll on mount
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    const handleUpload = () => {
        if (widgetRef.current) {
            setUploading(true);
            widgetRef.current.open();
        } else {
            useToastStore.getState().show('Upload widget still loading...', 'error');
        }
    };

    const removeImage = (index: number) => {
        setImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (imageUrls.length === 0) {
                throw new Error('Please upload at least one product image');
            }

            if (!formData.sku.trim()) {
                throw new Error('SKU is required');
            }

            const { error } = await supabase
                .from('products')
                .insert({
                    merchant_id: user?.id,
                    name: formData.name,
                    sku: formData.sku.trim().toUpperCase(),
                    price: parseFloat(formData.price),
                    compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
                    category: formData.category,
                    stock: parseInt(formData.stock),
                    image_url: imageUrls[0], // First image as main image
                    image_urls: imageUrls,
                    is_returnable: formData.is_returnable
                });

            if (error) throw error;
            useToastStore.getState().show('Product added successfully!', 'success');
            onSuccess();
            onClose();
        } catch (err) {
            useToastStore.getState().show('Error: ' + (err as Error).message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                data-lenis-prevent
                className="bg-background rounded-[2.5rem] w-full max-w-xl overflow-hidden border border-white/10 shadow-3xl max-h-[90vh] flex flex-col"
            >
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-xl">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Add New Product</h2>
                        <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1 text-primary">Merchant Portal</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-all hover:scale-110 active:scale-90">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-8 flex-grow">
                    <div className="space-y-6">
                        {/* Images Section */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 px-1">Product Gallery</label>

                            <div className="grid grid-cols-4 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {imageUrls.map((url, index) => (
                                        <motion.div
                                            key={url}
                                            layout
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.5, opacity: 0 }}
                                            className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group"
                                        >
                                            <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            {index === 0 && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-[8px] font-black uppercase tracking-widest text-center py-1">
                                                    Main Image
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {imageUrls.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group"
                                    >
                                        <div className="p-2 bg-foreground/5 rounded-xl group-hover:bg-primary/20 transition-colors">
                                            <Upload className="w-5 h-5 text-foreground/40 group-hover:text-primary" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">Upload</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 px-1">Product Details</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 outline-none focus:border-primary/50 transition-colors font-bold mt-2"
                                    placeholder="Wireless Over-Ear Headphones"
                                />
                                {formData.name && (
                                    <p className="mt-2 text-[10px] font-black opacity-30 uppercase tracking-widest px-2">
                                        URL Slug: <span className="text-primary/60">{slugify(formData.name)}</span>
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 px-1">SKU ID</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.sku}
                                        onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 outline-none focus:border-primary/50 transition-colors font-black mt-2"
                                        placeholder="TRZ-001"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 px-1">Category</label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 outline-none focus:border-primary/50 transition-colors font-bold mt-2 appearance-none"
                                    >
                                        <option value="">Choose...</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 px-1">Price</label>
                                    <div className="relative mt-2">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black opacity-30">Rs</span>
                                        <input
                                            required
                                            type="number"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 pl-10 outline-none focus:border-primary/50 transition-colors font-bold"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 px-1">MSRP</label>
                                    <div className="relative mt-2">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black opacity-30">Rs</span>
                                        <input
                                            type="number"
                                            value={formData.compare_at_price}
                                            onChange={e => setFormData({ ...formData, compare_at_price: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 pl-10 outline-none focus:border-primary/50 transition-colors font-bold"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 px-1">Inventory</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 outline-none focus:border-primary/50 transition-colors font-bold mt-2"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                                <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${formData.is_returnable ? 'bg-primary' : 'bg-white/10'}`}
                                    onClick={() => setFormData(prev => ({ ...prev, is_returnable: !prev.is_returnable }))}>
                                    <motion.div
                                        animate={{ x: formData.is_returnable ? 26 : 4 }}
                                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                    />
                                </div>
                                <div className="flex-grow">
                                    <p className="text-xs font-black">7-Day Return Policy</p>
                                    <p className="text-[10px] opacity-40 font-bold uppercase tracking-wider">Accepting returns for this item</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                            <span className="uppercase tracking-widest text-sm">Save Product Listing</span>
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};
