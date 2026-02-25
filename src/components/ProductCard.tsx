import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
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
    compare_at_price?: number;
    onFly?: (e: React.MouseEvent) => void;
}

export const ProductCard = (product: ProductCardProps) => {
    const { name, price, image, category, stock = 1, sku, image_urls = [], compare_at_price, onFly } = product;
    const addItem = useCartStore((state) => state.addItem);
    const [mainImageError, setMainImageError] = useState(false);
    const [secondaryImageError, setSecondaryImageError] = useState(false);

    const isOOS = stock === 0;

    const discount = compare_at_price && compare_at_price > price
        ? Math.round(((compare_at_price - price) / compare_at_price) * 100)
        : 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOOS) return;
        addItem(product);
        onFly?.(e);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            onClick={() => { window.location.hash = generateProductURL(name, sku); }}
            className={`group relative bg-white rounded-2xl md:rounded-[2rem] overflow-hidden border border-gray-100 flex flex-col h-full cursor-pointer hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] transition-all duration-500 ${isOOS ? 'opacity-90' : ''}`}
        >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gray-50 group">
                {image && (
                    <img
                        src={mainImageError ? PLACEHOLDER_IMAGE : image}
                        alt={name}
                        onError={() => setMainImageError(true)}
                        className={`w-full h-full object-cover transition-all duration-1000 scale-100 group-hover:scale-110 ${(image_urls?.length ?? 0) > 1 ? 'group-hover:opacity-0' : ''}`}
                    />
                )}

                {/* Secondary Image on Hover */}
                {(image_urls?.length ?? 0) > 1 && (
                    <img
                        src={secondaryImageError ? PLACEHOLDER_IMAGE : image_urls![1]}
                        alt={name}
                        onError={() => setSecondaryImageError(true)}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-1000 scale-110 group-hover:scale-100"
                    />
                )}

                {/* Badges Container */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
                    {/* OOS Overlay */}
                    {isOOS && (
                        <span className="px-3 py-1 bg-black text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full backdrop-blur-md">
                            Sold Out
                        </span>
                    )}
                    {/* Discount Badge */}
                    {discount > 0 && !isOOS && (
                        <span className="px-3 py-1 bg-primary text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                            {discount}% OFF
                        </span>
                    )}
                </div>

                {/* Quick Add Overlay */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>

            {/* Info Section */}
            <div className="p-2.5 md:p-3.5 flex flex-col flex-grow">
                <div className="flex flex-col gap-0.5 mb-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">{category}</p>
                    <h3 className="text-xs md:text-sm font-black text-gray-800 line-clamp-2 leading-tight uppercase italic group-hover:text-primary transition-colors">
                        {name}
                    </h3>
                </div>

                <div className="mt-auto pt-2 border-t border-gray-50 flex items-end justify-between">
                    {/* Price Section */}
                    <div className="flex flex-col">
                        {compare_at_price && compare_at_price > price && (
                            <span className="text-[10px] text-gray-400 line-through font-bold">
                                Rs. {compare_at_price.toLocaleString()}
                            </span>
                        )}
                        <span className="text-base md:text-lg font-black italic tracking-tighter text-black leading-none">
                            Rs. {price.toLocaleString()}
                        </span>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={isOOS}
                        className={`p-2 md:p-2.5 rounded-xl transition-all active:scale-90 ${isOOS ? 'bg-gray-100 text-gray-300' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-110'}`}
                    >
                        <ShoppingCart className="w-4 h-4 shadow-sm" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
