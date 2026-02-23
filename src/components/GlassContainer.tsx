import { type ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GlassContainerProps {
    children: ReactNode;
    className?: string;
    animate?: boolean;
}

import { motion } from 'framer-motion';

export const GlassContainer = ({ children, className, animate = true }: GlassContainerProps) => {
    const Component = animate ? motion.div : 'div';

    return (
        <Component
            initial={animate ? { opacity: 0, y: 20 } : undefined}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            className={cn(
                "glass rounded-2xl p-6 shadow-xl",
                className
            )}
        >
            {children}
        </Component>
    );
};
