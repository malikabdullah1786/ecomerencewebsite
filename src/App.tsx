import { useEffect, useState } from 'react';
import Lenis from '@studio-freight/lenis';
import { X, Loader2 } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FlashSaleBanner } from './components/FlashSaleBanner';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
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

  useEffect(() => {
    // Lenis initialization for smooth scrolling
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

      // Admin/Merchant Dashboard
      setShowAdmin(hash === '#admin' && role === 'admin');
      setShowMerchant(hash === '#merchant' && (role === 'merchant' || role === 'admin'));

      // General Pages
      setShowCheckout(hash === '#checkout');
      setShowProfile(hash === '#profile');
      setShowTrackOrder(hash === '#track-order');

      const policyTypes = ['privacy', 'returns', 'shipping-policy', 'terms'];
      const matchedPolicy = policyTypes.find(t => hash === `#${t}`);
      setShowPolicy(matchedPolicy ? (matchedPolicy === 'shipping-policy' ? 'shipping' : matchedPolicy) : null);

      // Product Details routing
      if (hash.startsWith('#product/')) {
        const path = hash.replace('#product/', '').toUpperCase();

        if (products.length > 0) {
          // 1. Try match by suffix (the most robust way to find the SKU at the end)
          const matched = products.find(p => path.endsWith(p.sku.toUpperCase()));

          if (matched) {
            setViewProductId(matched.id);
          } else {
            // 2. Fallback to direct numeric ID
            const numericId = parseInt(path);
            if (!isNaN(numericId) && String(numericId) === path) {
              setViewProductId(numericId);
            } else {
              setViewProductId(null);
            }
          }
        } else {
          // Products are still loading, but we know we ARE on a product path
          // We set a marker or just wait for the next iteration of this effect
          // To ensure we don't flash the homepage, we can keep viewProductId at 0 or a special value
          // but better to just let the renderContent handle the 'loading' state
        }
      } else {
        setViewProductId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run on mount and when products/role change

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [role, products, window.location.hash]);

  const handleProductFly = () => {
    // We can re-enable FlyToCart logic if needed, but keeping it simple for now
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
      // Improved Search Algorithm:
      // 1. Checks Name, Category, AND SKU
      // 2. Case-insensitive
      // 3. Multi-term support (e.g. "red shoes" finds items with "red" and "shoes")
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(t => t.length > 0);
      const productString = `${p.name} ${p.category} ${p.sku}`.toLowerCase();

      const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => productString.includes(term));
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;

      return matchesSearch && matchesCategory;
    });

    const categories = ['All', ...new Set(products.map(p => p.category))];

    return (
      <main>
        <Hero />
        <FlashSaleBanner />
        <section className="py-24 px-6 max-w-7xl mx-auto" id="categories">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8 text-left">
            <h2 className="text-6xl font-black tracking-tighter italic uppercase underline decoration-primary decoration-8">Explore Store</h2>
            <div className="flex flex-wrap gap-4">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-8 py-3 rounded-2xl font-black text-sm transition-all ${activeCategory === cat ? 'bg-primary text-white scale-105 shadow-xl shadow-primary/20' : 'glass opacity-50 hover:opacity-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {loading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-96 glass animate-pulse rounded-[3rem]" />)
            ) : filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
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
