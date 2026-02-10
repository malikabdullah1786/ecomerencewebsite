import { MapPin, Phone, Mail, Instagram, Twitter, Facebook } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="relative z-10 pt-24 pb-12 px-6">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase">TARZIFY</h2>
                        <p className="opacity-50 text-sm font-medium leading-relaxed">
                            Your premium destination for quality lifestyle products in Pakistan.
                            Delivered with speed, secured with trust.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest opacity-30">Policies</h4>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => window.location.hash = '#privacy'} className="hover:text-primary transition-colors text-sm font-bold w-fit opacity-60 hover:opacity-100">Privacy Policy</button>
                            <button onClick={() => window.location.hash = '#returns'} className="hover:text-primary transition-colors text-sm font-bold w-fit opacity-60 hover:opacity-100">Returns & Refunds</button>
                            <button onClick={() => window.location.hash = '#shipping-policy'} className="hover:text-primary transition-colors text-sm font-bold w-fit opacity-60 hover:opacity-100">Shipping Policy</button>
                            <button onClick={() => window.location.hash = '#terms'} className="hover:text-primary transition-colors text-sm font-bold w-fit opacity-60 hover:opacity-100">Terms & Conditions</button>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest opacity-30">Contact Us</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 opacity-60">
                                <MapPin className="w-4 h-4 text-primary" />
                                <address className="not-italic text-sm font-bold">FAISAL TOWN, LAHORE, PUNJAB, PAKISTAN</address>
                            </div>
                            <div className="flex items-center gap-3 opacity-60">
                                <Phone className="w-4 h-4 text-primary" />
                                <a href="tel:+923094561786" className="text-sm font-bold hover:text-primary decoration-none">+92 309 456 1786</a>
                            </div>
                            <div className="flex items-center gap-3 opacity-60">
                                <Mail className="w-4 h-4 text-primary" />
                                <span className="text-sm font-bold">customersupport@tarzify.com</span>
                            </div>
                        </div>
                    </div>

                    {/* Socials */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest opacity-30">Follow Us</h4>
                        <div className="flex gap-4">
                            {[Instagram, Twitter, Facebook].map((Icon, i) => (
                                <button key={i} className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:scale-110 hover:text-primary transition-all">
                                    <Icon className="w-5 h-5" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-widest">© 2026 TARZIFY | LAHORE OFFICE</p>
                    <div className="flex gap-6">
                        <span className="text-[10px] font-black uppercase">TCS Verified</span>
                        <span className="text-[10px] font-black uppercase">FBR Registered</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
