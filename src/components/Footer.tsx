import { MapPin, Phone, Mail, Instagram, Twitter, Facebook } from 'lucide-react';
import { useProductStore } from '../stores/useProductStore';

const POPULAR_SEARCHES = [
    "buy online Pakistan", "tarzify online store", "online shopping Lahore", "online shopping Karachi",
    "cash on delivery Pakistan", "fast delivery Pakistan", "best prices online", "branded products Pakistan",
    "buy mobile phones online", "buy clothes online Pakistan", "buy shoes online", "buy electronics Pakistan",
    "men's clothing online", "women's fashion Pakistan", "tarzify ecommerce store", "discount shopping Pakistan",
    "buy watches online", "buy earbuds Pakistan", "buy laptops online Pakistan", "tarzify deals",
];

export const Footer = () => {
    // ── Dynamic categories from live product store (Daraz-style) ──
    const products = useProductStore(s => s.products);

    // Group in-stock products by category → { "Men's Clothing": ["Leather Wallet", "T-Shirt", ...], ... }
    const dynamicCategories = products
        .filter(p => p.stock > 0)
        .reduce((acc: { [cat: string]: string[] }, p) => {
            const cat = p.category || 'Other';
            if (!acc[cat]) acc[cat] = [];
            if (acc[cat].length < 7 && !acc[cat].includes(p.name)) acc[cat].push(p.name);
            return acc;
        }, {});

    // Convert to array, max 6 categories to keep footer clean
    const categoryEntries = Object.entries(dynamicCategories).slice(0, 6);

    return (
        <footer className="bg-white border-t border-gray-100 mt-10">

            {/* ── SEO Content Block (Daraz-style) ── */}
            <div className="border-b border-gray-100 py-12 px-5">
                <div className="max-w-7xl mx-auto">

                    {/* About Tarzify — keyword-rich paragraphs */}
                    <div className="mb-10">
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 mb-4">
                            How Tarzify Transformed Online Shopping in Pakistan
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-gray-500 leading-relaxed font-medium">
                            <div>
                                <h3 className="font-black text-gray-700 uppercase text-[11px] tracking-wide mb-2">Pakistan's Favourite Ecommerce Store</h3>
                                <p>
                                    Tarzify is Pakistan's fastest-growing online ecommerce store, delivering premium products to customers
                                    across Lahore, Karachi, Islamabad, and every city in Pakistan. Whether you are looking for men's fashion,
                                    women's clothing, electronics, home decor, or beauty products — Tarzify has it all. Shop with confidence
                                    with our cash on delivery option, secure checkout, and fast nationwide shipping.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-black text-gray-700 uppercase text-[11px] tracking-wide mb-2">Shop from Verified Merchants</h3>
                                <p>
                                    Every product listed on Tarzify comes from verified merchants and trusted sellers across Pakistan.
                                    We believe in quality-first online shopping, which is why every order is carefully reviewed before
                                    dispatch. Tarzify sellers offer the best prices on branded and unbranded products, making us your
                                    number one destination for online shopping in Pakistan with guaranteed authenticity.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-black text-gray-700 uppercase text-[11px] tracking-wide mb-2">Exclusive Offers & Fast Delivery</h3>
                                <p>
                                    Tarzify offers exclusive discounts, seasonal sales, and daily deals across all categories. Our
                                    logistics network covers the entire country, ensuring your order arrives within 2–5 business days.
                                    With multiple payment methods including cash on delivery, EasyPaisa, and JazzCash, buying online
                                    at Tarzify has never been easier or more convenient for customers across all of Pakistan.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Top Categories & Brands — dynamic from live in-stock products */}
                    <div className="border-t border-gray-100 pt-8 mb-8">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-5">Top Categories &amp; Available Products</h3>
                        {categoryEntries.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                                {categoryEntries.map(([catName, productNames]) => (
                                    <div key={catName}>
                                        <p className="text-[11px] font-black uppercase text-gray-700 mb-2 tracking-wide">{catName}</p>
                                        <ul className="space-y-1">
                                            {(productNames as string[]).map((name: string) => (
                                                <li key={name}>
                                                    <span className="text-[11px] text-gray-400 hover:text-primary cursor-pointer transition-colors">
                                                        {name}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="space-y-2">
                                        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                                        {[1, 2, 3, 4].map(j => <div key={j} className="h-2.5 w-28 bg-gray-50 rounded animate-pulse" />)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Popular Searches */}
                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Popular Searches on Tarzify</h3>
                        <div className="flex flex-wrap gap-2">
                            {POPULAR_SEARCHES.map(term => (
                                <span
                                    key={term}
                                    className="px-3 py-1 text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 rounded-full hover:text-primary hover:border-primary/30 cursor-pointer transition-colors"
                                >
                                    {term}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Footer Links ── */}
            <div className="py-12 px-5">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-16 mb-12">

                        {/* Brand */}
                        <div className="space-y-5">
                            <img
                                src="/logo.png"
                                alt="Tarzify Logo — Online Shopping Pakistan"
                                className="w-14 h-14 rounded-full object-cover shadow-xl border-2 border-primary/20 p-1"
                            />
                            <p className="text-xs text-gray-400 leading-relaxed font-medium">
                                Pakistan's premium ecommerce store. Fast delivery, secure payments, and quality products — only at Tarzify.
                            </p>
                            {/* Trust badges */}
                            <div className="flex flex-wrap gap-2 pt-1">
                                {['Cash on Delivery', 'TCS Verified', 'Secure Checkout', 'FBR Registered'].map(tag => (
                                    <span key={tag} className="text-[9px] font-black uppercase tracking-wider border border-gray-200 px-2 py-1 rounded-full text-gray-400">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Legal Links */}
                        <div className="space-y-5">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Legal &amp; Policies</h4>
                            <div className="flex flex-col gap-3">
                                {['Privacy Policy', 'Returns & Refunds', 'Shipping Policy', 'Terms & Conditions'].map((text, i) => (
                                    <button
                                        key={i}
                                        onClick={() => window.location.hash = `#${text.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                                        className="text-left text-xs font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-widest"
                                    >
                                        {text}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="space-y-5">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Get in Touch</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    <address className="not-italic text-xs font-bold uppercase tracking-wider">Lahore, Pakistan</address>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    <a href="tel:+923094561786" className="text-xs font-bold uppercase tracking-wider hover:text-primary transition-colors">
                                        +92 309 456 1786
                                    </a>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    <span className="text-xs font-bold tracking-wider">support@tarzify.com</span>
                                </div>
                            </div>
                        </div>

                        {/* Socials */}
                        <div className="space-y-5">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Follow Tarzify</h4>
                            <div className="flex gap-3">
                                {[
                                    { Icon: Instagram, label: 'Instagram', href: 'https://instagram.com/tarzify' },
                                    { Icon: Twitter, label: 'Twitter', href: 'https://twitter.com/tarzify' },
                                    { Icon: Facebook, label: 'Facebook', href: 'https://facebook.com/tarzify' },
                                ].map(({ Icon, label, href }) => (
                                    <a
                                        key={label}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={label}
                                        className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                                    >
                                        <Icon className="w-4 h-4" />
                                    </a>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                Stay updated with the latest deals, new arrivals, and exclusive offers from Tarzify Pakistan.
                            </p>
                        </div>
                    </div>

                    {/* Copyright bar */}
                    <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                            © {new Date().getFullYear()} Tarzify Ecommerce Store Pakistan. All Rights Reserved.
                        </p>
                        <p className="text-[10px] text-gray-300 font-medium">
                            Online Shopping Pakistan | Fast Delivery | Cash on Delivery | Tarzify
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};
