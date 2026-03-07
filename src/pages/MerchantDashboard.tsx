import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Truck, BarChart3, Plus, X, Edit2,
    ShoppingBag, Menu,
    Loader2,
    Clock, CheckCircle2, QrCode, Link
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { useToastStore } from '../stores/useToastStore';
import { ReceiptModal } from '../components/ReceiptModal';
import { fetchWithTimeout } from '../lib/fetchWithTimeout';

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

import { useCategories } from '../hooks/useCategories';

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
    compare_at_price?: string | number;
    // SEO
    seo_title?: string;
    meta_description?: string;
    slug?: string;
    alt_text?: string;
    tags?: string; // stored as comma-separated string in the form
}

export const MerchantDashboard = () => {
    const [activeTab, setActiveTab] = useState('inventory');
    const { products, loading: productsLoading, refetch: refetchProducts } = useProducts();
    const { categories } = useCategories();
    const [orders, setOrders] = useState<any[]>([]);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const { user, role } = useAuthStore();
    const [uploading, setUploading] = useState(false);
    const toast = useToastStore();

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
        is_returnable: true,
        compare_at_price: '',
        seo_title: '',
        meta_description: '',
        slug: '',
        alt_text: '',
        tags: '',
    });

    // Auto-fill SEO fields when merchant types the product name
    const handleNameChange = (name: string, isEditing = false) => {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const seoTitle = name ? `Buy ${name} Online in Pakistan | Tarzify` : '';
        const altText = name ? `${name} - Buy Online at Tarzify Pakistan` : '';
        const autoTags = name ? `${name.toLowerCase()}, buy online pakistan, tarzify, ${newProduct.category?.toLowerCase() || ''}` : '';
        if (isEditing) {
            setEditingProduct(prev => prev ? ({
                ...prev,
                name,
                slug: prev.slug || slug,
                seo_title: prev.seo_title || seoTitle,
                alt_text: prev.alt_text || altText,
            }) : null);
        } else {
            setNewProduct(prev => ({
                ...prev,
                name,
                slug: prev.slug || slug,
                seo_title: prev.seo_title || seoTitle,
                alt_text: prev.alt_text || altText,
                tags: prev.tags || autoTags,
            }));
        }
    };

    const [editingProduct, setEditingProduct] = useState<ProductForm | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tracking State
    const [trackingData, setTrackingData] = useState({
        orderId: null as number | null,
        tracking_number: '',
        courier_name: 'TCS',
        shipping_proof_url: ''
    });

    const [urlInput, setUrlInput] = useState('');
    const [editUrlInput, setEditUrlInput] = useState('');
    const [urlError, setUrlError] = useState(false);
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

        setUploading(true);
        const formData = new FormData();
        formData.append('images', file); // Use 'images' key as backend expects array but handles single here too

        try {
            const res = await fetchWithTimeout(`${import.meta.env.VITE_API_URL}/products/upload`, {
                method: 'POST',
                body: formData
            }, 30000); // 30s for file uploads
            const data = await res.json();

            if (data.success) {
                setTrackingData(prev => ({ ...prev, shipping_proof_url: data.imageUrls[0] }));
            } else {
                toast.show('Upload failed: ' + data.error, 'error');
            }
        } catch (error: any) {
            toast.show('Upload error: ' + error.message, 'error');
        } finally {
            setUploading(false);
        }
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

    const handleImageUpload = (isEditing = false) => {
        if (!window.cloudinary) {
            toast.show('Cloudinary widget not loaded. Check internet or index.html.', 'error');
            return;
        }

        const widget = window.cloudinary.createUploadWidget(
            {
                cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
                uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
                multiple: true,
                maxFiles: 5,
                sources: ['local', 'url', 'camera', 'facebook', 'instagram', 'google_drive', 'dropbox', 'image_search'],
                clientAllowedFormats: ['jpg', 'png', 'jpeg', 'webp'],
                maxFileSize: 5000000, // 5MB
            },
            (error: any, result: any) => {
                if (!error && result && result.event === "success") {
                    const imageUrl = result.info.secure_url;
                    if (isEditing) {
                        setEditingProduct((prev: any) => ({
                            ...prev,
                            image_url: prev.image_url || imageUrl,
                            image_urls: [...(prev.image_urls || []), imageUrl]
                        }));
                    } else {
                        setNewProduct(prev => ({
                            ...prev,
                            image_url: prev.image_url || imageUrl,
                            image_urls: [...(prev.image_urls || []), imageUrl]
                        }));
                    }
                }
            }
        );
        widget.open();
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

            const tagArray = newProduct.tags
                ? newProduct.tags.split(',').map(t => t.trim()).filter(Boolean)
                : [];

            const { error } = await supabase.from('products').insert({
                merchant_id: user.id,
                name: newProduct.name,
                sku: newProduct.sku,
                price: typeof newProduct.price === 'string' ? parseFloat(newProduct.price) : newProduct.price,
                stock: typeof newProduct.stock === 'string' ? parseInt(newProduct.stock) : newProduct.stock,
                category: newProduct.category,
                image_url: newProduct.image_url || (newProduct.image_urls?.[0] || ''),
                image_urls: newProduct.image_urls,
                description: newProduct.description,
                is_returnable: newProduct.is_returnable,
                compare_at_price: newProduct.compare_at_price ? (typeof newProduct.compare_at_price === 'string' ? parseFloat(newProduct.compare_at_price) : newProduct.compare_at_price) : null,
                seo_title: newProduct.seo_title || null,
                meta_description: newProduct.meta_description || null,
                slug: newProduct.slug || null,
                alt_text: newProduct.alt_text || null,
                tags: tagArray.length > 0 ? tagArray : null,
            });

            if (error) throw error;

            toast.show('Product added successfully!', 'success');
            setActiveTab('inventory');
            setNewProduct({ name: '', sku: '', price: '', stock: '', category: 'Fashion', image_url: '', image_urls: [], description: '', is_returnable: true, seo_title: '', meta_description: '', slug: '', alt_text: '', tags: '' });
            refetchProducts();
        } catch (error: any) {
            toast.show('Error adding product: ' + error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        setIsSubmitting(true);
        try {
            const tagArray = editingProduct.tags
                ? editingProduct.tags.split(',').map(t => t.trim()).filter(Boolean)
                : [];

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
                    is_returnable: editingProduct.is_returnable,
                    compare_at_price: editingProduct.compare_at_price ? (typeof editingProduct.compare_at_price === 'string' ? parseFloat(editingProduct.compare_at_price) : editingProduct.compare_at_price) : null,
                    seo_title: editingProduct.seo_title || null,
                    meta_description: editingProduct.meta_description || null,
                    slug: editingProduct.slug || null,
                    alt_text: editingProduct.alt_text || null,
                    tags: tagArray.length > 0 ? tagArray : null,
                })
                .eq('id', editingProduct.id);

            if (error) throw error;

            toast.show('Product updated successfully!', 'success');
            setEditingProduct(null);
            setActiveTab('inventory');
            refetchProducts();
        } catch (error: any) {
            toast.show('Error updating product: ' + error.message, 'error');
        } finally {
            setIsSubmitting(false);
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
                                            setEditingProduct({ ...product, price: product.price.toString(), stock: product.stock.toString(), description: product.description || '', image_urls: product.image_urls || [], is_returnable: !!product.is_returnable, tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || '') });
                                            setActiveTab('edit-product');
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
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl space-y-12"
                    >
                        <div className="flex items-center gap-6 mb-8">
                            <button onClick={() => setActiveTab('inventory')} className="p-4 bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Launch New Product</h2>
                        </div>

                        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-20">
                            <div className="col-span-2 space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-30">Product Name</label>
                                <input required type="text" value={newProduct.name} onChange={e => handleNameChange(e.target.value, false)} className="w-full glass border-none rounded-3xl p-6 outline-none transition-all text-xl font-bold" placeholder="Enter product name..." />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-30">SKU (Unique ID)</label>
                                <input required type="text" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} className="w-full glass border-none rounded-3xl p-6 outline-none transition-all font-mono" placeholder="e.g., SKU-123" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-30">Price (Rs.)</label>
                                <input required type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="w-full glass border-none rounded-3xl p-6 outline-none transition-all font-black text-2xl" placeholder="0" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-30">Original Price (Was)</label>
                                <input type="number" value={newProduct.compare_at_price} onChange={e => setNewProduct({ ...newProduct, compare_at_price: e.target.value })} className="w-full glass border-none rounded-3xl p-6 outline-none transition-all opacity-30 font-black" placeholder="Optional" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-30">Stock</label>
                                <input required type="number" min="0" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} className="w-full glass border-none rounded-3xl p-6 outline-none transition-all font-black" placeholder="Available units" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-30">Category</label>
                                <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} className="w-full glass border-none rounded-3xl p-6 outline-none transition-all cursor-pointer font-bold bg-background">
                                    <option value="">Select Category</option>
                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2 space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-30">Description</label>
                                <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="w-full glass border-none rounded-3xl p-6 min-h-[150px] outline-none transition-all" placeholder="Tell customers about this product..." />
                            </div>
                            <div className="col-span-2 flex items-center gap-4 p-6 glass rounded-3xl">
                                <input type="checkbox" checked={newProduct.is_returnable} onChange={e => setNewProduct({ ...newProduct, is_returnable: e.target.checked })} className="w-6 h-6 rounded-lg accent-primary" />
                                <label className="text-lg font-black italic uppercase tracking-tighter">Allow Returns</label>
                            </div>

                            <div className="col-span-2 space-y-6 pt-10 border-t border-white/5">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Product Photos</h3>
                                    <p className="text-xs font-bold opacity-30 uppercase">{newProduct.image_urls.length} Photos Added</p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div
                                        onClick={() => handleImageUpload(false)}
                                        className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed border-foreground/10 rounded-[2.5rem] cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all ${uploading ? 'opacity-50' : ''}`}
                                    >
                                        <Plus className="w-10 h-10 text-primary opacity-50" />
                                        <span className="text-[10px] font-black uppercase tracking-widest mt-3 opacity-30">Add Foto</span>
                                    </div>

                                    {newProduct.image_urls.map((url, idx) => (
                                        <div key={idx} className="aspect-square rounded-[2.5rem] overflow-hidden relative group border border-foreground/5 bg-foreground/5 flex items-center justify-center">
                                            {url && <img src={url} alt="Preview" className="w-full h-full object-cover" />}
                                            <button type="button" onClick={() => removeImage(idx, false)} className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform"><X className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="col-span-2 space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">External Image URL</label>
                                <div className="relative group">
                                    <Link className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30 text-black" />
                                    <input
                                        type="text"
                                        placeholder="Paste image URL..."
                                        value={urlInput}
                                        onChange={e => { setUrlInput(e.target.value); setUrlError(false); }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (urlInput && !urlError) {
                                                    setNewProduct(prev => ({ ...prev, image_urls: [...prev.image_urls, urlInput], image_url: prev.image_url || urlInput }));
                                                    setUrlInput('');
                                                }
                                            }
                                        }}
                                        className={`w-full bg-gray-50 border-2 ${urlError ? 'border-red-500' : 'border-transparent focus:border-primary'} rounded-3xl p-5 pl-14 outline-none transition-all text-black`}
                                    />
                                </div>
                                {urlInput && urlInput.startsWith('http') && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-gray-50 border border-gray-100 rounded-3xl flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                                            <img
                                                src={urlInput}
                                                alt="URL Preview"
                                                className="w-full h-full object-contain"
                                                onError={() => {
                                                    // Only set error if it's definitely not an image, 
                                                    // but we'll still allow adding it.
                                                    console.warn('⚠️ Preview failed for URL:', urlInput);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-primary italic">Press Enter to add this link anyway</p>
                                            <p className="text-[8px] opacity-40 uppercase font-bold mt-1">(Preview might fail due to site security)</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* SEO Fields Section */}
                            <div className="col-span-2 space-y-6 pt-10 border-t border-white/5">
                                <div>
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">SEO Settings</h3>
                                    <p className="text-xs opacity-40 mt-1">Auto-filled from product name — edit to customize for better Google ranking</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-30">SEO Title (Google tab title)</label>
                                        <input type="text" value={newProduct.seo_title || ''} onChange={e => setNewProduct({ ...newProduct, seo_title: e.target.value })} className="w-full glass border-none rounded-2xl p-4 outline-none text-sm font-medium" placeholder={`Buy ${newProduct.name || '...'} Online in Pakistan | Tarzify`} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-30">URL Slug (SEO-friendly URL)</label>
                                        <input type="text" value={newProduct.slug || ''} onChange={e => setNewProduct({ ...newProduct, slug: e.target.value })} className="w-full glass border-none rounded-2xl p-4 outline-none text-sm font-mono text-primary" placeholder="e.g. wireless-bluetooth-headphones" />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-30">Meta Description (max 160 chars — shown in Google search)</label>
                                        <input type="text" maxLength={160} value={newProduct.meta_description || ''} onChange={e => setNewProduct({ ...newProduct, meta_description: e.target.value })} className="w-full glass border-none rounded-2xl p-4 outline-none text-sm" placeholder="Shop ... at Tarzify. Fast delivery across Pakistan. Cash on delivery available." />
                                        <p className="text-[9px] opacity-30 text-right">{(newProduct.meta_description || '').length}/160</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-30">Image Alt Text (for Google Images)</label>
                                        <input type="text" value={newProduct.alt_text || ''} onChange={e => setNewProduct({ ...newProduct, alt_text: e.target.value })} className="w-full glass border-none rounded-2xl p-4 outline-none text-sm" placeholder={`${newProduct.name || '...'} - Buy Online at Tarzify Pakistan`} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-30">Keywords / Tags (comma-separated)</label>
                                        <input type="text" value={newProduct.tags || ''} onChange={e => setNewProduct({ ...newProduct, tags: e.target.value })} className="w-full glass border-none rounded-2xl p-4 outline-none text-sm" placeholder="e.g. buy online, tarzify, pakistan, fashion" />
                                        {newProduct.tags && (
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {newProduct.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                                                    <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full">{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="col-span-2 py-6 bg-primary text-white rounded-[2.5rem] font-black uppercase italic tracking-tighter text-2xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                                {isSubmitting ? 'Creating...' : 'Publish Product'}
                            </button>
                        </form>
                    </motion.div>
                )}

                {activeTab === 'edit-product' && editingProduct && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl space-y-12"
                    >
                        <div className="flex items-center gap-6 mb-8">
                            <button onClick={() => { setEditingProduct(null); setActiveTab('inventory'); }} className="p-4 bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Edit Product Details</h2>
                        </div>

                        <form onSubmit={handleUpdateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-20">
                            <div className="col-span-2 space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-30">Product Name</label>
                                <input required type="text" value={editingProduct.name} onChange={e => handleNameChange(e.target.value, true)} className="w-full glass border-none rounded-3xl p-6 outline-none transition-all text-xl font-bold" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-30">SKU</label>
                                <input required type="text" value={editingProduct.sku} onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })} className="w-full glass border-none rounded-3xl p-6 outline-none transition-all font-mono" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-30">Price (Rs.)</label>
                                <input required type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} className="w-full glass border-none rounded-3xl p-6 outline-none transition-all font-black text-2xl" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-30">Original Price</label>
                                <input type="number" value={editingProduct.compare_at_price} onChange={e => setEditingProduct({ ...editingProduct, compare_at_price: e.target.value })} className="w-full glass border-none rounded-3xl p-6 outline-none transition-all opacity-30 font-black" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-30">Stock</label>
                                <input required type="number" min="0" value={editingProduct.stock} onChange={e => setEditingProduct({ ...editingProduct, stock: e.target.value })} className="w-full glass border-none rounded-3xl p-6 outline-none transition-all font-black" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-30">Category</label>
                                <select value={editingProduct.category} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} className="w-full glass border-none rounded-3xl p-6 outline-none transition-all cursor-pointer font-bold bg-background">
                                    <option value="">Select Category</option>
                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2 space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-30">Description</label>
                                <textarea value={editingProduct.description} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} className="w-full glass border-none rounded-3xl p-6 min-h-[150px] outline-none transition-all" />
                            </div>
                            <div className="col-span-2 flex items-center gap-4 p-6 glass rounded-3xl">
                                <input type="checkbox" checked={editingProduct.is_returnable} onChange={e => setEditingProduct({ ...editingProduct, is_returnable: e.target.checked })} className="w-6 h-6 rounded-lg accent-primary" />
                                <label className="text-lg font-black italic uppercase tracking-tighter">Allow Returns</label>
                            </div>

                            <div className="col-span-2 space-y-6 pt-10 border-t border-white/5">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Product Photos</h3>
                                    <p className="text-xs font-bold opacity-30 uppercase">{(editingProduct.image_urls || []).length} Photos</p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div
                                        onClick={() => handleImageUpload(true)}
                                        className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed border-foreground/10 rounded-[2.5rem] cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all ${uploading ? 'opacity-50' : ''}`}
                                    >
                                        <Plus className="w-10 h-10 text-primary opacity-50" />
                                        <span className="text-[10px] font-black uppercase tracking-widest mt-3 opacity-30">Add More</span>
                                    </div>

                                    {(editingProduct.image_urls || []).map((url: string, idx: number) => (
                                        <div key={idx} className="aspect-square rounded-[2.5rem] overflow-hidden relative group border border-foreground/5 bg-foreground/5 flex items-center justify-center">
                                            {url && <img src={url} alt="Preview" className="w-full h-full object-cover" />}
                                            <button type="button" onClick={() => removeImage(idx, true)} className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform"><X className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="col-span-2 space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Add External URL</label>
                                <input
                                    type="text"
                                    placeholder="Paste image URL..."
                                    value={editUrlInput}
                                    onChange={e => { setEditUrlInput(e.target.value); setUrlError(false); }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (editUrlInput && !urlError) {
                                                setEditingProduct(prev => prev ? ({ ...prev, image_urls: [...(prev.image_urls || []), editUrlInput] }) : null);
                                                setEditUrlInput('');
                                            }
                                        }
                                    }}
                                    className={`w-full bg-gray-50 border-2 ${urlError ? 'border-red-500' : 'border-transparent focus:border-primary'} rounded-3xl p-5 outline-none transition-all text-black`}
                                />
                            </div>

                            <button type="submit" disabled={isSubmitting} className="col-span-2 py-6 bg-primary text-white rounded-[2.5rem] font-black uppercase italic tracking-tighter text-2xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                                {isSubmitting ? 'Updating...' : 'Update Product Details'}
                            </button>
                        </form>
                    </motion.div>
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
                                                                <span className="text-[10px] font-black bg-foreground/5 px-2 py-0.5 rounded-full">{item.quantity}x</span>
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
