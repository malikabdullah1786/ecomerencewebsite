import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User as UserIcon, Search, Menu, LogOut, Shield, LayoutDashboard, X, ChevronRight, Package } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useCartStore } from '../stores/useCartStore';
import { useCartSync } from '../hooks/useCartSync';
import { useAuthStore } from '../stores/useAuthStore';

export const Navbar = ({
    onCartClick,
    onLoginClick,
    onSearch
}: {
    onCartClick: () => void,
    onLoginClick: () => void,
    onSearch: (query: string) => void
}) => {
    useCartSync(); // Initialize cart synchronization
    const cartItemsCount = useCartStore((state) => state.items.length);
    const { user, role, signOut } = useAuthStore();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        setIsProfileOpen(false);
        setIsMenuOpen(false);
        window.location.hash = '';
    };

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 w-full z-50 px-2 sm:px-6 py-2 sm:py-4 bg-transparent"
        >
            <nav className="max-w-7xl mx-auto glass rounded-full px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between shadow-2xl border-white/10">
                <div className="flex items-center gap-8">
                    <div
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
                    >
                        <img
                            src="/logo.png"
                            alt="TARZIFY Logo"
                            className="h-7 md:h-10 w-7 md:w-10 rounded-full object-cover border border-white/10 group-hover:scale-105 transition-transform shadow-lg"
                        />
                        <span className="text-xl md:text-3xl font-black tracking-tighter bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                            TARZIFY
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        {['Home', 'Shop', 'Categories'].map((item) => (
                            <a
                                key={item}
                                href={item === 'Home' ? '#' : item === 'Categories' ? '#categories' : '#'}
                                className="text-sm font-medium hover:text-primary transition-colors relative group"
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                            </a>
                        ))}
                        <button onClick={() => window.location.hash = '#track-order'} className="text-sm font-black text-foreground hover:text-primary transition-all">
                            Track Order
                        </button>
                        {user && (
                            <>
                                {(role === 'merchant' || role === 'admin') && (
                                    <button
                                        onClick={() => window.location.hash = '#merchant'}
                                        className="text-sm font-black text-foreground hover:text-primary transition-all"
                                    >
                                        Merchant Panel
                                    </button>
                                )}
                                {role === 'admin' && (
                                    <button
                                        onClick={() => window.location.hash = '#admin'}
                                        className="text-sm font-black text-foreground hover:text-primary transition-all"
                                    >
                                        Admin Panel
                                    </button>
                                )}
                                <button
                                    onClick={() => window.location.hash = '#profile'}
                                    className="text-sm font-black text-foreground hover:scale-105 transition-transform"
                                >
                                    Profile
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center bg-foreground/5 rounded-full px-3 py-1.5 focus-within:ring-2 ring-primary/30 transition-all">
                        <Search className="w-4 h-4 opacity-50" />
                        <input
                            type="text"
                            id="search"
                            name="search"
                            placeholder="Search TARZIFY..."
                            onChange={(e) => onSearch(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-sm px-2 w-32 lg:w-48"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            onClick={onCartClick}
                            className="p-2 rounded-full hover:bg-foreground/5 relative"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-[10px] text-white rounded-full flex items-center justify-center font-bold">
                                {cartItemsCount}
                            </span>
                        </button>

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs font-bold hover:scale-105 transition-transform"
                                >
                                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-[10px]">
                                        {user.email?.[0].toUpperCase()}
                                    </div>
                                    <span className="hidden lg:block truncate max-w-[80px]">
                                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                    </span>
                                </button>

                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                className="absolute right-0 mt-4 w-64 bg-background/95 backdrop-blur-3xl border border-white/20 rounded-[2rem] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
                                            >
                                                <div className="p-4 border-b border-white/5 space-y-1 mb-2">
                                                    <p className="text-xs font-black uppercase tracking-widest opacity-30">Account</p>
                                                    <p className="font-black truncate">{user.email}</p>
                                                </div>

                                                <div className="space-y-1">
                                                    <button onClick={() => { setIsProfileOpen(false); window.location.hash = '#profile'; }} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-[10px] font-black uppercase tracking-widest text-left">
                                                        <UserIcon className="w-4 h-4 opacity-50" />
                                                        My Profile
                                                    </button>

                                                    {(role === 'merchant' || role === 'admin') && (
                                                        <button onClick={() => { setIsProfileOpen(false); window.location.hash = '#merchant'; }} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-[10px] font-black uppercase tracking-widest text-left">
                                                            <LayoutDashboard className="w-4 h-4 opacity-50" />
                                                            Merchant Panel
                                                        </button>
                                                    )}

                                                    {role === 'admin' && (
                                                        <button onClick={() => { setIsProfileOpen(false); window.location.hash = '#admin'; }} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-[10px] font-black uppercase tracking-widest text-left">
                                                            <Shield className="w-4 h-4 opacity-50" />
                                                            Admin Panel
                                                        </button>
                                                    )}

                                                    <button onClick={handleSignOut} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-all text-[10px] font-black uppercase tracking-widest text-left">
                                                        <LogOut className="w-4 h-4 opacity-50" />
                                                        Log Out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <button
                                onClick={onLoginClick}
                                className="p-2 rounded-full hover:bg-foreground/5"
                            >
                                <UserIcon className="w-6 h-6" />
                            </button>
                        )}

                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 hover:bg-foreground/5 rounded-full transition-colors">
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Content */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] md:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-screen w-80 bg-background border-l border-white/10 z-[70] md:hidden p-8 flex flex-col gap-8 shadow-2xl"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-2xl font-black italic tracking-tighter">MENU</span>
                                <button onClick={() => setIsMenuOpen(false)} className="p-2 glass rounded-full"><X className="w-6 h-6" /></button>
                            </div>

                            <div className="flex-1 flex flex-col gap-8 overflow-y-auto pr-2 no-scrollbar">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Navigation</p>
                                    <div className="flex flex-col gap-3">
                                        {['Home', 'Shop'].map((item) => (
                                            <a
                                                key={item}
                                                href={item === 'Home' ? '#' : '#'}
                                                onClick={() => setIsMenuOpen(false)}
                                                className="text-3xl font-black uppercase tracking-tighter italic hover:text-primary transition-colors flex items-center justify-between group"
                                            >
                                                {item}
                                                <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Categories</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['Men', 'Women', 'Kids', 'Sport', 'Tech'].map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => { setIsMenuOpen(false); window.location.hash = '#categories'; }}
                                                className="px-4 py-2 bg-foreground/5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-transparent hover:border-primary/20"
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Account & Support</p>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        <button onClick={() => { setIsMenuOpen(false); window.location.hash = '#track-order'; }} className="flex items-center gap-3 h-14 px-6 bg-foreground/5 rounded-2xl hover:bg-primary/5 transition-all text-xs font-black uppercase tracking-widest">
                                            <Package className="w-5 h-5 opacity-50" />
                                            Track Order
                                        </button>

                                        {user ? (
                                            <>
                                                {(role === 'merchant' || role === 'admin') && (
                                                    <button onClick={() => { setIsMenuOpen(false); window.location.hash = '#merchant'; }} className="flex items-center gap-3 h-14 px-6 bg-primary/10 text-primary rounded-2xl hover:scale-[1.02] transition-all text-xs font-black uppercase tracking-widest">
                                                        <LayoutDashboard className="w-5 h-5" />
                                                        Merchant Panel
                                                    </button>
                                                )}
                                                {role === 'admin' && (
                                                    <button onClick={() => { setIsMenuOpen(false); window.location.hash = '#admin'; }} className="flex items-center gap-3 h-14 px-6 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all text-xs font-black uppercase tracking-widest">
                                                        <Shield className="w-5 h-5" />
                                                        Admin Panel
                                                    </button>
                                                )}
                                                <button onClick={() => { setIsMenuOpen(false); window.location.hash = '#profile'; }} className="flex items-center gap-3 h-14 px-6 bg-foreground/5 rounded-2xl hover:bg-primary/5 transition-all text-xs font-black uppercase tracking-widest">
                                                    <UserIcon className="w-5 h-5 opacity-50" />
                                                    My Profile
                                                </button>
                                                <button onClick={handleSignOut} className="flex items-center gap-3 h-14 px-6 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/20 transition-all text-xs font-black uppercase tracking-widest">
                                                    <LogOut className="w-5 h-5 opacity-50" />
                                                    Log Out
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => { setIsMenuOpen(false); onLoginClick(); }} className="flex items-center gap-3 h-16 px-8 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all text-xs font-black uppercase tracking-widest justify-center">
                                                Sign In / Register
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 border-t border-white/5 space-y-6">
                                <div className="flex items-center gap-3 px-5 py-3 bg-foreground/5 rounded-full focus-within:ring-2 ring-primary/30 transition-all shadow-inner">
                                    <Search className="w-4 h-4 opacity-50" />
                                    <input
                                        type="text"
                                        placeholder="Search TARZIFY..."
                                        onChange={(e) => onSearch(e.target.value)}
                                        className="bg-transparent border-none focus:outline-none text-xs flex-grow font-medium"
                                    />
                                </div>
                                <div className="flex justify-center gap-6 opacity-30">
                                    <button className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Instagram</button>
                                    <button className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">TikTok</button>
                                    <button className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Support</button>
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-20 text-center">TARZIFY LUXURY &copy; 2026</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.header>
    );
};
