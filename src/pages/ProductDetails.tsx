import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useProducts } from '../hooks/useProducts';
import { useCartStore } from '../stores/useCartStore';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { ShoppingBag, ArrowLeft, Star, Heart, Share2, ShieldCheck, Truck, RefreshCcw, Send, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { SEO } from '../components/SEO';

interface Review {
    id: number;
    rating: number;
    comment: string;
    created_at: string;
    user_id: string;
    profiles?: { full_name: string };
}

export const ProductDetails = ({ productId, onBack, onFly }: { productId: number; onBack: () => void; onFly: (e: any) => void }) => {
    const { products } = useProducts();
    const { user } = useAuthStore();
    const addItem = useCartStore((state) => state.addItem);
    const product = products.find(p => p.id === productId);

    const [reviews, setReviews] = useState<Review[]>([]);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(true);

    const fetchReviews = useCallback(async () => {
        setLoadingReviews(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    user:user_id (
                        full_name
                    )
                `)
                .eq('product_id', productId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            // Map the user data to profiles for backward compatibility
            const reviewsWithProfiles = data?.map(review => ({
                ...review,
                profiles: review.user
            })) || [];
            setReviews(reviewsWithProfiles);
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setLoadingReviews(false);
        }
    }, [productId]);

    useEffect(() => {
        if (productId) {
            fetchReviews();
        }
    }, [productId, fetchReviews]);

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert('Please login to leave a review.');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('reviews')
                .upsert({
                    product_id: productId,
                    user_id: user.id,
                    rating: newRating,
                    comment: newComment
                }, { onConflict: 'product_id, user_id' });

            if (error) throw error;
            setNewComment('');
            fetchReviews();
            alert('Review submitted successfully!');
        } catch (err) {
            alert('Error: ' + (err as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    const [activeImage, setActiveImage] = useState(product?.image_url || '');

    useEffect(() => {
        if (product) setActiveImage(product.image_url);
    }, [product]);

    if (!product) return null;

    const images = product.image_urls && product.image_urls.length > 0
        ? product.image_urls
        : [product.image_url];

    const handleNextImage = () => {
        const currentIndex = images.indexOf(activeImage);
        const nextIndex = (currentIndex + 1) % images.length;
        setActiveImage(images[nextIndex]);
    };

    const handlePrevImage = () => {
        const currentIndex = images.indexOf(activeImage);
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        setActiveImage(images[prevIndex]);
    };

    const avgRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    return (
        <div className="min-h-screen bg-background pt-24 pb-24 px-4 sm:px-6">
            <SEO
                title={product.name}
                description={product.description?.substring(0, 160) || `Buy ${product.name} at Tarzify.`}
                image={product.image_url}
                type="product"
            />
            <div className="max-w-7xl mx-auto">
                <button onClick={onBack} className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity mb-6 sm:mb-8 font-black uppercase tracking-widest text-[10px] sm:text-xs">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Store
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-16 sm:mb-24">
                    {/* Image Section */}
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="aspect-[4/5] glass rounded-[2rem] sm:rounded-[3rem] overflow-hidden relative group shadow-2xl"
                        >
                            {activeImage && <img src={activeImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}

                            {/* Navigation Arrows */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 glass rounded-full hover:scale-110 transition-transform z-10 opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 glass rounded-full hover:scale-110 transition-transform z-10 opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </>
                            )}

                            <button className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 sm:p-4 glass rounded-full hover:scale-110 transition-transform z-20">
                                <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </motion.div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={`w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${activeImage === img ? 'border-primary scale-95' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                    >
                                        {img && <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">{product.category}</span>
                                <div className="flex items-center gap-1 text-yellow-500">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="text-xs font-black text-foreground">{avgRating} ({reviews.length} Reviews)</span>
                                </div>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">{product.name}</h1>
                            <p className="text-3xl font-black text-primary">Rs. {product.price.toLocaleString()}</p>
                        </div>

                        <p className="text-lg opacity-60 leading-relaxed font-medium">
                            {product.description || `Experience the pinnacle of premium design and performance. This ${product.category.toLowerCase()} is meticulously crafted to meet the highest standards of quality and durability.`}
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
                            {[
                                { icon: Truck, label: 'Free Delivery' },
                                { icon: ShieldCheck, label: 'Secure Payment' },
                                { icon: RefreshCcw, label: 'Easy Returns' }
                            ].map(({ icon: Icon, label }) => (
                                <div key={label} className="flex flex-col items-center text-center gap-2 p-4 glass rounded-3xl">
                                    <Icon className="w-5 h-5 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-4 space-y-8">
                        <div className="glass p-8 rounded-[2.5rem] space-y-6">
                            <h3 className="text-2xl font-black tracking-tighter uppercase italic">Customer Rating</h3>
                            <div className="flex items-center gap-4">
                                <span className="text-6xl font-black text-primary">{avgRating}</span>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1 text-yellow-500 mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(avgRating)) ? 'fill-current' : ''}`} />
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold opacity-40">Based on {reviews.length} reviews</span>
                                </div>
                            </div>
                        </div>

                        {user && (
                            <form onSubmit={handleSubmitReview} className="glass p-8 rounded-[2.5rem] space-y-6">
                                <h3 className="text-xl font-black tracking-tighter uppercase italic">Share your experience</h3>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setNewRating(star)}
                                                className={`p-2 transition-transform hover:scale-125 ${newRating >= star ? 'text-yellow-500' : 'text-foreground/10'}`}
                                            >
                                                <Star className={`w-6 h-6 ${newRating >= star ? 'fill-current' : ''}`} />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        placeholder="What did you think of this product?"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="w-full bg-foreground/5 border-none rounded-2xl p-4 min-h-[120px] focus:ring-2 ring-primary/30 outline-none text-sm transition-all"
                                    />
                                    <button
                                        disabled={submitting}
                                        className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Review</>}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex items-center gap-3 mb-8">
                            <MessageCircle className="w-6 h-6 text-primary" />
                            <h3 className="text-2xl font-black tracking-tighter uppercase italic">Recent Reviews</h3>
                        </div>

                        {loadingReviews ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="glass p-12 text-center rounded-[2.5rem] opacity-30 italic font-medium">
                                No reviews yet. Be the first to share your experience!
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {reviews.map((review) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        key={review.id}
                                        className="glass p-8 rounded-[2.5rem] border-white/5 space-y-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-black text-primary text-xs">
                                                    {review.profiles?.full_name[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm">{review.profiles?.full_name || 'Anonymous'}</p>
                                                    <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-foreground/10'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-sm leading-relaxed opacity-70 font-medium italic">"{review.comment}"</p>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Loader2 = ({ className }: { className?: string }) => (
    <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={className}
    >
        <RefreshCcw className="w-full h-full" />
    </motion.div>
);
