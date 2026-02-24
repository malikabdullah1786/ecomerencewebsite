import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useProducts } from '../hooks/useProducts';
import { useCartStore } from '../stores/useCartStore';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { ShoppingBag, ArrowLeft, Star, Heart, Share2, ShieldCheck, Truck, RefreshCcw, Send, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { SEO } from '../components/SEO';
import { useToastStore } from '../stores/useToastStore';
import { generateProductURL } from '../lib/slugify';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=800&auto=format&fit=crop';

interface Review {
    id: number;
    rating: number;
    comment: string;
    created_at: string;
    user_id: string;
    profiles?: { full_name: string } | null;
}

export const ProductDetails = ({ productId, onBack, onFly }: { productId: number; onBack: () => void; onFly: (e: any) => void }) => {
    const { products, loading: productsLoading } = useProducts();
    const { user } = useAuthStore();
    const addItem = useCartStore((state) => state.addItem);
    const product = products.find(p => String(p.id) === String(productId));

    const [reviews, setReviews] = useState<Review[]>([]);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(true);

    const fetchReviews = useCallback(async () => {
        if (!productId) return;
        setLoadingReviews(true);
        try {
            // Step 1: Fetch reviews only
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('reviews')
                .select('*')
                .eq('product_id', productId)
                .order('created_at', { ascending: false });

            if (reviewsError) throw reviewsError;

            // Show reviews immediately (even without names) to break the "loading" hang
            setReviews(reviewsData || []);
            setLoadingReviews(false);

            if (!reviewsData || reviewsData.length === 0) return;

            // Step 2: Fetch profiles for these users in background
            const userIds = Array.from(new Set(reviewsData.map(r => r.user_id)));
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', userIds);

            if (profilesError) {
                console.warn('Error fetching profiles:', profilesError);
                return;
            }

            // Step 3: Mix in the names
            const profileMap = (profilesData || []).reduce((acc: any, p) => {
                acc[p.id] = p.full_name;
                return acc;
            }, {});

            setReviews(prev => prev.map(r => ({
                ...r,
                profiles: profileMap[r.user_id] ? { full_name: profileMap[r.user_id] } : null
            })));
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setReviews([]); // Clear on error to stop spinner
        } finally {
            setLoadingReviews(false);
        }
    }, [productId]);

    useEffect(() => {
        if (productId) {
            fetchReviews();
        }
    }, [productId, fetchReviews]);

    // --- JSON-LD Structured Data for Google Search ---
    useEffect(() => {
        if (!product) return;

        const avgRatingNum = reviews.length > 0
            ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
            : null;

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description || `Shop ${product.name} at Tarzify.`,
            image: product.image_urls?.length ? product.image_urls : [product.image_url],
            sku: product.sku,
            brand: { '@type': 'Brand', name: 'Tarzify' },
            ...(avgRatingNum !== null && {
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: avgRatingNum.toFixed(1),
                    reviewCount: reviews.length,
                    bestRating: 5,
                    worstRating: 1
                }
            }),
            ...(reviews.length > 0 && {
                review: reviews.slice(0, 5).map(r => ({
                    '@type': 'Review',
                    reviewRating: {
                        '@type': 'Rating',
                        ratingValue: r.rating,
                        bestRating: 5,
                        worstRating: 1
                    },
                    author: {
                        '@type': 'Person',
                        name: r.profiles?.full_name || 'Verified Buyer'
                    },
                    reviewBody: r.comment || '',
                    datePublished: r.created_at.split('T')[0]
                }))
            }),
            offers: {
                '@type': 'Offer',
                url: `https://tarzify.com/${generateProductURL(product.name, product.sku)}`,
                priceCurrency: 'PKR',
                price: product.price,
                availability: product.stock > 0
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                seller: { '@type': 'Organization', name: 'Tarzify' },
                shippingDetails: {
                    '@type': 'OfferShippingDetails',
                    shippingRate: {
                        '@type': 'MonetaryAmount',
                        value: '200',
                        currency: 'PKR'
                    },
                    shippingDestination: {
                        '@type': 'DefinedRegion',
                        addressCountry: 'PK'
                    },
                    deliveryTime: {
                        '@type': 'ShippingDeliveryTime',
                        handlingTime: {
                            '@type': 'QuantitativeValue',
                            minValue: 1,
                            maxValue: 2,
                            unitCode: 'DAY'
                        },
                        transitTime: {
                            '@type': 'QuantitativeValue',
                            minValue: 2,
                            maxValue: 5,
                            unitCode: 'DAY'
                        }
                    }
                },
                hasMerchantReturnPolicy: {
                    '@type': 'MerchantReturnPolicy',
                    applicableCountry: 'PK',
                    returnPolicyCategory: product.is_returnable
                        ? 'https://schema.org/MerchantReturnFiniteReturnWindow'
                        : 'https://schema.org/MerchantReturnNotPermitted',
                    merchantReturnDays: product.is_returnable ? 7 : undefined,
                    returnMethod: product.is_returnable
                        ? 'https://schema.org/ReturnByMail'
                        : undefined,
                    returnFees: product.is_returnable
                        ? 'https://schema.org/FreeReturn'
                        : undefined
                }
            }
        };

        // Inject or replace the JSON-LD script tag
        const existing = document.getElementById('product-jsonld');
        if (existing) existing.remove();

        const script = document.createElement('script');
        script.id = 'product-jsonld';
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(jsonLd);
        document.head.appendChild(script);

        return () => {
            document.getElementById('product-jsonld')?.remove();
        };
    }, [product, reviews]);


    const toast = useToastStore();

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.show('Please login to leave a review.', 'info');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('reviews')
                .upsert({
                    product_id: Number(productId),
                    user_id: user.id,
                    rating: newRating,
                    comment: newComment,
                    created_at: new Date().toISOString()
                }, {
                    onConflict: 'product_id,user_id'
                });

            if (error) throw error;
            setNewComment('');
            fetchReviews();
            toast.show('Review submitted successfully!', 'success');
        } catch (err) {
            toast.show('Error: ' + (err as Error).message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const [activeImage, setActiveImage] = useState(product?.image_url || '');

    useEffect(() => {
        if (product) setActiveImage(product.image_url);
    }, [product]);

    const [zoomOrigin, setZoomOrigin] = useState({ x: 0, y: 0 });
    const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

    const handleImageError = (src: string) => {
        setBrokenImages(prev => new Set(prev).add(src));
    };

    const getImageUrl = (src: string) => {
        return src && brokenImages.has(src) ? PLACEHOLDER_IMAGE : src;
    };

    if (productsLoading && !product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="font-black uppercase tracking-tighter opacity-30 italic">Loading Product Details...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background p-6 text-center">
                <div className="w-24 h-24 bg-foreground/5 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-12 h-12 opacity-20" />
                </div>
                <h2 className="text-3xl font-black tracking-tighter uppercase italic">Product Not Found</h2>
                <p className="opacity-50 max-w-md">Sorry, we couldn't find the product you're looking for. It might have been removed or the link is incorrect.</p>
                <button onClick={onBack} className="flex items-center gap-2 glass px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Store
                </button>
            </div>
        );
    }

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

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomOrigin({ x, y });
    };

    return (
        <div className="min-h-screen bg-background pt-24 pb-24 px-4 sm:px-6">
            <SEO
                title={product.name}
                description={product.description?.substring(0, 160) || `Buy ${product.name} at Tarzify.`}
                image={product.image_url}
                url={`https://tarzify.com/${generateProductURL(product.name, product.sku)}`}
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
                            onMouseMove={handleMouseMove}
                            className="aspect-[4/5] glass rounded-[2rem] sm:rounded-[3rem] overflow-hidden relative group shadow-2xl bg-white flex items-center justify-center p-4 border border-foreground/5 cursor-zoom-in"
                        >
                            {activeImage && (
                                <img
                                    src={getImageUrl(activeImage)}
                                    alt={product.name}
                                    onError={() => handleImageError(activeImage)}
                                    style={{
                                        transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`
                                    }}
                                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[2.5]"
                                />
                            )}

                            {/* Zoom Instructions */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 glass rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">Hover to explore details</span>
                            </div>

                            {/* Navigation Arrows */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 glass rounded-full hover:scale-110 transition-transform z-20 opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 glass rounded-full hover:scale-110 transition-transform z-20 opacity-0 group-hover:opacity-100"
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
                                        {img && (
                                            <img
                                                src={getImageUrl(img)}
                                                alt={`${product.name} ${idx + 1}`}
                                                onError={() => handleImageError(img)}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
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
                            <div className="flex flex-col gap-2">
                                <p className="text-3xl font-black text-primary">Rs. {product.price.toLocaleString()}</p>
                                <div className="flex items-center gap-1.5 text-yellow-500">
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(Number(avgRating)) ? 'fill-current' : 'opacity-20'}`} />
                                        ))}
                                    </div>
                                    <span className="text-xs font-black text-foreground/40 mt-0.5">({avgRating} Average / {reviews.length} reviews)</span>
                                </div>
                            </div>
                        </div>

                        <p className="text-lg opacity-60 leading-relaxed font-medium">
                            {product.description || `Experience the pinnacle of premium design and performance. This ${product.category.toLowerCase()} is meticulously crafted to meet the highest standards of quality and durability.`}
                        </p>

                        <div className="space-y-6">
                            {/* Stock Status Indicator */}
                            {product.stock > 0 && product.stock <= 10 && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex items-center gap-2 font-black italic uppercase tracking-tighter text-sm ${product.stock <= 3 ? 'text-red-500' : 'text-amber-500'}`}
                                >
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${product.stock <= 3 ? 'bg-red-500' : 'bg-amber-500'}`} />
                                    Only {product.stock} items left in stock!
                                </motion.div>
                            )}

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
                                    if (product.stock === 0) return;
                                    addItem(product);
                                    onFly(e);
                                }}
                                disabled={product.stock === 0}
                                className={`w-full py-6 transition-all rounded-[2rem] font-black text-xl shadow-2xl flex items-center justify-center gap-3 ${product.stock === 0
                                    ? 'bg-foreground/20 text-foreground/40 cursor-not-allowed'
                                    : 'bg-primary text-white shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
                                    }`}
                            >
                                <ShoppingBag className="w-6 h-6" />
                                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>

                        {/* Perks */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-white/10">
                            {[
                                { icon: Truck, label: 'Fast Shipping', hash: 'shipping-policy' },
                                { icon: ShieldCheck, label: 'Secure Payment', hash: 'privacy' },
                                { icon: RefreshCcw, label: 'Easy Returns', hash: 'returns' }
                            ].map(({ icon: Icon, label, hash }) => (
                                <button
                                    key={label}
                                    onClick={() => window.location.hash = hash}
                                    className="flex flex-col items-center text-center gap-2 p-4 glass rounded-3xl hover:bg-white/10 hover:scale-105 transition-all group"
                                >
                                    <Icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{label}</span>
                                </button>
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
                            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                                {reviews.map((review) => {
                                    const nameFirstChar = review.profiles?.full_name ? review.profiles.full_name[0] : 'U';
                                    const fullName = review.profiles?.full_name || 'Anonymous';

                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            key={review.id}
                                            className="glass p-8 rounded-[2.5rem] border-white/5 space-y-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-black text-primary text-xs">
                                                        {nameFirstChar}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm">{fullName}</p>
                                                        <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-foreground/10'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm leading-relaxed opacity-80 font-medium">{review.comment}</p>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
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
