import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';

export const FlashSaleBanner = () => {
    const [timeLeft, setTimeLeft] = useState({
        hours: 12,
        minutes: 45,
        seconds: 0
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full bg-primary/5 border-y border-primary/10 overflow-hidden">
            <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary text-white rounded-lg animate-bounce">
                        <Timer className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black italic tracking-tighter">MEGA FLASH SALE</h3>
                        <p className="text-sm opacity-60">High-demand items selling out fast!</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex gap-2">
                        {[
                            { val: timeLeft.hours, label: 'Hrs' },
                            { val: timeLeft.minutes, label: 'Min' },
                            { val: timeLeft.seconds, label: 'Sec' }
                        ].map(unit => (
                            <div key={unit.label} className="flex flex-col items-center">
                                <div className="w-12 h-12 glass rounded-xl flex items-center justify-center text-xl font-black text-primary border-primary/20 shadow-lg shadow-primary/5">
                                    {unit.val.toString().padStart(2, '0')}
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-50">{unit.label}</span>
                            </div>
                        ))}
                    </div>
                    <button className="px-6 py-3 bg-foreground text-background rounded-full font-bold text-sm hover:scale-105 transition-transform">
                        Remind Me
                    </button>
                </div>
            </div>
        </div>
    );
};
