import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../stores/useThemeStore';
import { useEffect } from 'react';

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useThemeStore();

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-full glass hover:scale-110 transition-transform duration-200"
            aria-label="Toggle theme"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                    {theme === 'light' ? (
                        <Sun className="w-6 h-6 text-yellow-500" />
                    ) : (
                        <Moon className="w-6 h-6 text-blue-400" />
                    )}
                </motion.div>
            </AnimatePresence>
        </button>
    );
};
