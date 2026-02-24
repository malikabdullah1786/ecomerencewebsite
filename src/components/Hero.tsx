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
                    className="flex flex-col items-center"
                >
                    <h1 className="font-black mb-12 tracking-tighter flex flex-col items-center uppercase leading-none overflow-visible">
                        <span className="inline-block text-[5rem] md:text-[10rem] bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent italic pb-14 leading-none z-20">
                            TARZIFY
                        </span>

                        <div className="relative group px-4 -mt-12 z-10 overflow-hidden text-center">
                            <span className="text-[2.4rem] md:text-[5.4rem] text-foreground block leading-none">
                                Premium
                            </span>
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-30 z-10 pointer-events-none"
                                animate={{ x: ['-150%', '150%'] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            />
                        </div>

                        <div className="relative group px-4 -mt-2 z-0 overflow-hidden text-center">
                            <span className="text-[1.2rem] md:text-[2.7rem] bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent italic leading-none">
                                Lifestyle Store
                            </span>
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-30 z-10 pointer-events-none"
                                animate={{ x: ['-150%', '150%'] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            />
                        </div>
                    </h1>
                    <p className="text-xl text-foreground/60 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
                        Discover a complete shopping ecosystem where premium quality meets unparalleled convenience. Whether it’s daily luxury or unique lifestyle pieces, enjoy a fully integrated shopping experience with rapid, tracked delivery across every corner of Pakistan.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-primary text-white rounded-full font-black text-base md:text-lg hover:scale-105 transition-transform shadow-[0_20px_50px_rgba(8,_112,_184,_0.3)]">
                            Shop the Collection
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
