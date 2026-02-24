import { motion } from 'framer-motion';
import { ShoppingCart, Star } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '../stores/useCartStore';
import { generateProductURL } from '../lib/slugify';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=800&auto=format&fit=crop';

interface ProductCardProps {
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
    description?: string;
    rating?: number;
    stock?: number;
    sku: string;
    image_urls?: string[];
    onFly?: (e: React.MouseEvent) => void;
}

export const ProductCard = (product: ProductCardProps) => {
    const { id: _id, name, price, image, category, rating = 0, stock = 1, sku, image_urls = [], onFly } = product;
    const addItem = useCartStore((state) => state.addItem);
    const [mainImageError, setMainImageError] = useState(false);
    const [secondaryImageError, setSecondaryImageError] = useState(false);

    const isOOS = stock === 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOOS) return;
        addItem(product);
        onFly?.(e);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            onClick={() => { window.location.hash = generateProductURL(name, sku); }}
            className={`group relative glass rounded-3xl overflow-hidden border-white/10 flex flex-col h-full cursor-pointer ${isOOS ? 'opacity-90' : ''}`}
        >
            {/* Image Container */}
            <div className="relative aspect-[4/5] overflow-hidden bg-foreground/5 group">
                {image && (
                    <img
                        src={mainImageError ? PLACEHOLDER_IMAGE : image}
                        alt={name}
                        onError={() => setMainImageError(true)}
                        className={`w-full h-full object-cover transition-all duration-700 ${image_urls.length > 1 ? 'group-hover:opacity-0 group-hover:scale-110' : 'group-hover:scale-110'}`}
                    />
                )}

                {/* Secondary Image on Hover */}
                {image_urls.length > 1 && (
                    <img
                        src={secondaryImageError ? PLACEHOLDER_IMAGE : image_urls[1]}
                        alt={name}
                        onError={() => setSecondaryImageError(true)}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-110"
                    />
                )}

                {/* OOS Overlay */}
                {isOOS && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-20">
                        <span className="px-6 py-2 bg-red-500/90 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg border border-red-400/30">
                            Out of Stock
                        </span>
                    </div>
                )}

                {/* Animated Widget Overlay (only when in stock) */}
                {!isOOS && (
                    <div className="absolute inset-0 bg-primary/95 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, -10, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center border border-white/20 mb-6"
                        >
                            <Star className="w-10 h-10 text-white fill-white shadow-2xl shadow-white/50" />
                        </motion.div>

                        <div className="space-y-1">
                            <h4 className="text-white font-black italic tracking-tighter text-2xl uppercase">View Details</h4>
                            <div className="w-12 h-1 bg-white/40 mx-auto rounded-full" />
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mt-4">Discover Tarzify Quality</p>
                        </div>
                    </div>
                )}

                {/* Bottom Overlay Actions */}
                <div className="absolute inset-x-0 bottom-0 p-2 sm:p-6 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-1 sm:gap-4">
                        <div className="flex flex-col text-left">
                            <span className="text-[8px] sm:text-[10px] uppercase font-black text-white/50 tracking-widest mb-0.5 hidden sm:block">Price</span>
                            <span className="text-sm sm:text-3xl font-black text-white tracking-tighter italic leading-none">
                                Rs. {price.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={handleAddToCart}
                                disabled={isOOS}
                                className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl hover:scale-110 hover:shadow-xl transition-all active:scale-95 shadow-2xl relative z-20 ${isOOS ? 'bg-foreground/20 text-foreground/30 cursor-not-allowed' : 'bg-primary text-white hover:shadow-primary/40'}`}
                                title={isOOS ? 'Out of Stock' : 'Add to Cart'}
                            >
                                <ShoppingCart className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category & Stock Badges */}
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-1.5 z-10">
                    <span className="px-2 py-0.5 sm:px-4 sm:py-1.5 glass text-[7px] sm:text-[10px] font-black uppercase tracking-widest text-white rounded-full shadow-lg">
                        {category}
                    </span>
                    {stock > 0 && stock <= 10 && (
                        <span className={`px-2 py-0.5 sm:px-3 sm:py-1 text-white text-[7px] sm:text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg border border-white/20 backdrop-blur-md ${stock <= 3 ? 'bg-red-500/90' : 'bg-amber-500/90'}`}>
                            Only {stock} Left{stock <= 3 ? '!' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* Title & Rating Section */}
            <div className="p-2 sm:p-6 text-left">
                <div className="flex items-center gap-0.5 sm:gap-1 mb-1 sm:mb-2 text-left">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={`w-2 h-2 sm:w-3.5 sm:h-3.5 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-foreground/10'}`}
                        />
                    ))}
                    <span className="text-[8px] sm:text-[10px] font-bold opacity-40 ml-0.5">
                        {rating > 0 ? `(${rating.toFixed(1)})` : '(New)'}
                    </span>
                </div>

                <h3 className="text-[10px] sm:text-xl font-black tracking-tight line-clamp-1 group-hover:text-primary transition-colors italic uppercase leading-tight">
                    {name}
                </h3>

                <p className="hidden sm:block text-sm opacity-40 mt-1 line-clamp-1 font-medium italic">
                    Premium and secure logistics by Tarzify.
                </p>
            </div>
        </motion.div>
    );
};
