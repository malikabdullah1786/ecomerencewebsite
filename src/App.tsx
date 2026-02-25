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
    const { products, loading } = useProducts();
    const { user, role, initialize } = useAuthStore();

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
                <section className="py-8 md:py-12 px-4 max-w-7xl mx-auto" id="categories">
                    <div className="flex overflow-x-auto gap-3 pb-10 no-scrollbar snap-x">
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

                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <div key={i} className="aspect-[4/5] bg-white animate-pulse rounded-[2rem] border border-gray-100" />)}
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {Object.entries(groupedProducts).length === 0 ? (
                                <div className="text-center py-24 glass rounded-[3rem] opacity-30 font-black uppercase italic tracking-[0.3em] text-2xl">No Products Found</div>
                            ) : (
                                Object.entries(groupedProducts).map(([categoryName, catProducts]) => (
                                    <div key={categoryName} className="space-y-8">
                                        <div className="flex items-center justify-between border-b-2 border-primary/10 pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-8 bg-primary rounded-full" />
                                                <h2 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tighter italic">{categoryName}</h2>
                                            </div>
                                            <button onClick={() => setActiveCategory(categoryName)} className="text-[10px] font-black uppercase tracking-widest text-primary hover:tracking-[0.2em] transition-all">View All</button>
                                        </div>
                                        <div className="relative group/slider">
                                            <button
                                                onClick={(e) => {
                                                    const container = e.currentTarget.parentElement?.querySelector('.slider-container');
                                                    container?.scrollBy({ left: -400, behavior: 'smooth' });
                                                }}
                                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 bg-white shadow-2xl border border-gray-50 p-4 rounded-full hidden md:group-hover/slider:flex items-center justify-center text-primary hover:scale-110 transition-all active:scale-95"
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    const container = e.currentTarget.parentElement?.querySelector('.slider-container');
                                                    container?.scrollBy({ left: 400, behavior: 'smooth' });
                                                }}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 bg-white shadow-2xl border border-gray-50 p-4 rounded-full hidden md:group-hover/slider:flex items-center justify-center text-primary hover:scale-110 transition-all active:scale-95"
                                            >
                                                <ChevronRight className="w-6 h-6" />
                                            </button>
                                            <div className="slider-container flex overflow-x-auto gap-4 md:gap-8 pb-6 no-scrollbar snap-x snap-mandatory scroll-smooth pr-6">
                                                {catProducts.map((product) => (
                                                    <div key={product.id} className="w-[180px] sm:w-[215px] md:w-[290px] flex-shrink-0 snap-start first:pl-2">
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
                                        </div>
                                    </div>
                                ))
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
