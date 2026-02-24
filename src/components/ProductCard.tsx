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
    compare_at_price?: number;
    onFly?: (e: React.MouseEvent) => void;
}

export const ProductCard = (product: ProductCardProps) => {
    const { id: _id, name, price, image, rating = 0, stock = 1, sku, image_urls = [], compare_at_price, onFly } = product;
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
            className={`group relative bg-white rounded-xl overflow-hidden border border-gray-100 flex flex-col h-full cursor-pointer hover:shadow-xl transition-all duration-300 ${isOOS ? 'opacity-90' : ''}`}
        >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gray-50 group">
                {image && (
                    <img
                        src={mainImageError ? PLACEHOLDER_IMAGE : image}
                        alt={name}
                        onError={() => setMainImageError(true)}
                        className={`w-full h-full object-cover transition-all duration-700 ${(image_urls?.length ?? 0) > 1 ? 'group-hover:opacity-0' : ''}`}
                    />
                )}

                {/* Secondary Image on Hover */}
                {(image_urls?.length ?? 0) > 1 && (
                    <img
                        src={secondaryImageError ? PLACEHOLDER_IMAGE : image_urls![1]}
                        alt={name}
                        onError={() => setSecondaryImageError(true)}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-700"
                    />
                )}

                {/* OOS Overlay */}
                {isOOS && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-20">
                        <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-sm">
                            Out of Stock
                        </span>
                    </div>
                )}

                {/* Discount Badge */}
                {discount > 0 && !isOOS && (
                    <div className="absolute top-2 right-2 z-10 bg-[#f85606] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm">
                        -{discount}%
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="p-3 flex flex-col flex-grow">
                <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-2 group-hover:text-[#f85606] transition-colors">
                    {name}
                </h3>

                <div className="mt-auto space-y-1">
                    {/* Price Section */}
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-[#f85606] leading-none">
                            Rs. {price.toLocaleString()}
                        </span>
                        {compare_at_price && compare_at_price > price && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-400 line-through">
                                    Rs. {compare_at_price.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-gray-800 font-medium">
                                    -{discount}%
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Rating & Actions */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                        <div className="flex items-center gap-1">
                            <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-2.5 h-2.5 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                    />
                                ))}
                            </div>
                            <span className="text-[10px] text-gray-400">({rating > 0 ? rating.toFixed(1) : '0'})</span>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={isOOS}
                            className={`p-1.5 rounded-lg transition-all active:scale-90 ${isOOS ? 'bg-gray-100 text-gray-300' : 'bg-orange-50 text-[#f85606] hover:bg-orange-100'}`}
                        >
                            <ShoppingCart className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
