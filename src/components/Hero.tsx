import { useRef } from 'react';
import { motion, type Variants } from 'framer-motion';

export const Hero = () => {
    const textRef = useRef<HTMLDivElement>(null);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const charVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                damping: 12,
                stiffness: 200
            }
        }
    };

    return (
        <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center pt-20 md:pt-24 overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-primary/20 rounded-full blur-[80px] md:blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-accent/20 rounded-full blur-[80px] md:blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

            <div ref={textRef} className="container mx-auto px-4 md:px-6 text-center z-10">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col items-center"
                >
                    <h1 className="font-black mb-8 md:mb-12 tracking-tighter flex flex-col items-center uppercase leading-none overflow-visible">
                        <div className="flex flex-wrap justify-center pb-8 md:pb-14">
                            {"TARZIFY".split("").map((char, index) => (
                                <motion.span
                                    key={index}
                                    variants={charVariants}
                                    className="inline-block text-[4rem] sm:text-[6rem] md:text-[10rem] bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent italic leading-none z-20"
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </div>

                        <div className="relative group px-4 -mt-8 md:-mt-12 z-10 overflow-hidden text-center flex flex-wrap justify-center">
                            {"Premium".split("").map((char, index) => (
                                <motion.span
                                    key={index}
                                    variants={charVariants}
                                    className="text-[2rem] sm:text-[3.5rem] md:text-[5.4rem] text-foreground inline-block leading-none"
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </div>

                        <div className="relative group px-4 mt-2 z-0 overflow-hidden text-center flex flex-wrap justify-center">
                            {"Lifestyle Store".split("").map((char, index) => (
                                <motion.span
                                    key={index}
                                    variants={charVariants}
                                    className={`text-[1rem] sm:text-[1.8rem] md:text-[2.7rem] bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent italic leading-none inline-block ${char === " " ? "mx-2" : ""}`}
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </div>
                    </h1>
                    <p className="text-sm sm:text-lg md:text-xl text-foreground/60 max-w-2xl md:max-w-3xl mx-auto mb-8 md:mb-10 leading-relaxed font-medium px-4">
                        Discover a complete shopping ecosystem where premium quality meets unparalleled convenience. Delivered with trust and speed across Pakistan.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-6 md:px-0">
                        <button className="w-full sm:w-auto px-8 md:px-10 py-3.5 md:py-5 bg-primary text-white rounded-full font-black text-sm md:text-lg hover:scale-105 transition-transform shadow-[0_15px_40px_rgba(8,_112,_184,_0.3)]">
                            Shop the Collection
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Hero Visual */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none opacity-20">
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3 md:gap-4 rotate-12 scale-125 md:scale-150">
                    {[...Array(16)].map((_, i) => (
                        <div
                            key={i}
                            className="aspect-square glass rounded-xl md:rounded-2xl animate-pulse"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
