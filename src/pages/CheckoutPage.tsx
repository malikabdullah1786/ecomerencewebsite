import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CreditCard, Truck, MapPin, CheckCircle2, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useCartStore } from '../stores/useCartStore';
import { useAuthStore } from '../stores/useAuthStore';

const STEPS = ['Shipping', 'Delivery', 'Payment'];

interface ShippingRate {
    id: string;
    name: string;
    price: number;
    estimated_days: string;
}

export const CheckoutPage = ({ onBack }: { onBack: () => void }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const { items, total } = useCartStore();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
    const [ratesError, setRatesError] = useState('');
    const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        fullName: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        shippingMethod: '', // Will be set once rates load
        paymentMethod: 'fastpay'
    });

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/shipping/calculate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}) // Send basic payload for now
                });
                const data = await res.json();
                if (data.success && data.rates.length > 0) {
                    setShippingRates(data.rates);
                    // Default to first option if not set
                    setFormData(prev => ({ ...prev, shippingMethod: data.rates[0].id }));
                } else {
                    setRatesError('Failed to load shipping rates.');
                }
            } catch (error) {
                console.error('Shipping fetch error:', error);
                setRatesError('Could not fetch shipping rates. Please check your connection.');
            }
        };
        fetchRates();
    }, []);

    const selectedRate = shippingRates.find(r => r.id === formData.shippingMethod) || shippingRates[0];
    const shippingCost = selectedRate ? selectedRate.price : 0;
    const finalTotal = total + shippingCost;

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            handlePlaceOrder();
        }
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            if (!user?.id) throw new Error('User not logged in');

            // 1. Create the order in the backend
            const response = await fetch('http://localhost:5000/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    items: items.map(item => ({ id: item.id, quantity: item.quantity, price: item.price })),
                    total: finalTotal,
                    shippingAddress: `${formData.address}, ${formData.city}`,
                    phone: formData.phone,
                    paymentMethod: formData.paymentMethod
                })
            });

            const orderData = await response.json();
            if (!orderData.success) throw new Error(orderData.error || 'Order creation failed');
            setCreatedOrderId(orderData.orderId);

            // 2. Initiate Payment
            const paymentResponse = await fetch('http://localhost:5000/api/payment/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: finalTotal,
                    orderId: orderData.orderId,
                    phone: formData.phone
                })
            });

            const paymentData = await paymentResponse.json();
            if (!paymentData.success) throw new Error(paymentData.error || 'Payment initiation failed');

            // 3. Clear cart and show success (or redirect)
            setLoading(false);
            useCartStore.getState().clearCart();

            if (formData.paymentMethod === 'fastpay' && paymentData.payment_url) {
                // Redirect for FastPay
                window.location.href = paymentData.payment_url;
            } else {
                // Show success immediately for COD
                setOrderComplete(true);
            }
        } catch (err: any) {
            alert('Checkout Failed: ' + err.message);
            setLoading(false);
        }
    };

    if (orderComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-6"
                >
                    <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter">Order Confirmed!</h1>
                    <p className="opacity-50">Thank you for shopping. Your order has been placed.</p>
                    {createdOrderId && <p className="text-xl font-black text-primary">Order ID: #{createdOrderId}</p>}
                    <button
                        onClick={() => window.location.hash = ''}
                        className="bg-primary text-white font-black px-10 py-4 rounded-2xl hover:scale-105 transition-transform"
                    >
                        Return to Home
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-32 pb-24 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">

                {/* Left: Checkout Form */}
                <div className="lg:col-span-8 space-y-12">
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={onBack} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic">Checkout</h1>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center justify-between max-w-md">
                        {STEPS.map((step, i) => (
                            <div key={step} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${i <= currentStep ? 'bg-primary text-white' : 'bg-foreground/10 opacity-30'}`}>
                                    {i + 1}
                                </div>
                                <span className={`text-sm font-bold uppercase tracking-widest ${i <= currentStep ? 'opacity-100' : 'opacity-30'}`}>
                                    {step}
                                </span>
                                {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 opacity-20" />}
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {currentStep === 0 && (
                            <motion.div
                                key="step0"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-3 text-primary">
                                    <MapPin className="w-6 h-6" />
                                    <h3 className="text-xl font-black">Shipping Address</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest opacity-30">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full glass border-none rounded-2xl p-4 focus:ring-2 ring-primary/30 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest opacity-30">Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="+92 3XX XXXXXXX"
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full glass border-none rounded-2xl p-4 focus:ring-2 ring-primary/30 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest opacity-30">Address</label>
                                        <input
                                            type="text"
                                            placeholder="Street address, Apartment, etc."
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full glass border-none rounded-2xl p-4 focus:ring-2 ring-primary/30 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest opacity-30">City</label>
                                        <input
                                            type="text"
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full glass border-none rounded-2xl p-4 focus:ring-2 ring-primary/30 outline-none"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-3 text-primary">
                                    <Truck className="w-6 h-6" />
                                    <h3 className="text-xl font-black">Delivery Method</h3>
                                </div>

                                {ratesError && (
                                    <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5" />
                                        <span className="text-sm font-bold">{ratesError}</span>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {shippingRates.length === 0 && !ratesError ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        shippingRates.map(rate => (
                                            <label key={rate.id} className={`flex items-center justify-between p-6 rounded-3xl cursor-pointer transition-all border-2 ${formData.shippingMethod === rate.id ? 'bg-primary/5 border-primary shadow-lg shadow-primary/5' : 'bg-foreground/5 border-transparent opacity-60'}`}>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="radio"
                                                        name="shipping"
                                                        className="w-5 h-5 text-primary focus:ring-0 border-none bg-foreground/10"
                                                        checked={formData.shippingMethod === rate.id}
                                                        onChange={() => setFormData({ ...formData, shippingMethod: rate.id })}
                                                    />
                                                    <div>
                                                        <p className="font-black">{rate.name}</p>
                                                        <p className="text-xs opacity-50">{rate.estimated_days} Business Days</p>
                                                    </div>
                                                </div>
                                                <span className="font-black text-primary">Rs. {rate.price.toLocaleString()}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-3 text-primary">
                                    <CreditCard className="w-6 h-6" />
                                    <h3 className="text-xl font-black">Payment Method</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-4">
                                        <div
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'fastpay' })}
                                            className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'fastpay' ? 'border-primary bg-primary/5' : 'border-white/10 glass order-2 opacity-50'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm">
                                                        <span className="text-orange-500 font-black text-xl">FP</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-black">FastPay Wallet</p>
                                                        <p className="text-xs opacity-50">One-tap secure payment</p>
                                                    </div>
                                                </div>
                                                {formData.paymentMethod === 'fastpay' && <CheckCircle2 className="text-primary w-6 h-6" />}
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                                            className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-white/10 glass order-2 opacity-50'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-foreground/5 rounded-xl flex items-center justify-center p-2">
                                                        <Truck className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black">Cash on Delivery</p>
                                                        <p className="text-xs opacity-50">Pay when you receive</p>
                                                    </div>
                                                </div>
                                                {formData.paymentMethod === 'cod' && <CheckCircle2 className="text-primary w-6 h-6" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="pt-8 flex gap-4">
                        {currentStep > 0 && (
                            <button
                                onClick={() => setCurrentStep(s => s - 1)}
                                className="px-8 py-4 glass rounded-2xl font-black hover:bg-foreground/10 transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            disabled={loading || (currentStep === 1 && shippingRates.length === 0)}
                            className="flex-grow py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <>
                                    {currentStep === STEPS.length - 1 ? (formData.paymentMethod === 'fastpay' ? 'Pay Securely' : 'Place Order') : 'Continue to ' + STEPS[currentStep + 1]}
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right: Order Summary */}
                <div className="lg:col-span-4">
                    <div className="glass p-8 rounded-[2.5rem] border-white/5 sticky top-32 space-y-8 shadow-2xl">
                        <h3 className="text-xl font-black uppercase tracking-tighter">Summary</h3>

                        <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {items.map(item => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-foreground/5 flex-shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-bold text-sm truncate">{item.name}</p>
                                        <p className="text-xs opacity-50">{item.quantity} × Rs. {item.price.toLocaleString()}</p>
                                    </div>
                                    <p className="font-black text-sm whitespace-nowrap">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 border-t border-foreground/10 space-y-4">
                            <div className="flex justify-between text-sm opacity-50 font-bold">
                                <span>Subtotal</span>
                                <span>Rs. {total.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm opacity-50 font-bold">
                                <span>Shipping</span>
                                <span>Rs. {shippingCost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between pt-4 text-2xl font-black tracking-tighter border-t border-foreground/10">
                                <span className="italic">Total</span>
                                <span className="text-primary">Rs. {finalTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary text-center">Premium Courier Partners</p>
                            <div className="flex justify-center gap-4 mt-2 opacity-50 grayscale transition-all hover:grayscale-0">
                                <span className="text-[10px] font-bold">TCS</span>
                                <span className="text-[10px] font-bold">LEOPARDS</span>
                                <span className="text-[10px] font-bold">POSTEX</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
