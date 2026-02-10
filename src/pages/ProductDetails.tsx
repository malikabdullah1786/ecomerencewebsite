import { motion } from 'framer-motion';
import { useProducts } from '../hooks/useProducts';
import { useCartStore } from '../stores/useCartStore';
import { ShoppingBag, ArrowLeft, Star, Heart, Share2, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';

export const ProductDetails = ({ productId, onBack, onFly }: { productId: number; onBack: () => void; onFly: (e: any) => void }) => {
    const { products } = useProducts();
    const addItem = useCartStore((state) => state.addItem);
    const product = products.find(p => p.id === productId);

    if (!product) return null;

    return (
        <div className="min-h-screen bg-background pt-32 pb-24 px-6">
            <div className="max-w-7xl mx-auto">
                <button onClick={onBack} className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity mb-8 font-black uppercase tracking-widest text-xs">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Store
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Image Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="aspect-[4/5] glass rounded-[3rem] overflow-hidden relative group"
                    >
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <button className="absolute top-6 right-6 p-4 glass rounded-full hover:scale-110 transition-transform">
                            <Heart className="w-6 h-6" />
                        </button>
                    </motion.div>

                    {/* Info Section */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">{product.category}</span>
                                <div className="flex items-center gap-1 text-yellow-500">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="text-xs font-black text-foreground">4.9 (124 Reviews)</span>
                                </div>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">{product.name}</h1>
                            <p className="text-3xl font-black text-primary">Rs. {product.price.toLocaleString()}</p>
                        </div>

                        <p className="text-lg opacity-60 leading-relaxed font-medium">
                            Experience the pinnacle of premium design and performance. This {product.category.toLowerCase()} is meticulously crafted to meet the highest standards of quality and durability.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="flex-grow flex items-center bg-foreground/5 rounded-2xl p-2">
                                    <span className="px-6 py-2 text-xs font-black uppercase opacity-30">Quantity</span>
                                    <div className="flex-grow text-center font-black">1</div>
                                </div>
                                <button className="p-5 glass rounded-2xl hover:scale-105 transition-transform">
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                <RefreshCcw className="w-5 h-5 text-primary" />
                                <div>
                                    <h4 className="font-bold text-sm">7-Day Return Policy</h4>
                                    <p className="text-xs opacity-60">
                                        {product.category === 'Beauty' || product.category === 'Makeup'
                                            ? 'Non-returnable if seal is broken.'
                                            : 'Change of mind returns accepted within 7 days.'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    addItem(product);
                                    onFly(e);
                                }}
                                className="w-full py-6 bg-primary text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <ShoppingBag className="w-6 h-6" />
                                Add to Cart
                            </button>
                        </div>

                        {/* Perks */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-white/10">
                            <div className="flex flex-col items-center text-center gap-2 p-4 glass rounded-3xl">
                                <Truck className="w-5 h-5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Free Delivery</span>
                            </div>
                            <div className="flex flex-col items-center text-center gap-2 p-4 glass rounded-3xl">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Secure Payment</span>
                            </div>
                            <div className="flex flex-col items-center text-center gap-2 p-4 glass rounded-3xl">
                                <RefreshCcw className="w-5 h-5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Easy Returns</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
