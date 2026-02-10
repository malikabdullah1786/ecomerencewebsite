import { motion } from 'framer-motion';
import { ShoppingCart, User as UserIcon, Search, Menu, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useCartStore } from '../stores/useCartStore';
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
    const cartItemsCount = useCartStore((state) => state.items.length);
    const { user, role, signOut } = useAuthStore();

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 w-full z-50 px-6 py-4"
        >
            <nav className="max-w-7xl mx-auto glass rounded-full px-6 py-3 flex items-center justify-between shadow-2xl border-white/10">
                <div className="flex items-center gap-8">
                    <h2
                        onClick={() => window.location.reload()}
                        className="text-2xl font-black tracking-tighter bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent cursor-pointer"
                    >
                        TARZIFY
                    </h2>
                    <div className="hidden md:flex items-center gap-6">
                        {['Home', 'Shop', 'Flash Sale', 'Categories'].map((item) => (
                            <a
                                key={item}
                                href={item === 'Home' ? '#' : item === 'Categories' ? '#categories' : '#'}
                                className="text-sm font-medium hover:text-primary transition-colors relative group"
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                            </a>
                        ))}
                        <button onClick={() => window.location.hash = '#track-order'} className="text-sm font-black text-primary hover:scale-105 transition-transform">
                            Track Order
                        </button>
                        {user && (
                            <>
                                {role === 'merchant' && (
                                    <button
                                        onClick={() => window.location.hash = '#merchant'}
                                        className="text-sm font-black text-primary hover:scale-105 transition-transform"
                                    >
                                        Merchant Panel
                                    </button>
                                )}
                                {role === 'admin' && (
                                    <button
                                        onClick={() => window.location.hash = '#admin'}
                                        className="text-sm font-black text-primary hover:scale-105 transition-transform"
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
                            placeholder="Search Tarzify..."
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
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.location.hash = '#profile'}
                                    className="flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs font-bold hover:scale-105 transition-transform"
                                >
                                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-[10px]">
                                        {user.email?.[0].toUpperCase()}
                                    </div>
                                    <span className="hidden lg:block truncate max-w-[80px]">
                                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                    </span>
                                </button>
                                <button
                                    onClick={() => signOut()}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={onLoginClick}
                                className="p-2 rounded-full hover:bg-foreground/5"
                            >
                                <UserIcon className="w-6 h-6" />
                            </button>
                        )}

                        <button className="md:hidden p-2">
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </nav>
        </motion.header>
    );
};
