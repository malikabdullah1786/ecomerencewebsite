import { MapPin, Phone, Mail, Instagram, Twitter, Facebook } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="relative z-10 pt-24 pb-12 px-6 bg-gradient-to-b from-transparent to-primary/5">
            <div className="max-w-7xl mx-auto space-y-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16">
                    {/* Brand */}
                    <div className="space-y-6 text-center md:text-left">
                        <div className="flex justify-center md:justify-start">
                            <img
                                src="/logo.png"
                                alt="Tarzify Logo"
                                className="w-16 h-16 rounded-full object-cover shadow-2xl border-2 border-primary/20 p-1"
                            />
                        </div>
                        <p className="opacity-50 text-xs md:text-sm font-black uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto md:mx-0">
                            Your premium destination for quality lifestyle products in Pakistan.
                            Delivered with speed, secured with trust and TARZIFY quality.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-8 text-center md:text-left">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Legal & Policies</h4>
                        <div className="flex flex-col gap-4">
                            {['Privacy Policy', 'Returns & Refunds', 'Shipping Policy', 'Terms & Conditions'].map((text, i) => (
                                <button
                                    key={i}
                                    onClick={() => window.location.hash = `#${text.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                                    className="hover:text-primary transition-all text-[11px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 hover:translate-x-1"
                                >
                                    {text}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-8 text-center md:text-left">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Get in Touch</h4>
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row items-center gap-3 opacity-60 group">
                                <div className="p-2 glass rounded-lg group-hover:scale-110 transition-transform"><MapPin className="w-4 h-4 text-primary" /></div>
                                <address className="not-italic text-[11px] font-black uppercase tracking-widest">Lahore, Pakistan</address>
                            </div>
                            <div className="flex flex-col md:flex-row items-center gap-3 opacity-60 group">
                                <div className="p-2 glass rounded-lg group-hover:scale-110 transition-transform"><Phone className="w-4 h-4 text-primary" /></div>
                                <a href="tel:+923094561786" className="text-[11px] font-black uppercase tracking-widest hover:text-primary transition-colors">+92 309 456 1786</a>
                            </div>
                            <div className="flex flex-col md:flex-row items-center gap-3 opacity-60 group">
                                <div className="p-2 glass rounded-lg group-hover:scale-110 transition-transform"><Mail className="w-4 h-4 text-primary" /></div>
                                <span className="text-[11px] font-black uppercase tracking-widest truncate max-w-[200px]">support@tarzify.com</span>
                            </div>
                        </div>
                    </div>

                    {/* Socials */}
                    <div className="space-y-8 text-center md:text-left">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Join Our World</h4>
                        <div className="flex justify-center md:justify-start gap-4">
                            {[Instagram, Twitter, Facebook].map((Icon, i) => (
                                <button key={i} className="w-12 h-12 glass rounded-2xl flex items-center justify-center hover:scale-110 hover:text-primary hover:shadow-lg hover:shadow-primary/20 transition-all border border-white/5">
                                    <Icon className="w-5 h-5 shadow-sm" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-20">© 2026 TARZIFY LUXURY CO. | PK HQ</p>
                    <div className="flex flex-wrap justify-center gap-6 opacity-20 group">
                        {['TCS Verified', 'FBR Registered', 'Secure Checkout'].map((tag, i) => (
                            <span key={i} className="text-[9px] font-black uppercase tracking-widest border border-white/10 px-3 py-1 rounded-full">{tag}</span>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};
