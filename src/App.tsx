import { useEffect, useState } from 'react';
import Lenis from '@studio-freight/lenis';
import {
    ChevronRight,
    ChevronLeft,
    Loader2,
    X
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { useCartStore } from './stores/useCartStore';
import { useProducts } from './hooks/useProducts';
import { useAuthStore } from './stores/useAuthStore';
import { AuthPage } from './pages/AuthPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { CheckoutPage } from './pages/CheckoutPage';
import { MerchantDashboard } from './pages/MerchantDashboard';
import { FomoPopups } from './components/FomoPopups';
import { ProductDetails } from './pages/ProductDetails';
import { TrackOrder } from './components/TrackOrder';
import { ProfilePage } from './pages/ProfilePage';
import { PolicyPage } from './pages/PolicyPage';
import { Footer } from './components/Footer';
import { SEO } from './components/SEO';
import { ToastContainer } from './components/ToastContainer';

function App() {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);
    const [showMerchant, setShowMerchant] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showTrackOrder, setShowTrackOrder] = useState(false);
    const [showPolicy, setShowPolicy] = useState<any>(null);
    const [viewProductId, setViewProductId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    // Pixel-based card width so overflow scroll always triggers (% fills container exactly — no overflow)
    const getCardWidth = () => {
        const vw = window.innerWidth;
        if (vw < 640) return Math.floor((vw - 56) / 3);   // mobile: 3 cards, account for arrows+padding
        if (vw < 1024) return Math.floor((vw - 72) / 3);  // tablet: 3 cards
        return Math.floor((Math.min(vw, 1280) - 120) / 4); // desktop: 4 cards, max-w-7xl
    };
    const [cardWidth, setCardWidth] = useState(getCardWidth);
    const { products, loading } = useProducts();
    const { user, role, initialize } = useAuthStore();

    // Track viewport for card width calculation
    useEffect(() => {
        const onResize = () => {
            setCardWidth(getCardWidth());
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);


    useEffect(() => {
        initialize();
    }, []);

    // Sync cart with products
    useEffect(() => {
        if (!loading && products.length > 0) {
            useCartStore.getState().syncWithProducts(products.map(p => p.id));
        }
    }, [products, loading]);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 0.8,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1.5,
            infinite: false,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            setShowAdmin(hash === '#admin' && role === 'admin');
            setShowMerchant(hash === '#merchant' && (role === 'merchant' || role === 'admin'));
            setShowCheckout(hash === '#checkout');
            setShowProfile(hash === '#profile');
            setShowTrackOrder(hash === '#track-order');

            const policyTypes = ['privacy', 'returns', 'shipping-policy', 'terms'];
            const matchedPolicy = policyTypes.find(t => hash === `#${t}`);
            setShowPolicy(matchedPolicy ? (matchedPolicy === 'shipping-policy' ? 'shipping' : matchedPolicy) : null);

            if (hash.startsWith('#product/')) {
                const path = hash.replace('#product/', '').toUpperCase();
                if (products.length > 0) {
                    const matched = products.find(p => path.endsWith(p.sku.toUpperCase()));
                    if (matched) {
                        setViewProductId(matched.id);
                    } else {
                        const numericId = parseInt(path);
                        if (!isNaN(numericId) && String(numericId) === path) {
                            setViewProductId(numericId);
                        } else {
                            setViewProductId(null);
                        }
                    }
                }
            } else {
                setViewProductId(null);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange();

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [role, products]);

    const handleProductFly = () => {
        setIsCartOpen(true);
    };

    // Scroll a named slider container left or right
    const scrollSlider = (sliderId: string, direction: 'left' | 'right') => {
        const el = document.getElementById(sliderId);
        if (el) el.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
    };

    const renderContent = () => {
        if (showPolicy) return <PolicyPage type={showPolicy} />;
        if (showAdmin && role === 'admin') return <AdminDashboard />;
        if (showMerchant && (role === 'merchant' || role === 'admin')) return <MerchantDashboard />;

        if (viewProductId || window.location.hash.startsWith('#product/')) {
            const product = products.find(p => p.id === viewProductId);
            if (loading || !product || !viewProductId) {
                return (
                    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        <p className="font-black uppercase tracking-tighter opacity-30 italic">Finding your product...</p>
                    </div>
                );
            }
            return (
                <ProductDetails
                    productId={viewProductId}
                    onBack={() => window.location.hash = ''}
                    onFly={() => handleProductFly()}
                />
            );
        }

        if (showProfile && user) return <ProfilePage />;

        if (showCheckout) {
            if (!user) return (
                <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
                    <button onClick={() => window.location.hash = ''} className="absolute top-8 right-8 z-[110] glass p-3 rounded-full hover:scale-110 transition-transform"><X className="w-6 h-6" /></button>
                    <div className="text-center space-y-4 mb-8">
                        <h2 className="text-3xl font-black tracking-tighter uppercase italic">Login Required</h2>
                        <p className="opacity-50">Please sign in to complete your checkout.</p>
                    </div>
                    <AuthPage onClose={() => window.location.hash = ''} />
                </div>
            );
            return <CheckoutPage onBack={() => window.location.hash = ''} />;
        }

        // ── MAIN STOREFRONT ──────────────────────────────────────────
        const filteredProducts = products.filter(p => {
            const searchTerms = searchQuery.toLowerCase().split(' ').filter(t => t.length > 0);
            const productString = `${p.name} ${p.category} ${p.sku}`.toLowerCase();
            const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => productString.includes(term));
            const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
            const isAvailable = p.stock > 0;
            return matchesSearch && matchesCategory && isAvailable;
        });

        const categories = ['All', ...new Set(products.map(p => p.category))];

        const groupedProducts = filteredProducts.reduce((acc: { [key: string]: typeof products }, product) => {
            const cat = product.category || 'Other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(product);
            return acc;
        }, {});

        return (
            <main className="bg-gray-50/50 min-h-screen pb-20">
                <Hero />

                <section className="py-8 md:py-12 px-5 max-w-7xl mx-auto" id="categories">

                    {/* Category Filter Pills */}
                    <div className="flex overflow-x-auto gap-3 pb-8 no-scrollbar snap-x">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap border transition-all snap-start ${activeCategory === cat ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-primary/30 hover:text-primary'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Product Grid / Skeleton */}
                    {loading ? (
                        <div className="space-y-12">
                            {[1, 2].map(s => (
                                <div key={s}>
                                    <div className="h-7 w-40 bg-gray-200 animate-pulse rounded mb-5" />
                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-5">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="aspect-[3/4] bg-white animate-pulse rounded-2xl border border-gray-100" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeCategory !== 'All' ? (
                        /* ── VIEW ALL MODE: multi-row grid ── */
                        <div>
                            {/* Header with back button */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="block w-1 h-6 md:h-7 bg-primary rounded-full" />
                                    <h2 className="text-base md:text-xl font-black text-gray-900 uppercase tracking-tight">
                                        {activeCategory}
                                    </h2>
                                    <span className="text-xs text-gray-400 font-bold">({filteredProducts.length} products)</span>
                                </div>
                                <button
                                    onClick={() => setActiveCategory('All')}
                                    className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-primary hover:gap-2 transition-all"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                                </button>
                            </div>

                            {filteredProducts.length === 0 ? (
                                <div className="text-center py-24 glass rounded-[3rem] opacity-30 font-black uppercase italic tracking-[0.3em] text-2xl">
                                    No Products Found
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                                    {filteredProducts.map(product => (
                                        <ProductCard
                                            key={product.id}
                                            id={product.id}
                                            name={product.name}
                                            price={product.price}
                                            compare_at_price={product.compare_at_price}
                                            image={product.image_url}
                                            image_urls={product.image_urls}
                                            category={product.category}
                                            sku={product.sku}
                                            stock={product.stock}
                                            rating={product.avg_rating}
                                            onFly={() => handleProductFly()}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ── HOME MODE: sliders per category ── */
                        <div className="space-y-12">
                            {Object.entries(groupedProducts).length === 0 ? (
                                <div className="text-center py-24 glass rounded-[3rem] opacity-30 font-black uppercase italic tracking-[0.3em] text-2xl">
                                    No Products Found
                                </div>
                            ) : (
                                Object.entries(groupedProducts).map(([categoryName, catProducts]) => {
                                    const sliderId = `slider-${categoryName.replace(/[^a-z0-9]/gi, '-')}`;
                                    return (
                                        <div key={categoryName}>
                                            {/* ── Category Header ── */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="block w-1 h-6 md:h-7 bg-primary rounded-full" />
                                                    <h2 className="text-base md:text-xl font-black text-gray-900 uppercase tracking-tight">
                                                        {categoryName}
                                                    </h2>
                                                </div>
                                                <button
                                                    onClick={() => setActiveCategory(categoryName)}
                                                    className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1 hover:gap-2 transition-all"
                                                >
                                                    VIEW ALL <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* ── Product Slider ── */}
                                            <div className="relative px-5 md:px-6">
                                                <button
                                                    onClick={() => scrollSlider(sliderId, 'left')}
                                                    aria-label={`Previous ${categoryName} products`}
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-90"
                                                >
                                                    <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                                                </button>

                                                <div
                                                    id={sliderId}
                                                    className="flex flex-nowrap gap-2 md:gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-1"
                                                >
                                                    {catProducts.map((product) => (
                                                        <div
                                                            key={product.id}
                                                            className="flex-shrink-0"
                                                            style={{ width: cardWidth }}
                                                        >
                                                            <ProductCard
                                                                id={product.id}
                                                                name={product.name}
                                                                price={product.price}
                                                                compare_at_price={product.compare_at_price}
                                                                image={product.image_url}
                                                                image_urls={product.image_urls}
                                                                category={product.category}
                                                                sku={product.sku}
                                                                stock={product.stock}
                                                                rating={product.avg_rating}
                                                                onFly={() => handleProductFly()}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={() => scrollSlider(sliderId, 'right')}
                                                    aria-label={`Next ${categoryName} products`}
                                                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-90"
                                                >
                                                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </section>
            </main>
        );
    };

    return (
        <div className="min-h-screen bg-background selection:bg-primary selection:text-white overflow-x-hidden">
            <Navbar onCartClick={() => setIsCartOpen(true)} onLoginClick={() => setShowAuth(true)} onSearch={setSearchQuery} />
            <SEO />
            {renderContent()}
            <Footer />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            {showTrackOrder && <TrackOrder onClose={() => window.location.hash = ''} />}
            {showAuth && !user && <AuthPage onClose={() => setShowAuth(false)} />}
            <FomoPopups />
            <ToastContainer />
        </div>
    );
}

export default App;
