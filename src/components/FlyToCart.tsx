import { motion, AnimatePresence } from 'framer-motion';

interface FlyToCartProps {
    image: string;
    startPos: { x: number; y: number };
    onComplete: () => void;
}

export const FlyToCart = ({ image, startPos, onComplete }: FlyToCartProps) => {
    return (
        <AnimatePresence>
            <motion.div
                initial={{
                    x: startPos.x,
                    y: startPos.y,
                    scale: 1,
                    opacity: 1,
                    position: 'fixed',
                    zIndex: 100,
                    pointerEvents: 'none'
                }}
                animate={{
                    x: window.innerWidth - 80, // Approximate cart icon position
                    y: 40,
                    scale: 0.1,
                    opacity: 0
                }}
                transition={{
                    duration: 0.8,
                    ease: [0.4, 0, 0.2, 1]
                }}
                onAnimationComplete={onComplete}
                className="w-32 h-32 rounded-2xl overflow-hidden shadow-2xl border-4 border-primary"
            >
                <img src={image} alt="flying product" className="w-full h-full object-cover" />
            </motion.div>
        </AnimatePresence>
    );
};
