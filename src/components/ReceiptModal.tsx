import { motion } from 'framer-motion';
import { X, Printer, CheckCircle, MapPin, Mail, Phone } from 'lucide-react';

export const ReceiptModal = ({ order, onClose }: { order: any, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white text-black w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="bg-primary p-8 text-white relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">TARZIFY</h2>
                            <p className="text-sm opacity-80">Premium Lifestyle Store</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-sm font-bold opacity-80 uppercase tracking-widest">Receipt</h3>
                            <p className="font-mono text-lg">#{order.order_number}</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8">
                    {/* Status */}
                    <div className="flex items-center gap-3 justify-center text-green-600 bg-green-50 p-4 rounded-xl">
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-bold text-lg uppercase tracking-wide">Order {order.status}</span>
                    </div>

                    {/* Customer & Shipping */}
                    <div className="grid grid-cols-2 gap-8 text-sm">
                        <div className="space-y-2">
                            <h4 className="font-bold uppercase opacity-40 text-xs tracking-widest">Billed To</h4>
                            <p className="font-bold text-lg">{order.user_email?.split('@')[0] || 'Customer'}</p>
                            <div className="flex items-center gap-2 opacity-60">
                                <Mail className="w-3 h-3" />
                                <span>{order.user_email}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-bold uppercase opacity-40 text-xs tracking-widest">Shipped To</h4>
                            <div className="flex items-start gap-2 opacity-60">
                                <MapPin className="w-3 h-3 mt-1 flex-shrink-0" />
                                <span className="leading-tight">{order.shipping_address}</span>
                            </div>
                            <div className="flex items-center gap-2 opacity-60">
                                <Phone className="w-3 h-3" />
                                <span>{order.phone}</span>
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-4">
                        <h4 className="font-bold uppercase opacity-40 text-xs tracking-widest border-b pb-2">Order Items</h4>
                        <div className="space-y-3">
                            {order.order_items?.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-400">
                                            {item.quantity}x
                                        </div>
                                        <div>
                                            <p className="font-bold">{item.products?.name || 'Product'}</p>
                                            <p className="text-xs opacity-50">{item.products?.sku}</p>
                                        </div>
                                    </div>
                                    <p className="font-mono">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm opacity-60">
                            <span>Subtotal</span>
                            <span>Rs. {(order.total_amount - 200).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm opacity-60">
                            <span>Shipping (Standard)</span>
                            <span>Rs. 200</span>
                        </div>
                        <div className="flex justify-between text-xl font-black mt-4 pt-4 border-t border-dashed">
                            <span>TOTAL PAID</span>
                            <span>Rs. {order.total_amount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-6 flex items-center justify-between border-t text-sm">
                    <div className="opacity-50">
                        <p className="font-bold">Thank you for shopping!</p>
                        <p className="text-xs">customersupport@tarzify.com</p>
                    </div>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold hover:scale-105 transition-transform">
                        <Printer className="w-4 h-4" />
                        Print Receipt
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
