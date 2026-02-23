import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../stores/useToastStore';

export const ToastContainer = () => {
    const { toasts, remove } = useToastStore();

    return (
        <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-4 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                        className={`pointer-events-auto flex items-center gap-4 p-5 rounded-3xl shadow-2xl backdrop-blur-3xl border min-w-[300px] max-w-md ${toast.type === 'success'
                                ? 'bg-green-500/10 border-green-500/20 text-green-500 shadow-green-500/10'
                                : toast.type === 'error'
                                    ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-red-500/10'
                                    : 'bg-primary/10 border-primary/20 text-primary shadow-primary/10'
                            }`}
                    >
                        <div className={`p-2 rounded-xl ${toast.type === 'success' ? 'bg-green-500/20' :
                                toast.type === 'error' ? 'bg-red-500/20' :
                                    'bg-primary/20'
                            }`}>
                            {toast.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                            {toast.type === 'error' && <AlertCircle className="w-6 h-6" />}
                            {toast.type === 'info' && <Info className="w-6 h-6" />}
                        </div>

                        <div className="flex-grow">
                            <p className="text-sm font-black italic uppercase tracking-tighter leading-none mb-1">
                                {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Notification'}
                            </p>
                            <p className="text-xs font-bold opacity-80 leading-relaxed">{toast.message}</p>
                        </div>

                        <button
                            onClick={() => remove(toast.id)}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors opacity-40 hover:opacity-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
