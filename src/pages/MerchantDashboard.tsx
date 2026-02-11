import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, ShoppingBag, QrCode, Printer,
    CheckCircle2, Clock, Truck, Plus, Edit3, Loader2, X
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';

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

const CATEGORIES = ['Electronics', 'Fashion', 'Beauty', 'Home', 'Sports', 'Toys', 'Accessories'];

export const MerchantDashboard = () => {
    const [activeTab, setActiveTab] = useState('inventory');
    const { products, loading: productsLoading, refetch: refetchProducts } = useProducts();
    const [orders, setOrders] = useState<any[]>([]);
    const [showQR, setShowQR] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const { user } = useAuthStore();

    // Add Product Form State
    const [newProduct, setNewProduct] = useState({
        name: '',
        sku: '',
        price: '',
        stock: '',
        category: 'Fashion',
        image_url: '',
        is_returnable: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchMerchantOrders = async () => {
            const { data } = await supabase
                .from('orders')
                .select('*, order_items(*, products(*))')
                .order('created_at', { ascending: false });
            setOrders(data || []);
        };
        fetchMerchantOrders();
    }, []);

    // Auto-set returnable based on category
    useEffect(() => {
        if (newProduct.category === 'Beauty' || newProduct.category === 'Makeup') {
            setNewProduct(prev => ({ ...prev, is_returnable: false }));
        } else {
            setNewProduct(prev => ({ ...prev, is_returnable: true }));
        }
    }, [newProduct.category]);

    const handleUpdateStatus = async (orderId: number, status: string) => {
        const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
        if (!error) {
            setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
        }
    };

    const [uploading, setUploading] = useState(false);
    const [trackingData, setTrackingData] = useState({ orderId: null, tracking_number: '', courier_name: 'TCS' });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/products/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setNewProduct(prev => ({ ...prev, image_url: data.imageUrl }));
            } else {
                alert('Upload failed: ' + data.error);
            }
        } catch (error) {
            alert('Upload error. Make sure backend is running.');
        } finally {
            setUploading(false);
        }
    };

    const handleAssignTracking = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/assign-tracking/${trackingData.orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tracking_number: trackingData.tracking_number,
                    courier_name: trackingData.courier_name
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('Tracking assigned! Status updated to Shipped.');
                setTrackingData({ orderId: null, tracking_number: '', courier_name: 'TCS' });
                // Refresh orders
                const { data: updatedOrders } = await supabase
                    .from('orders')
                    .select('*, order_items(*, products(*))')
                    .order('created_at', { ascending: false });
                setOrders(updatedOrders || []);
            }
        } catch (error) {
            alert('Error assigning tracking');
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (!user) throw new Error('You must be logged in.');

            const { error } = await supabase.from('products').insert({
                merchant_id: user.id,
                name: newProduct.name,
                sku: newProduct.sku,
                price: parseFloat(newProduct.price),
                stock: parseInt(newProduct.stock),
                category: newProduct.category,
                image_url: newProduct.image_url,
                is_returnable: newProduct.is_returnable
            });

            if (error) throw error;

            alert('Product added successfully!');
            setShowAddModal(false);
            setNewProduct({ name: '', sku: '', price: '', stock: '', category: 'Fashion', image_url: '', is_returnable: true });
            refetchProducts();
        } catch (error: any) {
            alert('Error adding product: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrintReceipt = (order: any) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const itemsHtml = order.order_items?.map((item: any) => `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">${item.products?.name || 'Item'}</td>
                    <td style="padding: 10px;">${item.quantity}</td>
                    <td style="padding: 10px;">Rs. ${item.price}</td>
                    <td style="padding: 10px; text-align: right;">Rs. ${item.price * item.quantity}</td>
                </tr>
            `).join('') || '';

            const receiptHtml = `
                <html>
                    <head>
                        <title>Receipt #${order.id}</title>
                        <style>
                            body { font-family: 'Courier New', monospace; padding: 40px; color: #000; max-width: 800px; mx-auto; }
                            .header { text-align: center; margin-bottom: 40px; }
                            .logo { font-size: 30px; font-weight: bold; letter-spacing: -2px; }
                            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
                            .box { border: 2px solid #000; padding: 20px; margin-bottom: 30px; }
                            table { w-full; border-collapse: collapse; width: 100%; }
                            th { text-align: left; padding: 10px; border-bottom: 2px solid #000; }
                            .total { text-align: right; font-size: 24px; font-weight: bold; margin-top: 20px; }
                            .footer { text-align: center; margin-top: 50px; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <div class="logo">ALL-IN-ONE STORE</div>
                            <p>Official Receipt</p>
                        </div>

                        <div class="meta">
                            <div>
                                <strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}<br>
                                <strong>Order ID:</strong> #ONE-${order.id}
                            </div>
                            <div style="text-align: right;">
                                <strong>Customer:</strong><br>
                                ${order.phone}
                            </div>
                        </div>

                        <div class="box">
                            <strong>Shipping Address:</strong><br>
                            ${order.shipping_address}
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th style="text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>

                        <div class="total">
                            Total: Rs. ${Number(order.total_amount).toLocaleString()}
                        </div>

                        <div class="footer">
                            <p>Thank you for shopping with us!</p>
                            <p>For support, contact admin@allinone.com</p>
                            <p>*** GENERATED BY MERCHANT PANEL ***</p>
                        </div>
                    </body>
                </html>
            `;
            printWindow.document.write(receiptHtml);
            printWindow.document.close();
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex pt-20 transition-colors duration-300">
            {showQR && <QRScannerPopup onScan={(sku) => { alert('Scanned SKU: ' + sku); setShowQR(false); }} onClose={() => setShowQR(false)} />}

            {/* Add Product Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-background w-full max-w-2xl rounded-[3rem] p-10 border border-border shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Add New Product</h2>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-foreground/5 rounded-full"><X /></button>
                            </div>

                            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">Product Name</label>
                                    <input required type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full glass border-none rounded-2xl p-4 outline-none focus:ring-2 ring-primary/30" placeholder="e.g. Wireless Headphones" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">SKU</label>
                                    <input required type="text" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} className="w-full glass border-none rounded-2xl p-4 outline-none focus:ring-2 ring-primary/30" placeholder="e.g. HEAD-001" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">Category</label>
                                    <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} className="w-full glass border-none rounded-2xl p-4 outline-none focus:ring-2 ring-primary/30 bg-background">
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">Price (Rs.)</label>
                                    <input required type="number" min="0" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="w-full glass border-none rounded-2xl p-4 outline-none focus:ring-2 ring-primary/30" placeholder="0.00" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">Initial Stock</label>
                                    <input required type="number" min="0" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} className="w-full glass border-none rounded-2xl p-4 outline-none focus:ring-2 ring-primary/30" placeholder="0" />
                                </div>

                                <div className="col-span-2 space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">Product Image</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold opacity-50">Upload File (Cloudinary)</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-primary file:text-white hover:file:bg-primary/80 cursor-pointer"
                                            />
                                            {uploading && <p className="text-[10px] text-primary animate-pulse">Uploading to Cloudinary...</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold opacity-50">Or Paste Image URL</p>
                                            <input type="url" value={newProduct.image_url} onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })} className="w-full glass border-none rounded-xl p-3 text-sm outline-none focus:ring-2 ring-primary/30" placeholder="https://..." />
                                        </div>
                                    </div>
                                    {newProduct.image_url && (
                                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/20">
                                            <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>

                                <div className="col-span-2 flex items-center gap-4 p-4 glass rounded-2xl">
                                    <input
                                        type="checkbox"
                                        checked={newProduct.is_returnable}
                                        onChange={e => setNewProduct({ ...newProduct, is_returnable: e.target.checked })}
                                        className="w-6 h-6 text-primary rounded-xl focus:ring-0"
                                    />
                                    <div>
                                        <p className="font-bold">Accept Returns</p>
                                        <p className="text-xs opacity-50">Allow customers to return this item within 7 days.</p>
                                    </div>
                                </div>

                                <div className="col-span-2 pt-4">
                                    <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-primary text-white rounded-3xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : <><Plus className="w-5 h-5" /> Create Product Listing</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <div className="w-72 border-r border-foreground/10 p-8 flex flex-col gap-3">
                <div className="flex items-center gap-3 mb-10 px-4">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-black tracking-tighter italic">MERCHANT</h2>
                </div>

                {[
                    { id: 'inventory', label: 'My Products', icon: Package },
                    { id: 'orders', label: 'Order Pipeline', icon: Truck },
                    { id: 'analytics', label: 'Revenue', icon: Clock },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center gap-4 px-6 py-4 rounded-3xl transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-2xl shadow-primary/20' : 'hover:bg-foreground/5 opacity-40'}`}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-black text-sm uppercase tracking-widest">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-grow p-12 overflow-y-auto bg-background/50">
                <div className="flex items-center justify-between mb-16">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter italic uppercase">Merchant Dashboard</h1>
                        <p className="opacity-50 mt-2 font-medium">Real-time Logistics</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setShowQR(true)} className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 p-4 rounded-2xl hover:bg-foreground/10 transition-all text-xs font-black uppercase tracking-widest">
                            <QrCode className="w-5 h-5" />
                            Scan QR
                        </button>
                        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-primary text-white p-4 px-8 rounded-2xl hover:scale-105 transition-all text-sm font-black italic shadow-xl shadow-primary/20">
                            <Plus className="w-5 h-5" />
                            Add Item
                        </button>
                    </div>
                </div>

                {activeTab === 'inventory' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {productsLoading ? (
                                [1, 2, 3].map(i => <div key={i} className="h-64 bg-foreground/5 animate-pulse rounded-[3rem]" />)
                            ) : products.map(product => (
                                <div key={product.id} className="bg-card text-card-foreground p-8 rounded-[3rem] border border-border space-y-6 relative group overflow-hidden hover:border-primary/50 transition-colors shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl bg-muted">
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-3 bg-foreground/5 rounded-xl hover:bg-foreground/10 transition-colors"><Edit3 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black italic truncate">{product.name}</h3>
                                        <p className="text-xs font-black text-primary mt-1">SKU: {product.sku || 'N/A'}</p>
                                        <div className="mt-2 flex gap-2">
                                            <span className="px-3 py-1 bg-foreground/5 rounded-lg text-[10px] font-bold uppercase">{product.category}</span>
                                            {(product as any).is_returnable && <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-lg text-[10px] font-bold uppercase">Returnable</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-end justify-between pt-4 border-t border-border">
                                        <div>
                                            <p className="text-[10px] font-black uppercase opacity-30 leading-none mb-1">Stock</p>
                                            <p className="text-xl font-black">{product.stock}</p>
                                        </div>
                                        <p className="text-2xl font-black text-primary tracking-tighter">Rs. {product.price.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'orders' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {orders.map(order => (
                            <div key={order.id} className="bg-card text-card-foreground p-8 rounded-[3rem] border border-border flex flex-wrap lg:flex-nowrap items-center gap-10 shadow-lg relative overflow-hidden group hover:border-primary/50 transition-colors">
                                <div className="absolute top-0 right-0 p-8 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handlePrintReceipt(order)}
                                        className="flex items-center gap-2 p-4 bg-primary/20 text-primary rounded-2xl hover:bg-primary hover:text-white transition-all font-bold text-xs"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Print Receipt
                                    </button>
                                </div>

                                <div className="flex-shrink-0 space-y-2">
                                    <div className="w-16 h-16 bg-primary/20 text-primary rounded-3xl flex items-center justify-center">
                                        <Package className="w-8 h-8" />
                                    </div>
                                    <p className="text-xs font-black uppercase opacity-30 text-center">#ONE-{order.id}</p>
                                </div>

                                <div className="flex-grow space-y-1">
                                    <h4 className="text-xl font-black italic">{order.phone}</h4>
                                    <p className="text-sm opacity-50 font-medium truncate max-w-xs">{order.shipping_address}</p>
                                    <p className="text-lg font-black text-primary">Rs. {Number(order.total_amount).toLocaleString()}</p>
                                </div>

                                {order.status !== 'delivered' && (
                                    <button
                                        onClick={() => setTrackingData({ ...trackingData, orderId: order.id })}
                                        className="p-4 bg-orange-500/10 text-orange-500 rounded-2xl hover:bg-orange-500 hover:text-white transition-all font-bold text-xs flex items-center gap-2"
                                    >
                                        <Truck className="w-4 h-4" />
                                        Assign tracking
                                    </button>
                                )}

                                {[
                                    { id: 'pending', icon: Clock, label: 'Pending' },
                                    { id: 'shipped', icon: Truck, label: 'Ship' },
                                    { id: 'delivered', icon: CheckCircle2, label: 'Done' }
                                ].map(status => (
                                    <button
                                        key={status.id}
                                        onClick={() => handleUpdateStatus(order.id, status.id)}
                                        className={`flex items-center gap-2 p-4 px-6 rounded-2xl transition-all ${order.status === status.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-foreground/5 opacity-40 hover:opacity-100'}`}
                                    >
                                        <status.icon className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
                                    </button>
                                ))}
                            </div>
                            </div>
                ))}

                {/* Assign Tracking Popup */}
                <AnimatePresence>
                    {trackingData.orderId && (
                        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-background w-full max-w-md rounded-[3rem] p-10 border border-border shadow-2xl space-y-6">
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Assign Tracking</h3>
                                <form onSubmit={handleAssignTracking} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest opacity-30">Courier Partner</label>
                                        <select value={trackingData.courier_name} onChange={e => setTrackingData({ ...trackingData, courier_name: e.target.value })} className="w-full glass border-none rounded-2xl p-4 bg-background">
                                            <option value="TCS">TCS</option>
                                            <option value="Leopards">Leopards</option>
                                            <option value="PostEx">PostEx</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest opacity-30">Tracking Number</label>
                                        <input required type="text" value={trackingData.tracking_number} onChange={e => setTrackingData({ ...trackingData, tracking_number: e.target.value })} className="w-full glass border-none rounded-2xl p-4" placeholder="e.g. 123456789" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <button type="submit" className="py-4 bg-primary text-white rounded-2xl font-black">SAVE</button>
                                        <button type="button" onClick={() => setTrackingData({ orderId: null, tracking_number: '', courier_name: 'TCS' })} className="py-4 bg-foreground/5 rounded-2xl font-black">CANCEL</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
                )}
        </div>
        </div >
    );
};
