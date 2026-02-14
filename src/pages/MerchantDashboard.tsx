import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, ShoppingBag, QrCode,
    CheckCircle2, Clock, Truck, Plus, Edit2, Loader2, X,
    BarChart3, Menu
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
interface ProductForm {
    id?: number;
    name: string;
    sku: string;
    price: string | number;
    stock: string | number;
    category: string;
    image_url: string;
    image_urls: string[];
    description: string;
    is_returnable: boolean;
}

export const MerchantDashboard = () => {
    const [activeTab, setActiveTab] = useState('inventory');
    const { products, loading: productsLoading, refetch: refetchProducts } = useProducts();
    const [orders, setOrders] = useState<any[]>([]);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const { user, role } = useAuthStore();
    const [uploading, setUploading] = useState(false);

    // Form State
    const [newProduct, setNewProduct] = useState<ProductForm>({
        name: '',
        sku: '',
        price: '',
        stock: '',
        category: 'Fashion',
        image_url: '',
        image_urls: [],
        description: '',
        is_returnable: true
    });
    const [editingProduct, setEditingProduct] = useState<ProductForm | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tracking State
    const [trackingData, setTrackingData] = useState({
        orderId: null as number | null,
        tracking_number: '',
        courier_name: 'TCS',
        shipping_proof_url: ''
    });

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
            console.error('Error fetching orders:', error.message);
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
            const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
            if (error) throw error;
            alert('Order status updated: ' + status.toUpperCase());
            fetchOrders();
        } catch (error: any) {
            console.error('Error updating status:', error);
            alert('Error updating status: ' + error.message);
        }
    };

    const getMerchantStats = () => {
        const stats = {
            deliveredRevenue: 0,
            pendingRevenue: 0,
            totalOrders: 0,
            shippedCount: 0
        };

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

        setUploading(true);
        const formData = new FormData();
        formData.append('images', file); // Use 'images' key as backend expects array but handles single here too

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/products/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                setTrackingData(prev => ({ ...prev, shipping_proof_url: data.imageUrls[0] }));
            } else {
                alert('Upload failed: ' + data.error);
            }
        } catch (error) {
            alert('Upload error');
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
                    courier_name: trackingData.courier_name,
                    shipping_proof_url: trackingData.shipping_proof_url
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('Tracking assigned! Status updated to Shipped.');
                setTrackingData({ orderId: null, tracking_number: '', courier_name: 'TCS', shipping_proof_url: '' });
                fetchOrders();
            }
        } catch (error) {
            alert('Error assigning tracking');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('images', file));

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/products/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                if (isEditing) {
                    setEditingProduct((prev: any) => ({
                        ...prev,
                        image_url: prev.image_url || data.imageUrls[0],
                        image_urls: [...(prev.image_urls || []), ...data.imageUrls]
                    }));
                } else {
                    setNewProduct(prev => ({
                        ...prev,
                        image_url: prev.image_url || data.imageUrls[0],
                        image_urls: [...(prev.image_urls || []), ...data.imageUrls]
                    }));
                }
            } else {
                alert('Upload failed: ' + data.error);
            }
        } catch (error) {
            alert('Upload error. Make sure backend is running.');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number, isEditing = false) => {
        if (isEditing) {
            setEditingProduct((prev: any) => {
                const currentUrls = prev.image_urls || [];
                const newUrls = currentUrls.filter((_: any, i: number) => i !== index);
                return {
                    ...prev,
                    image_urls: newUrls,
                    image_url: prev.image_url === currentUrls[index] ? newUrls[0] || '' : prev.image_url
                };
            });
        } else {
            setNewProduct(prev => {
                const currentUrls = prev.image_urls || [];
                const newUrls = currentUrls.filter((_, i) => i !== index);
                return {
                    ...prev,
                    image_urls: newUrls,
                    image_url: prev.image_url === currentUrls[index] ? newUrls[0] || '' : prev.image_url
                };
            });
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
                price: typeof newProduct.price === 'string' ? parseFloat(newProduct.price) : newProduct.price,
                stock: typeof newProduct.stock === 'string' ? parseInt(newProduct.stock) : newProduct.stock,
                category: newProduct.category,
                image_url: newProduct.image_url,
                image_urls: newProduct.image_urls,
                description: newProduct.description,
                is_returnable: newProduct.is_returnable
            });

            if (error) throw error;

            alert('Product added successfully!');
            setShowAddModal(false);
            setNewProduct({ name: '', sku: '', price: '', stock: '', category: 'Fashion', image_url: '', image_urls: [], description: '', is_returnable: true });
            refetchProducts();
        } catch (error: any) {
            alert('Error adding product: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('products')
                .update({
                    name: editingProduct.name,
                    sku: editingProduct.sku,
                    price: typeof editingProduct.price === 'string' ? parseFloat(editingProduct.price) : editingProduct.price,
                    stock: typeof editingProduct.stock === 'string' ? parseInt(editingProduct.stock) : editingProduct.stock,
                    category: editingProduct.category,
                    image_url: editingProduct.image_url,
                    image_urls: editingProduct.image_urls,
                    description: editingProduct.description,
                    is_returnable: editingProduct.is_returnable
                })
                .eq('id', editingProduct.id);

            if (error) throw error;

            alert('Product updated successfully!');
            setEditingProduct(null);
            refetchProducts();
        } catch (error: any) {
            alert('Error updating product: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (productId: number) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            // Soft Delete: Mark as deleted to preserve order history
            const { error } = await supabase
                .from('products')
                .update({ deleted_at: new Date() })
                .eq('id', productId);
            if (error) throw error;
            refetchProducts();
        } catch (error: any) {
            alert('Error deleting product: ' + error.message);
        }
    };

    const handlePrintReceipt = (order: any) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const items = order.order_items || [];
            const itemsHtml = items.map((item: any) => `
                <tr style="border-bottom: 2px solid #f0f0f0;">
                    <td style="padding: 20px 15px;">
                        <div style="font-weight: 900; font-size: 15px; text-transform: uppercase;">${item.products?.name || 'Item Name'}</div>
                        <div style="font-size: 11px; color: #666; font-weight: 700;">SKU: ${item.products?.sku || 'GEN-TRZ'}</div>
                    </td>
                    <td style="padding: 20px 15px; text-align: center;">${item.quantity}</td>
                    <td style="padding: 20px 15px; font-weight: 800;">Rs. ${Number(item.price).toLocaleString()}</td>
                    <td style="padding: 20px 15px; text-align: right; font-weight: 900;">Rs. ${(Number(item.price) * item.quantity).toLocaleString()}</td>
                </tr>
            `).join('');

            const trackUrl = `${window.location.origin}/#track-order?id=${order.order_number}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(trackUrl)}`;

            const receiptHtml = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Shipping Label - #${order.order_number || order.id}</title>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body { font-family: 'Inter', sans-serif; padding: 40px; color: #000; }
                            .container { max-width: 800px; margin: auto; border: 2px solid #000; padding: 40px; border-radius: 20px; }
                            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
                            .logo-section h1 { font-size: 40px; font-weight: 900; font-style: italic; text-transform: uppercase; }
                            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                            .info-box { padding: 24px; border-radius: 20px; }
                            .info-label { font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 10px; display: block; opacity: 0.5; }
                            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                            th { text-align: left; padding: 12px 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; border-bottom: 2px solid #000; }
                            .footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 40px; border-top: 1px solid #eee; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <div class="logo-section">
                                    <h1>TARZIFY</h1>
                                    <p>Premium Logistics & Delivery</p>
                                    <div style="background: #000; color: #fff; display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 800; margin-top: 10px;">Order #${order.order_number || order.id}</div>
                                </div>
                                <div class="qr-section">
                                    <img src="${qrUrl}" style="width: 80px; height: 80px;" alt="QR">
                                </div>
                            </div>
                            <div class="info-grid">
                                <div class="info-box" style="padding: 24px; border: 1px solid #eee; border-radius: 20px; background: #fff; color: #000;">
                                    <span class="info-label" style="color: #666;">Ship To</span>
                                    <div style="font-weight: 700;">${order.customer_name || (Array.isArray(order.profiles) ? order.profiles[0]?.full_name : order.profiles?.full_name) || 'Valued Customer'}</div>
                                    <div style="font-size: 13px; opacity: 0.6;">${order.shipping_address}</div>
                                    <div style="font-size: 13px; opacity: 0.6;">Phone: ${order.phone}</div>
                                </div>
                                <div class="info-box" style="padding: 24px; border: 2px solid #000; border-radius: 20px; background: #fff; color: #000;">
                                    <span class="info-label" style="color: #666;">Ship From</span>
                                    <div style="font-weight: 700;">TARZIFY STORE</div>
                                    <div style="font-size: 13px; opacity: 0.7;">Faisal Town, Lahore, Pakistan</div>
                                    <div style="font-size: 13px; opacity: 0.5;">Email: customersupport@tarzify.com</div>
                                </div>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th style="text-align: center;">Qty</th>
                                        <th>Price</th>
                                        <th style="text-align: right;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>${itemsHtml}</tbody>
                            </table>
                            <div class="footer">
                                <div>
                                    <div class="info-label">Payment Method</div>
                                    <div style="font-weight: 700; text-transform: uppercase;">${order.payment_method || 'COD'}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div class="info-label">Grand Total</div>
                                    <div style="font-size: 36px; font-weight: 900;">Rs. ${Number(order.total_amount).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </body>
                </html>
            `;
            printWindow.document.write(receiptHtml);
            printWindow.document.close();
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex pt-20">
            {showQR && <QRScannerPopup onScan={(sku) => { alert('Scanned SKU: ' + sku); setShowQR(false); }} onClose={() => setShowQR(false)} />}

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-background w-full max-w-2xl rounded-[3rem] p-10 border border-border shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center">
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Add New Product</h2>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-foreground/5 rounded-full"><X /></button>
                            </div>
                            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">Product Name</label>
                                    <input required type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full glass border-none rounded-2xl p-4" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">SKU</label>
                                    <input required type="text" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} className="w-full glass border-none rounded-2xl p-4" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">Category</label>
                                    <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} className="w-full glass border-none rounded-2xl p-4 bg-background">
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">Price (Rs.)</label>
                                    <input required type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="w-full glass border-none rounded-2xl p-4" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">Stock</label>
                                    <input required type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} className="w-full glass border-none rounded-2xl p-4" />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">Description</label>
                                    <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="w-full glass border-none rounded-2xl p-4 min-h-[100px]" />
                                </div>
                                <div className="col-span-2 flex items-center gap-3 p-4 bg-foreground/5 rounded-2xl">
                                    <input type="checkbox" checked={newProduct.is_returnable} onChange={e => setNewProduct({ ...newProduct, is_returnable: e.target.checked })} className="w-5 h-5 rounded-lg accent-primary" />
                                    <label className="text-sm font-black italic uppercase">Allow Returns</label>
                                </div>
                                <div className="col-span-2 space-y-4 pt-4 border-t border-foreground/5">
                                    <h3 className="text-xl font-black italic uppercase">Photos</h3>
                                    <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-foreground/10 rounded-3xl cursor-pointer hover:bg-foreground/5 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        {uploading ? <Loader2 className="w-8 h-8 animate-spin opacity-30" /> : <Plus className="w-8 h-8 opacity-30" />}
                                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                                    </label>
                                    {newProduct.image_urls.length > 0 && (
                                        <div className="grid grid-cols-5 gap-3 mt-4">
                                            {newProduct.image_urls.map((url, idx) => (
                                                <div key={idx} className="aspect-square rounded-2xl overflow-hidden relative group border border-foreground/5">
                                                    {url && <img src={url} alt="Preview" className="w-full h-full object-cover" />}
                                                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"><X className="w-3 h-3" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button type="submit" disabled={isSubmitting} className="col-span-2 py-5 bg-primary text-white rounded-3xl font-black uppercase italic italic italic italic tracking-tighter overflow-hidden relative group">
                                    {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Create Product'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Edit Modal */}
                {editingProduct && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-background w-full max-w-2xl rounded-[3rem] p-10 border border-border shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center">
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Edit Product</h2>
                                <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-foreground/5 rounded-full"><X /></button>
                            </div>
                            <form onSubmit={handleUpdateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">Product Name</label>
                                    <input required type="text" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full glass border-none rounded-2xl p-4" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">Price</label>
                                    <input required type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} className="w-full glass border-none rounded-2xl p-4" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">Stock</label>
                                    <input required type="number" value={editingProduct.stock} onChange={e => setEditingProduct({ ...editingProduct, stock: e.target.value })} className="w-full glass border-none rounded-2xl p-4" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">Category</label>
                                    <select value={editingProduct.category} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} className="w-full glass border-none rounded-2xl p-4 bg-background">
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest opacity-30">Description</label>
                                    <textarea value={editingProduct.description} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} className="w-full glass border-none rounded-2xl p-4 min-h-[80px]" />
                                </div>
                                <div className="col-span-2 flex items-center gap-3 p-4 bg-foreground/5 rounded-2xl">
                                    <input type="checkbox" checked={editingProduct.is_returnable} onChange={e => setEditingProduct({ ...editingProduct, is_returnable: e.target.checked })} className="w-5 h-5 rounded-lg accent-primary" />
                                    <label className="text-sm font-black italic uppercase">Allow Returns</label>
                                </div>
                                <div className="col-span-2 space-y-4 pt-4 border-t border-foreground/5">
                                    <h3 className="text-xl font-black italic uppercase">Photos</h3>
                                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-foreground/10 rounded-3xl cursor-pointer hover:bg-foreground/5 ${uploading ? 'opacity-50' : ''}`}>
                                        <Plus className="w-6 h-6 opacity-30" />
                                        <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" disabled={uploading} />
                                    </label>
                                    <div className="grid grid-cols-5 gap-3 mt-4">
                                        {(editingProduct.image_urls || []).map((url: string, idx: number) => (
                                            <div key={idx} className="aspect-square rounded-2xl overflow-hidden relative group border border-foreground/5">
                                                {url && <img src={url} alt="Preview" className="w-full h-full object-cover" />}
                                                <button type="button" onClick={() => removeImage(idx, true)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"><X className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" disabled={isSubmitting} className="col-span-2 py-5 bg-primary text-white rounded-3xl font-black uppercase italic tracking-tighter">
                                    {isSubmitting ? 'Updating...' : 'Update Details'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

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
            <div className={`fixed lg:relative inset-y-0 left-0 z-[110] w-72 border-r border-foreground/10 p-8 flex flex-col gap-3 bg-background transition-transform duration-500 lg:translate-x-0 ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center gap-3 mb-10 px-4">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-black tracking-tighter italic">
                        {role === 'admin' ? 'ADMIN' : 'MERCHANT'}
                    </h2>
                </div>
                {[{ id: 'inventory', label: 'Inventory', icon: Package }, { id: 'orders', label: 'Orders', icon: Truck }, { id: 'analytics', label: 'Revenue', icon: BarChart3 }].map(item => (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); }} className={`flex items-center gap-4 px-6 py-4 rounded-3xl transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-2xl hover:scale-105' : 'hover:bg-foreground/5 opacity-40 hover:opacity-100'}`}>
                        <item.icon className="w-5 h-5" />
                        <span className="font-black text-sm uppercase tracking-widest">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-grow p-6 lg:p-12 overflow-y-auto">
                <div className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowMobileMenu(true)} className="lg:hidden p-4 glass rounded-2xl">
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Dashboard</h1>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="bg-primary text-white p-4 px-8 rounded-2xl font-black italic uppercase tracking-tighter shadow-xl hover:scale-105 active:scale-95 transition-transform">Add Item</button>
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
                                        <button onClick={() => setEditingProduct({ ...product, price: product.price.toString(), stock: product.stock.toString(), description: product.description || '', image_urls: product.image_urls || [], is_returnable: !!product.is_returnable })} className="p-3 bg-foreground/5 rounded-xl hover:bg-foreground/10"><Edit2 className="w-4 h-4" /></button>
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
                                        <p className="text-xl font-black">{product.stock}</p>
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
        </div>
    );
};
