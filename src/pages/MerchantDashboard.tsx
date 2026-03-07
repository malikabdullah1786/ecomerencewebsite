import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Truck, BarChart3, Plus, X, Edit2,
    ShoppingBag, Menu,
    Loader2,
    Clock, CheckCircle2, QrCode
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { useToastStore } from '../stores/useToastStore';
import { ReceiptModal } from '../components/ReceiptModal';
import { fetchWithTimeout } from '../lib/fetchWithTimeout';
import { ProductForm as UnifiedProductForm } from '../components/ProductForm';

declare global {
    interface Window {
        cloudinary: any;
    }
}

// Mock QR Scanner
const QRScannerPopup = ({ onScan, onClose }: { onScan: (data: string) => void, onClose: () => void }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
        <div className="bg-background w-full max-w-md rounded-[3rem] p-10 border border-border shadow-2xl space-y-8 text-center text-foreground">
            <div className="relative w-48 h-48 mx-auto">
                <QrCode className="w-full h-full text-primary animate-pulse" />
                <div className="absolute inset-0 border-4 border-primary border-dashed rounded-3xl animate-spin-slow opacity-20" />
            </div>
            <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Ready to Scan</h3>
                <p className="opacity-50 text-sm font-medium mt-2">Align the product QR code within the frame.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => onScan('SCAN-SKU-8273')} className="py-4 bg-primary text-white rounded-2xl font-black text-sm hover:scale-105 transition-transform">Simulate Scan</button>
                <button onClick={onClose} className="py-4 bg-foreground/5 rounded-2xl font-black text-sm hover:bg-foreground/10">Cancel</button>
            </div>
        </div>
    </div>
);


// Unified Product Form is robustly typed in its own file.
export const MerchantDashboard = () => {
    const [activeTab, setActiveTab] = useState('inventory');
    const { products, loading: productsLoading, refetch: refetchProducts } = useProducts();
    const [orders, setOrders] = useState<any[]>([]);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const { user, role } = useAuthStore();
    const [uploading, setUploading] = useState(false);
    const toast = useToastStore();
    const [trackingData, setTrackingData] = useState({
        orderId: null as number | null,
        tracking_number: '',
        courier_name: 'TCS',
        shipping_proof_url: ''
    });

    const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<any | null>(null);

    // Carts State
    const [carts, setCarts] = useState<any[]>([]);
    const [cartsLoading, setCartsLoading] = useState(false);

    const fetchCarts = async () => {
        if (!user) return;
        setCartsLoading(true);
        try {
            // Fetch cart items for products belonging to this merchant
            const { data, error } = await supabase
                .from('cart_items')
                .select('*, products!inner(*), user:profiles!user_id(id, full_name, email)')
                .eq('products.merchant_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            if (data) {
                // Group items by user
                const grouped = data.reduce((acc: any, item: any) => {
                    const userId = item.user_id;
                    if (!acc[userId]) {
                        acc[userId] = {
                            user: item.user,
                            items: [],
                            total: 0,
                            lastUpdated: new Date(item.updated_at)
                        };
                    }
                    acc[userId].items.push(item);
                    acc[userId].total += item.products.price * item.quantity;

                    // Keep track of the latest update in this user's cart
                    const itemDate = new Date(item.updated_at);
                    if (itemDate > acc[userId].lastUpdated) {
                        acc[userId].lastUpdated = itemDate;
                    }
                    return acc;
                }, {});

                setCarts(Object.values(grouped));
            }
        } catch (err: any) {
            console.error('Error fetching carts:', err);
            toast.show('Failed to fetch carts: ' + err.message, 'error');
        } finally {
            setCartsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'carts') fetchCarts();
    }, [activeTab]);

    const fetchOrders = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                user:user_id(full_name),
                order_items(*, products(*))
            `)
            .order('created_at', { ascending: false });

        if (error) {
            toast.show('Failed to fetch orders: ' + error.message, 'error');
            return;
        }
        // Map the user data to profiles for backward compatibility
        const ordersWithProfiles = data?.map(order => ({
            ...order,
            profiles: order.user
        })) || [];
        setOrders(ordersWithProfiles);
    };

    useEffect(() => {
        fetchOrders();
    }, [user]);

    const handleUpdateStatus = async (orderId: number, status: string) => {
        try {
            const res = await fetchWithTimeout(`${import.meta.env.VITE_API_URL}/orders/status/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                toast.show(`Order status updated: ${status.toUpperCase()}`, 'success');
                fetchOrders();
            } else {
                toast.show('Error updating status: ' + data.error, 'error');
            }
        } catch (error: any) {
            console.error('Error updating status:', error);
            toast.show('Error updating status: ' + error.message, 'error');
        }
    };

    const getMerchantStats = () => {
        const stats = {
            deliveredRevenue: 0,
            pendingRevenue: 0,
            totalOrders: 0,
            shippedCount: 0
        };

        // TODO: Project Checklist
        // - [x] Planning Admin and Mobile Enhancements
        // - [/] Implement Dynamic Category System (DB + Hooks)
        // - [ ] Align Admin Dashboard Inventory UI with Merchant Dashboard
        // - [ ] Mobile Responsiveness Audit & Polish (Site-wide)

        const isAdmin = role === 'admin';

        orders.forEach(order => {
            // If admin, we count everything. If merchant, we only count their items.
            const mItems = isAdmin
                ? (order.order_items || [])
                : (order.order_items?.filter((oi: any) => oi.products?.merchant_id === user?.id) || []);

            const mTotal = mItems.reduce((sum: number, oi: any) => sum + (Number(oi.price || 0) * (oi.quantity || 1)), 0);

            if (mItems.length > 0) {
                if (isAdmin) {
                    stats.totalOrders++;
                    stats.deliveredRevenue += order.status === 'delivered' ? Number(order.total_amount || 0) : 0;
                    stats.pendingRevenue += order.status !== 'delivered' ? Number(order.total_amount || 0) : 0;
                    if (order.status === 'shipped') stats.shippedCount++;
                } else {
                    stats.totalOrders++;
                    stats.deliveredRevenue += order.status === 'delivered' ? mTotal : 0;
                    stats.pendingRevenue += order.status !== 'delivered' ? mTotal : 0;
                    if (order.status === 'shipped') stats.shippedCount++;
                }
            }
        });
        return stats;
    };

    const filteredProducts = role === 'admin'
        ? products
        : products.filter(p => p.merchant_id === user?.id);

    const filteredOrders = role === 'admin'
        ? orders
        : orders.filter(order =>
            order.order_items?.some((oi: any) => oi.products?.merchant_id === user?.id)
        );

    const handleShippingProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Backend expects base64 strings in JSON, not FormData
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = reader.result as string;
            setUploading(true);

            try {
                const res = await fetchWithTimeout(`${import.meta.env.VITE_API_URL}/products/upload`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        images: [base64] // Wrap in array as expected by API
                    })
                }, 30000); // 30s for file uploads

                const data = await res.json();

                if (data.success) {
                    setTrackingData(prev => ({ ...prev, shipping_proof_url: data.imageUrls[0] }));
                    toast.show('Shipping proof uploaded successfully!', 'success');
                } else {
                    toast.show('Upload failed: ' + data.error, 'error');
                }
            } catch (error: any) {
                toast.show('Upload error: ' + error.message, 'error');
            } finally {
                setUploading(false);
            }
        };
        reader.onerror = () => {
            toast.show('Error reading file', 'error');
        };
    };

    const handleAssignTracking = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetchWithTimeout(`${import.meta.env.VITE_API_URL}/orders/assign-tracking/${trackingData.orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tracking_number: trackingData.tracking_number,
                    courier_name: trackingData.courier_name,
                    shipping_proof_url: trackingData.shipping_proof_url
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.show('Tracking assigned! Status updated to Shipped.', 'success');
                setTrackingData({ orderId: null, tracking_number: '', courier_name: 'TCS', shipping_proof_url: '' });
                fetchOrders();
            } else {
                toast.show('Error assigning tracking: ' + data.error, 'error');
            }
        } catch (error: any) {
            toast.show('Error assigning tracking: ' + error.message, 'error');
        }
    };
    const handleDeleteProduct = async (id: number) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            // Soft Delete: Mark as deleted to preserve order history
            const { error } = await supabase
                .from('products')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
            toast.show('Product deleted.', 'success');
            refetchProducts();
        } catch (error: any) {
            toast.show('Error deleting product: ' + error.message, 'error');
        }
    };

    const handlePrintReceipt = (order: any) => {
        setSelectedOrderForReceipt(order);
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex pt-20">
            {showQR && <QRScannerPopup onScan={(sku) => { useToastStore.getState().show('Scanned SKU: ' + sku, 'success'); setShowQR(false); }} onClose={() => setShowQR(false)} />}

            <AnimatePresence>
                {/* Tracking Modal */}
                {trackingData.orderId && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-background w-full max-w-lg rounded-[3rem] p-10 border border-border shadow-2xl space-y-8">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Assign Tracking</h2>
                                <button onClick={() => setTrackingData({ ...trackingData, orderId: null })} className="p-2 hover:bg-foreground/5 rounded-full"><X /></button>
                            </div>
                            <form onSubmit={handleAssignTracking} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase opacity-30">Courier Service</label>
                                    <select value={trackingData.courier_name} onChange={e => setTrackingData({ ...trackingData, courier_name: e.target.value })} className="w-full glass border-none rounded-2xl p-4 bg-background">
                                        {['TCS', 'Leopard', 'BlueEx', 'M&P', 'PostEx', 'Trax'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase opacity-30">Tracking Number / CN</label>
                                    <input required type="text" value={trackingData.tracking_number} onChange={e => setTrackingData({ ...trackingData, tracking_number: e.target.value })} className="w-full glass border-none rounded-2xl p-4" placeholder="Enter tracking number..." />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-black italic uppercase">Shipping Proof (Photo)</h3>
                                    <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-foreground/10 rounded-3xl cursor-pointer hover:bg-foreground/5 ${uploading ? 'opacity-50' : ''}`}>
                                        {uploading ? <Loader2 className="w-8 h-8 animate-spin opacity-30" /> : trackingData.shipping_proof_url ? <img src={trackingData.shipping_proof_url} alt="Proof" className="w-full h-full object-cover rounded-3xl" /> : <Plus className="w-8 h-8 opacity-30" />}
                                        <input type="file" accept="image/*" onChange={handleShippingProofUpload} className="hidden" disabled={uploading} />
                                    </label>
                                </div>
                                <button type="submit" disabled={!trackingData.tracking_number} className="w-full py-5 bg-primary text-white rounded-3xl font-black uppercase italic tracking-tighter disabled:opacity-30">Confirm Shipment</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-[110] w-72 border-r border-foreground/10 p-8 flex flex-col gap-3 bg-background transition-transform duration-500 lg:translate-x-0 ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center gap-3 mb-10 px-4">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-black tracking-tighter italic">
                        {role === 'admin' ? 'ADMIN' : 'MERCHANT'}
                    </h2>
                </div>
                {[
                    { id: 'inventory', label: 'Inventory', icon: Package },
                    { id: 'orders', label: 'Orders', icon: Truck },
                    { id: 'carts', label: 'Customer Carts', icon: ShoppingBag },
                    { id: 'analytics', label: 'Revenue', icon: BarChart3 }
                ].map(item => (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); }} className={`flex items-center gap-4 px-6 py-4 rounded-3xl transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-2xl hover:scale-105' : 'hover:bg-foreground/5 opacity-40 hover:opacity-100'}`}>
                        <item.icon className="w-5 h-5" />
                        <span className="font-black text-sm uppercase tracking-widest">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-grow p-4 md:p-8 lg:p-12 overflow-y-auto w-full lg:ml-72">
                <div className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowMobileMenu(true)} className="lg:hidden p-4 glass rounded-2xl">
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                            {activeTab === 'add-product' ? 'Add Item' : activeTab === 'edit-product' ? 'Edit Item' : 'Dashboard'}
                        </h1>
                    </div>
                    {activeTab === 'inventory' && (
                        <button onClick={() => setActiveTab('add-product')} className="bg-primary text-white p-4 px-8 rounded-2xl font-black italic uppercase tracking-tighter shadow-xl hover:scale-105 active:scale-95 transition-transform">Add Item</button>
                    )}
                </div>

                {activeTab === 'inventory' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {productsLoading ? [1, 2, 3].map(i => <div key={i} className="h-64 bg-foreground/5 animate-pulse rounded-[3rem]" />) : filteredProducts.map(product => (
                            <div key={product.id} className="bg-card p-8 rounded-[3rem] border border-border space-y-6 group relative hover:shadow-2xl transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="w-24 h-24 rounded-3xl overflow-hidden bg-foreground/5">
                                        {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full opacity-20">No Image</div>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => {
                                            setActiveTab(`edit-product-${product.id}`);
                                        }} className="p-3 bg-foreground/5 rounded-xl hover:bg-foreground/10"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteProduct(product.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white"><X className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase opacity-30 mb-1">{product.category}</p>
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter">{product.name}</h3>
                                </div>
                                <div className="flex justify-between pt-4 border-t border-foreground/5">
                                    <div>
                                        <p className="text-xs font-black uppercase opacity-30">Stock</p>
                                        <p className={`text-xl font-black ${product.stock < 0 ? 'text-red-500' : ''}`}>
                                            {product.stock}
                                            {product.stock < 0 && <span className="text-[10px] ml-2 uppercase font-black tracking-tighter">(Error)</span>}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black uppercase opacity-30">Price</p>
                                        <p className="text-2xl font-black text-primary">Rs. {product.price.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'add-product' && (
                    <div className="max-w-4xl mx-auto">
                        <UnifiedProductForm
                            onClose={() => setActiveTab('inventory')}
                            onSuccess={() => {
                                setActiveTab('inventory');
                                refetchProducts();
                            }}
                        />
                    </div>
                )}

                {activeTab.startsWith('edit-product-') && (
                    <div className="max-w-4xl mx-auto">
                        {(() => {
                            const productId = parseInt(activeTab.split('-')[2]);
                            return (
                                <UnifiedProductForm
                                    productId={productId}
                                    onClose={() => setActiveTab('inventory')}
                                    onSuccess={() => {
                                        setActiveTab('inventory');
                                        refetchProducts();
                                    }}
                                />
                            );
                        })()}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        {filteredOrders.length === 0 ? <div className="text-center py-20 opacity-30 font-black uppercase tracking-widest italic">No orders found</div> : filteredOrders.map(order => (
                            <div key={order.id} className="bg-card p-8 rounded-[3rem] border border-border flex flex-col md:flex-row items-center gap-10 shadow-lg group">
                                <div className="flex-shrink-0 w-16 h-16 bg-primary/20 text-primary rounded-3xl flex items-center justify-center"><Package className="w-8 h-8" /></div>
                                <div className="flex-grow">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-xl font-black italic uppercase tracking-tighter">{order.customer_name || order.profiles?.full_name || 'Valued Customer'}</h4>
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full">{order.status}</span>
                                    </div>
                                    <p className="text-sm opacity-50 font-medium">#{order.order_number || order.id} • {new Date(order.created_at).toLocaleDateString()}</p>
                                    <div className="mt-2 space-y-1.5">
                                        {order.order_items?.map((item: any, i: number) => {
                                            const combo = item.variant_combo || item.combination || {};
                                            const variants = Object.entries(combo).length > 0
                                                ? Object.entries(combo).map(([k, v]) => `${k}: ${v}`).join(', ')
                                                : null;
                                            return (
                                                <div key={i} className="flex flex-col">
                                                    <div className="text-sm font-black opacity-80 flex items-center gap-2">
                                                        <span className="w-5 h-5 flex items-center justify-center bg-foreground/5 rounded-md text-[10px]">{item.quantity}x</span>
                                                        {item.name || item.products?.name}
                                                    </div>
                                                    {variants && (
                                                        <div className="ml-7 text-[10px] font-black uppercase text-primary tracking-wider mt-0.5">
                                                            {variants}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-lg font-black text-primary mt-2">Rs. {Number(order.total_amount).toLocaleString()}</p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => handlePrintReceipt(order)} className="p-4 bg-primary text-white rounded-2xl font-black text-xs uppercase italic tracking-widest hover:scale-105 active:scale-95 transition-transform">Print</button>
                                    <button onClick={() => setTrackingData({ ...trackingData, orderId: order.id })} className="p-4 bg-foreground/5 text-foreground rounded-2xl font-black text-xs uppercase italic tracking-widest border border-foreground/10 hover:bg-foreground/10 transition-colors">Tracking</button>
                                    <div className="flex gap-2 bg-foreground/5 p-2 rounded-[2rem]">
                                        {[
                                            { id: 'pending', icon: Clock, color: 'bg-amber-500' },
                                            { id: 'shipped', icon: Truck, color: 'bg-blue-500' },
                                            { id: 'delivered', icon: CheckCircle2, color: 'bg-green-500' }
                                        ].map(s => {
                                            const Icon = s.icon;
                                            const isActive = order.status === s.id;
                                            return (
                                                <button
                                                    key={s.id}
                                                    onClick={() => handleUpdateStatus(order.id, s.id)}
                                                    className={`group relative flex items-center gap-2 p-3 px-6 rounded-2xl transition-all ${isActive ? `${s.color} text-white shadow-lg` : 'hover:bg-foreground/10 opacity-40 hover:opacity-100'}`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'block' : 'hidden group-hover:block'}`}>{s.id}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'carts' && (
                    <div className="space-y-6">
                        {cartsLoading ? (
                            [1, 2].map(i => <div key={i} className="h-48 bg-foreground/5 animate-pulse rounded-[3rem]" />)
                        ) : carts.length === 0 ? (
                            <div className="text-center py-20 bg-card rounded-[3rem] border border-border">
                                <ShoppingBag className="w-16 h-16 opacity-10 mx-auto mb-4" />
                                <h3 className="text-xl font-black opacity-30 uppercase tracking-widest italic">No customer carts found</h3>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {carts.map((cart, idx) => {
                                    const timeDiff = new Date().getTime() - cart.lastUpdated.getTime();
                                    const isAbandoned = timeDiff > 10 * 60 * 1000; // 10 minutes

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`bg-card p-10 rounded-[3rem] border-2 transition-all ${isAbandoned ? 'border-amber-500/20 shadow-amber-500/5' : 'border-border'}`}
                                        >
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center font-black text-xl text-primary">
                                                        {cart.user?.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black italic uppercase tracking-tighter">{cart.user?.full_name || 'Anonymous Customer'}</h4>
                                                        <p className="text-[10px] text-primary font-black uppercase tracking-widest">{cart.user?.email || 'No Email'}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Clock className="w-3 h-3 opacity-30" />
                                                            <p className="text-[10px] font-black uppercase opacity-30 tracking-widest">
                                                                Active {new Date(cart.lastUpdated).toLocaleTimeString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {isAbandoned && (
                                                    <div className="flex flex-col items-end">
                                                        <span className="px-4 py-1.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse">
                                                            Abandoned
                                                        </span>
                                                        <p className="text-[8px] font-bold opacity-40 uppercase mt-1">{" > "} 10 mins inactive</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-3 bg-foreground/[0.02] p-6 rounded-[2rem] border border-foreground/5 mb-6">
                                                {cart.items.map((item: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-foreground/5 flex-shrink-0">
                                                                {item.products.image_url
                                                                    ? <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-cover" />
                                                                    : <span className="flex items-center justify-center h-full text-[10px] opacity-20">No Img</span>}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold opacity-60">{item.products.name}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-black bg-foreground/5 px-2 py-0.5 rounded-full">{item.quantity}x</span>
                                                                    {item.variant_combo && Object.entries(item.variant_combo).length > 0 && (
                                                                        <span className="text-[10px] text-primary font-bold uppercase">
                                                                            {Object.entries(item.variant_combo).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs font-black">Rs. {(item.products.price * item.quantity).toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-between items-center px-4">
                                                <div className="flex flex-col">
                                                    <label className="text-[8px] font-black uppercase tracking-widest opacity-30">Your Share</label>
                                                    <p className="text-2xl font-black italic text-primary">Rs. {cart.total.toLocaleString()}</p>
                                                </div>
                                                <div className="h-10 w-px bg-foreground/5" />
                                                <div className="flex flex-col items-end">
                                                    <label className="text-[8px] font-black uppercase tracking-widest opacity-30">Status</label>
                                                    <p className={`text-xs font-black uppercase italic ${isAbandoned ? 'text-amber-500' : 'text-green-500'}`}>
                                                        {isAbandoned ? 'Incomplete' : 'Active'}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Sales', value: `Rs. ${getMerchantStats().deliveredRevenue.toLocaleString()}`, sub: 'Completed Revenue', icon: CheckCircle2, color: 'text-green-500' },
                                { label: 'Pending Payment', value: `Rs. ${getMerchantStats().pendingRevenue.toLocaleString()}`, sub: 'Orders in Pipeline', icon: Clock, color: 'text-amber-500' },
                                { label: 'Active Orders', value: getMerchantStats().totalOrders - (orders.filter(o => o.status === 'delivered').length), sub: 'Currently Processing', icon: Package, color: 'text-primary' },
                                { label: 'Success Rate', value: '100%', sub: 'Customer Satisfaction', icon: BarChart3, color: 'text-blue-500' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-card p-8 rounded-[3rem] border border-border shadow-lg space-y-4">
                                    <div className={`w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center ${stat.color}`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase opacity-30 tracking-widest">{stat.label}</p>
                                        <p className="text-3xl font-black italic tracking-tighter">{stat.value}</p>
                                        <p className="text-xs opacity-50 mt-1">{stat.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-card p-10 rounded-[3rem] border border-border shadow-lg">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8">Business Insights</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="p-8 rounded-[2rem] bg-foreground/5 border border-foreground/5">
                                    <h4 className="font-black uppercase tracking-widest text-xs opacity-50 mb-4">Store Performance</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold opacity-60">Delivered Orders</span>
                                            <span className="font-black text-green-500">{orders.filter(o => o.status === 'delivered').length}</span>
                                        </div>
                                        <div className="h-2 w-full bg-foreground/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${(orders.filter(o => o.status === 'delivered').length / (orders.length || 1)) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 rounded-[2rem] bg-foreground/5 border border-foreground/5">
                                    <h4 className="font-black uppercase tracking-widest text-xs opacity-50 mb-4">Logistics Summary</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold opacity-60">Handed to Courier</span>
                                            <span className="font-black text-blue-500">{orders.filter(o => o.status === 'shipped').length}</span>
                                        </div>
                                        <div className="h-2 w-full bg-foreground/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(orders.filter(o => o.status === 'shipped').length / (orders.length || 1)) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {selectedOrderForReceipt && (
                <ReceiptModal order={selectedOrderForReceipt} onClose={() => setSelectedOrderForReceipt(null)} />
            )}
        </div>
    );
};
