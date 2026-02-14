import { motion } from 'framer-motion';
import { ShoppingCart, Star } from 'lucide-react';
import { useCartStore } from '../stores/useCartStore';

interface ProductCardProps {
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
    description?: string;
    rating?: number;
    onFly?: (e: React.MouseEvent) => void;
}

export const ProductCard = (product: ProductCardProps) => {
    const { id, name, price, image, category, rating = 4.5, onFly } = product;
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
            onClick={() => window.location.hash = `#product/${id}`}
            className="group relative glass rounded-3xl overflow-hidden border-white/10 flex flex-col h-full cursor-pointer"
        >
            {/* Image Container (The "Box") */}
            <div className="relative aspect-[4/5] overflow-hidden bg-foreground/5 group">
                {image && (
                    <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                )}

                {/* Animated Widget Overlay */}
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

                {/* Bottom Overlay Actions (Always Visible or Integrated) */}
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
                                className="p-2 sm:p-4 bg-primary text-white rounded-xl sm:rounded-2xl hover:scale-110 hover:shadow-xl hover:shadow-primary/40 transition-all active:scale-95 shadow-2xl relative z-20"
                                title="Add to Cart"
                            >
                                <ShoppingCart className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category Badge */}
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
                    <span className="px-2 py-0.5 sm:px-4 sm:py-1.5 glass text-[7px] sm:text-[10px] font-black uppercase tracking-widest text-white rounded-full shadow-lg">
                        {category}
                    </span>
                </div>
            </div>

            {/* Title & Rating Section */}
            <div className="p-2 sm:p-6 text-left">
                <div className="flex items-center gap-0.5 sm:gap-1 mb-1 sm:mb-2 text-left">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={`w-2 h-2 sm:w-3.5 sm:h-3.5 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-foreground/10'}`}
                        />
                    ))}
                    <span className="text-[8px] sm:text-[10px] font-bold opacity-40 ml-0.5">({rating})</span>
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
