import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const Hero = () => {
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!textRef.current) return;

        gsap.fromTo(textRef.current,
            { opacity: 0, y: 100 },
            {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: 'power4.out',
                scrollTrigger: {
                    trigger: textRef.current,
                    start: 'top 80%',
                }
            }
        );
    }, []);

    return (
        <section className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

            <div ref={textRef} className="container mx-auto px-6 text-center z-10">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-widest uppercase mb-6 inline-block">
                        Flash Sale Now Live
                    </span>
                    <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter">
                        Elevate Your <br />
                        <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent italic">
                            Shopping Experience
                        </span>
                    </h1>
                    <p className="text-xl text-foreground/60 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        Discover a curated collection of premium products. Fast delivery within Pakistan via Leopard, TCS, and Postex. Secure payments via FastPay.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="w-full sm:w-auto px-10 py-5 bg-primary text-white rounded-full font-black text-lg hover:scale-105 transition-transform shadow-[0_20px_50px_rgba(8,_112,_184,_0.3)]">
                            Shop the Collection
                        </button>
                        <button className="w-full sm:w-auto px-10 py-5 glass rounded-full font-black text-lg hover:bg-white/10 transition-all border border-white/20">
                            View Flash Sale
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Hero Visual */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none opacity-30">
                <div className="grid grid-cols-6 gap-4 rotate-12 scale-150">
                    {[...Array(24)].map((_, i) => (
                        <div
                            key={i}
                            className="aspect-square glass rounded-2xl animate-pulse"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
