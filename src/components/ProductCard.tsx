import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Star } from 'lucide-react';
import { useCartStore } from '../stores/useCartStore';

interface ProductCardProps {
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
    rating?: number;
    onFly?: (e: React.MouseEvent) => void;
}

export const ProductCard = (product: ProductCardProps) => {
    const { name, price, image, category, rating = 4.5, onFly } = product;
    const addItem = useCartStore((state) => state.addItem);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        addItem(product);
        onFly?.(e);
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className="group relative glass rounded-3xl overflow-hidden border-white/10 flex flex-col h-full"
        >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-foreground/5">
                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                    <button
                        onClick={handleAddToCart}
                        className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"
                    >
                        <ShoppingCart className="w-5 h-5" />
                    </button>
                    <button className="p-3 glass text-white rounded-full hover:scale-110 transition-transform">
                        <Eye onClick={() => window.location.hash = `#product/${product.id}`} className="w-5 h-5" />
                    </button>
                </div>

                {/* Badge */}
                <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 glass text-[10px] font-black uppercase tracking-widest text-white rounded-full">
                        {category}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-foreground/20'}`}
                        />
                    ))}
                    <span className="text-[10px] opacity-50 ml-1">({rating})</span>
                </div>

                <h3 className="font-bold text-lg mb-1 line-clamp-1">{name}</h3>
                <p className="text-sm opacity-60 mb-4 line-clamp-2 leading-relaxed">
                    Premium quality product with localized delivery.
                </p>

                <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold opacity-30 leading-none mb-1">Price</span>
                        <span className="text-2xl font-black text-primary tracking-tighter">
                            Rs. {price.toLocaleString()}
                        </span>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        className="p-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                        <ShoppingCart className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
