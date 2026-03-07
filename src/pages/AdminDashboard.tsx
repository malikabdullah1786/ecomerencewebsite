import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ShoppingBag, Package, Users, Bell, Settings, ArrowUpRight, Search, Plus, Save, Loader2, Menu, X, Trash2, Eye, Upload, Edit2 } from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';
import { useProducts } from '../hooks/useProducts';
import { supabase } from '../lib/supabase';
import { useAdminStats } from '../hooks/useAdminStats';
import { ProductForm } from '../components/ProductForm';
import { useToastStore } from '../stores/useToastStore';
import { useCategories } from '../hooks/useCategories';

export const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const { products, loading: productsLoading, refetch } = useProducts();
    const { stats, loading: statsLoading, refetch: refetchStats } = useAdminStats();
    const { categories, addCategory, updateCategory, deleteCategory, loading: categoriesLoading } = useCategories();

    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [localStock, setLocalStock] = useState<Record<number, number>>({});
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryImage, setNewCategoryImage] = useState('');
    const [uploadingCategory, setUploadingCategory] = useState(false);
    const [renamingId, setRenamingId] = useState<number | null>(null);
    const [tempName, setTempName] = useState('');

    // Data States
    const [orders, setOrders] = useState([] as any[]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [carts, setCarts] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [selectedOrderToView, setSelectedOrderToView] = useState<any | null>(null);

    useEffect(() => {
        const initialStock: Record<number, number> = {};
        products.forEach(p => initialStock[p.id] = p.stock);
        setLocalStock(initialStock);
    }, [products]);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://upload-widget.cloudinary.com/global/all.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const openUploadWidget = (callback: (url: string) => void) => {
        if (!(window as any).cloudinary) {
            useToastStore.getState().show('Upload widget not loaded', 'error');
            return;
        }

        (window as any).cloudinary.openUploadWidget(
            {
                cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
                uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
                multiple: false,
                maxFiles: 1,
                clientAllowedFormats: ["jpg", "png", "webp", "jpeg"],
            },
            (error: any, result: any) => {
                if (!error && result && result.event === "success") {
                    callback(result.info.secure_url);
                }
            }
        );
    };

    const handleUploadClick = (categoryToEdit?: any) => {
        setUploadingCategory(true);
        openUploadWidget((url) => {
            if (categoryToEdit) {
                handleUpdateCategoryImage(categoryToEdit.id, url);
            } else {
                setNewCategoryImage(url);
            }
            setUploadingCategory(false);
        });
    };

    // Fetch Orders/Customers/Carts on tab change
    useEffect(() => {
        const fetchData = async () => {
            setDataLoading(true);
            if (activeTab === 'orders') {
                const { data } = await supabase
                    .from('orders')
                    .select('*, customer:user_id(id, full_name, email), order_items(*, products(*))')
                    .order('created_at', { ascending: false });
                if (data) {
                    const mapped = data.map(order => ({ ...order, profiles: order.customer }));
                    setOrders(mapped);
                }
            }
            if (activeTab === 'customers') {
                const { data } = await supabase.from('profiles').select('*').eq('role', 'customer');
                if (data) setCustomers(data);
            }
            if (activeTab === 'carts') {
                // Fetch all cart items joined with products and profiles
                const { data } = await supabase
                    .from('cart_items')
                    .select('*, products(*), user:profiles!user_id(id, full_name, email)')
                    .order('created_at', { ascending: false });

                if (data) {
                    // Group by user
                    const grouped = data.reduce((acc: any, item: any) => {
                        const userId = item.user_id;
                        const itemTimestamp = item.updated_at || item.created_at;

                        if (!acc[userId]) {
                            acc[userId] = {
                                user: item.user,
                                items: [],
                                total: 0,
                                last_updated: itemTimestamp
                            };
                        } else if (new Date(itemTimestamp) > new Date(acc[userId].last_updated)) {
                            // Keep the latest timestamp
                            acc[userId].last_updated = itemTimestamp;
                        }

                        acc[userId].items.push(item);
                        acc[userId].total += item.products.price * item.quantity;
                        return acc;
                    }, {});
                    setCarts(Object.values(grouped));
                }
            }
            setDataLoading(false);
        };
        const tabsRequiringData = ['orders', 'customers', 'carts'];
        if (tabsRequiringData.includes(activeTab)) fetchData();
    }, [activeTab]);

    const handleUpdateStock = async (id: number) => {
        setUpdatingId(id);
        try {
            const { error } = await supabase
                .from('products')
                .update({ stock: localStock[id] })
                .eq('id', id);

            if (error) throw error;
            useToastStore.getState().show('Stock updated successfully', 'success');
            await refetch();
        } catch (err: any) {
            console.error('Error updating stock:', err);
            useToastStore.getState().show('Update failed: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            const { error } = await supabase
                .from('products')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            useToastStore.getState().show('Product deleted successfully', 'success');
            await refetch();
            await refetchStats();
        } catch (err: any) {
            useToastStore.getState().show('Failed to delete product: ' + err.message, 'error');
        }
    };

    const handleSeed = async () => {
        const { VITE_API_URL } = import.meta.env;
        const isLocal = VITE_API_URL.includes('localhost') || VITE_API_URL.includes('127.0.0.1');

        if (!confirm(`This will seed demo products to: ${VITE_API_URL}\n\n${isLocal ? 'DEVELOPMENT MODE: hitting local server' : 'PRODUCTION MODE: hitting live api'}\n\nContinue?`)) return;

        setDataLoading(true);
        try {
            const res = await fetch(`${VITE_API_URL}/setup/seed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Server responded with ${res.status}: ${text.slice(0, 100)}`);
            }

            const data = await res.json();
            if (data.success) {
                useToastStore.getState().show('Success: ' + data.message, 'success');
                await refetch();
                await refetchStats();
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (err: any) {
            console.error('Seed Error:', err);
            useToastStore.getState().show('Seed failed: ' + err.message, 'error');
        } finally {
            setDataLoading(false);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        await addCategory(newCategoryName.trim(), newCategoryImage);
        setNewCategoryName('');
        setNewCategoryImage('');
    };

    const handleUpdateCategoryImage = async (id: number, url: string) => {
        await updateCategory(id, { image_url: url });
    };

    const handleRenameCategory = async (id: number) => {
        if (!tempName.trim()) return;
        await updateCategory(id, { name: tempName.trim() });
        setRenamingId(null);
    };

    const handleDeleteCategory = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This might affect products using this category.`)) return;
        await deleteCategory(id);
    };

    return (
        <div className="min-h-screen bg-transparent flex pt-20">
            {/* Sidebar */}
            <div className={`fixed lg:relative inset-y-0 left-0 z-[110] w-64 border-r border-foreground/5 p-6 flex flex-col gap-2 bg-background transition-transform duration-300 lg:translate-x-0 ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between mb-8 lg:mb-4 px-4">
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-30">Menu</h3>
                    <button onClick={() => setShowMobileMenu(false)} className="lg:hidden p-2 hover:bg-foreground/5 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                {[
                    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                    { id: 'inventory', label: 'Inventory', icon: Package },
                    { id: 'categories', label: 'Categories', icon: Menu },
                    { id: 'orders', label: 'Orders', icon: ShoppingBag },
                    { id: 'customers', label: 'Customers', icon: Users },
                    { id: 'carts', label: 'Customer Carts', icon: ShoppingBag }
                ].map(item => (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); }} className={`flex items-center gap-2.5 px-3 py-3 rounded-2xl transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-lg' : 'hover:bg-foreground/5 opacity-60'}`}>
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-grow p-4 md:p-10 overflow-y-auto w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-12 gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button onClick={() => setShowMobileMenu(true)} className="lg:hidden p-3 glass rounded-xl">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-1 md:mb-2 italic uppercase">Admin Dashboard</h1>
                            <p className="text-[10px] sm:text-sm opacity-50 font-medium">Store operations and metrics.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 ml-auto sm:ml-0">
                        <button className="p-3 glass rounded-full hover:scale-110 transition-transform relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                        </button>
                        <button className="p-3 glass rounded-full hover:scale-110 transition-transform">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Sales', value: `Rs. ${stats.totalRevenue.toLocaleString()}`, trend: 'Live', color: 'text-primary' },
                                { label: 'Total Orders', value: stats.totalOrders.toString(), trend: 'Live', color: 'text-accent' },
                                { label: 'Active Customers', value: stats.totalCustomers.toString(), trend: 'Live', color: 'text-foreground' },
                                { label: 'Active Products', value: stats.activeProducts.toString(), trend: 'Live', color: 'text-primary' },
                            ].map((metric, i) => (
                                <div key={i} className="glass p-6 rounded-[2rem] border-white/5 shadow-xl">
                                    <p className="text-xs font-black uppercase tracking-widest opacity-30 mb-4">{metric.label}</p>
                                    <div className="flex items-end justify-between">
                                        <h4 className="text-2xl font-black">{statsLoading ? '...' : metric.value}</h4>
                                        <span className={`text-xs font-bold flex items-center gap-1 text-green-500`}>
                                            <ArrowUpRight className="w-3 h-3" />
                                            {metric.trend}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'inventory' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                                <input type="text" placeholder="Search products..." className="w-full bg-foreground/5 border-none rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 ring-primary/30" />
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button onClick={handleSeed} disabled={productsLoading || dataLoading} className="w-full sm:w-auto bg-foreground/10 text-foreground font-black px-6 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-foreground/20 transition-all border border-foreground/5">
                                    <ArrowUpRight className="w-4 h-4" />
                                    <span className="uppercase tracking-tighter italic">Seed Data</span>
                                </button>
                                <button onClick={() => setEditingProductId(-1)} className="w-full sm:w-auto bg-primary text-white font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20">
                                    <Plus className="w-5 h-5" />
                                    <span className="uppercase tracking-tighter italic">Add Product</span>
                                </button>
                            </div>
                        </div>

                        <div className="glass rounded-[2rem] border-white/5 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-foreground/[0.02]">
                                    <tr className="text-xs font-black uppercase tracking-widest opacity-30 border-b border-foreground/5">
                                        <th className="px-6 py-4">Product / SKU</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Stock</th>
                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4">Returnable</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-foreground/5 font-bold">
                                    {productsLoading ? (
                                        [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-4 bg-foreground/5 h-12" /></tr>)
                                    ) : (
                                        products.map((product) => (
                                            <tr key={product.id} className="hover:bg-foreground/[0.01]">
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-foreground/5 flex-shrink-0">
                                                        {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold truncate max-w-[200px]">{product.name}</div>
                                                        <div className="text-xs opacity-50 font-mono">{product.sku}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm opacity-70">{product.category}</td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        value={localStock[product.id] ?? product.stock}
                                                        onChange={(e) => setLocalStock({ ...localStock, [product.id]: parseInt(e.target.value) })}
                                                        className="w-20 bg-foreground/5 border-none rounded-lg px-2 py-1 outline-none focus:ring-1 ring-primary/30"
                                                    />
                                                </td>

                                                <td className="px-6 py-4">Rs. {product.price.toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.is_returnable ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        {product.is_returnable ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleUpdateStock(product.id)} disabled={updatingId === product.id} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex items-center gap-2" title="Save Stock">
                                                            {updatingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                        </button>
                                                        <button onClick={() => setEditingProductId(product.id)} className="p-2 text-foreground hover:bg-foreground/10 rounded-lg transition-colors inline-flex items-center gap-2" title="Edit details">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors inline-flex items-center gap-2" title="Delete product">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'categories' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Manage Categories</h3>
                                <p className="text-sm opacity-50">Add or remove product categories.</p>
                            </div>
                            <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-end sm:items-center">
                                <div className="flex gap-4 w-full sm:w-auto">
                                    <div className="relative group">
                                        <button
                                            type="button"
                                            onClick={() => handleUploadClick()}
                                            className="w-16 h-16 rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/50 flex items-center justify-center overflow-hidden transition-all bg-foreground/5 sticky"
                                        >
                                            {newCategoryImage ? (
                                                <img src={newCategoryImage} alt="New" className="w-full h-full object-cover" />
                                            ) : (
                                                <Upload className="w-6 h-6 opacity-30 group-hover:opacity-100" />
                                            )}
                                        </button>
                                        {newCategoryImage && (
                                            <button
                                                type="button"
                                                onClick={() => setNewCategoryImage('')}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Category Name"
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        className="bg-foreground/5 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-primary/30 w-full sm:w-64 font-bold h-16"
                                    />
                                </div>
                                <button type="submit" disabled={categoriesLoading || uploadingCategory || !newCategoryName.trim()} className="h-16 bg-primary text-white px-8 rounded-2xl hover:scale-105 transition-transform disabled:opacity-30 flex items-center justify-center gap-2 group shadow-xl shadow-primary/20">
                                    {categoriesLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
                                    <span className="uppercase font-black text-sm italic tracking-tighter">Add Category</span>
                                </button>
                            </form>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {categoriesLoading ? (
                                [1, 2, 3, 4].map(i => <div key={i} className="glass p-8 rounded-[2rem] animate-pulse h-24" />)
                            ) : categories.length === 0 ? (
                                <div className="col-span-full p-20 glass rounded-[3rem] text-center opacity-30 italic font-bold">No categories found. Start by adding one above.</div>
                            ) : categories.map(category => (
                                <div key={category.id} className="glass p-4 rounded-[2rem] border-white/5 group hover:border-primary/30 transition-all flex items-center gap-4 relative overflow-hidden">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-foreground/5 relative flex-shrink-0 group">
                                        {category.image_url ? (
                                            <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center italic opacity-20 text-[8px] gap-1">
                                                <Upload className="w-4 h-4" />
                                                <span>Add Photo</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleUploadClick(category)}
                                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                        >
                                            <Upload className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex-grow">
                                        {renamingId === category.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={tempName}
                                                    onChange={e => setTempName(e.target.value)}
                                                    className="bg-foreground/5 border-none rounded-lg px-2 py-1 outline-none focus:ring-1 ring-primary/30 font-bold text-sm w-full"
                                                    autoFocus
                                                    onKeyDown={e => e.key === 'Enter' && handleRenameCategory(category.id)}
                                                />
                                                <button onClick={() => handleRenameCategory(category.id)} className="p-1 px-2 bg-primary text-white text-[10px] rounded-lg">Save</button>
                                                <button onClick={() => setRenamingId(null)} className="p-1 px-2 bg-foreground/10 text-foreground text-[10px] rounded-lg">X</button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="font-black text-sm uppercase italic tracking-tighter truncate flex items-center gap-2">
                                                    {category.name}
                                                </div>
                                                <p className="text-[10px] opacity-30 font-bold uppercase tracking-widest">Active Category</p>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { setRenamingId(category.id); setTempName(category.name); }}
                                            className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all scale-90 hover:scale-100"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteCategory(category.id, category.name)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all scale-90 hover:scale-100">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'orders' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="glass rounded-[2rem] border-white/5 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-foreground/[0.02] text-xs font-black uppercase opacity-30">
                                    <tr>
                                        <th className="px-6 py-4">Order ID</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Total</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-foreground/5 font-bold">
                                    {dataLoading ? (
                                        [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={4} className="px-6 py-4 bg-foreground/5 h-12" /></tr>)
                                    ) : orders.map(order => (
                                        <tr key={order.id} className="hover:bg-foreground/[0.01]">
                                            <td className="px-6 py-4 font-mono">#{order.order_number}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${order.status === 'delivered' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>{order.status}</span>
                                            </td>
                                            <td className="px-6 py-4">Rs. {Number(order.total_amount).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-xs opacity-50">{new Date(order.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => setSelectedOrderToView(order)} className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'customers' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="glass rounded-[2rem] border-white/5 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-foreground/[0.02] text-xs font-black uppercase opacity-30">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Email Address</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-foreground/5 font-bold">
                                    {dataLoading ? (
                                        [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={4} className="px-6 py-4 bg-foreground/5 h-12" /></tr>)
                                    ) : customers.map(customer => (
                                        <tr key={customer.id} className="hover:bg-foreground/[0.01]">
                                            <td className="px-6 py-4">{customer.full_name}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-primary">{customer.email || 'N/A'}</td>
                                            <td className="px-6 py-4 capitalize">{customer.role}</td>
                                            <td className="px-6 py-4 text-xs opacity-50">{new Date(customer.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'carts' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {dataLoading ? (
                                [1, 2].map(i => <div key={i} className="glass h-40 animate-pulse rounded-3xl" />)
                            ) : carts.length === 0 ? (
                                <div className="col-span-full glass p-12 text-center rounded-[2rem]">
                                    <ShoppingBag className="w-12 h-12 opacity-20 mx-auto mb-4" />
                                    <h3 className="text-xl font-black opacity-30 uppercase tracking-widest">No active carts found</h3>
                                </div>
                            ) : carts.map((cart, idx) => (
                                <div key={idx} className="glass rounded-[2rem] p-6 border-white/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black uppercase">
                                                {cart.user?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <h3 className="font-black">{cart.user?.full_name || 'Anonymous User'}</h3>
                                                <p className="text-[10px] text-primary font-black uppercase tracking-widest">{cart.user?.email || 'No Email'}</p>
                                                <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">Last updated: {new Date(cart.last_updated).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black opacity-30 uppercase tracking-widest">Cart Total</p>
                                            <p className="text-lg font-black text-primary">Rs. {Number(cart.total).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 border-t border-white/5 pt-4">
                                        {cart.items.map((item: any, i: number) => (
                                            <div key={i} className="flex items-center gap-4 bg-white/[0.02] p-3 rounded-2xl">
                                                <img src={item.products.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                                                <div className="flex-grow">
                                                    <p className="text-xs font-bold leading-tight">{item.products.name}</p>
                                                    <p className="text-[10px] opacity-40 font-black tracking-widest uppercase">Qty: {item.quantity}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black">Rs. {(item.products.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {/* Form Overlay (Admin Version) */}
                {editingProductId !== null && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="fixed inset-0 z-[150] bg-background border-l border-white/5 overflow-y-auto"
                    >
                        {/* 
                          We pass `productId` to let the form know we are editing. 
                          If `editingProductId === -1`, we pass undefined so it acts as "Create".
                        */}
                        <div className="max-w-4xl mx-auto py-12 px-6">
                            <ProductForm
                                productId={editingProductId === -1 ? undefined : editingProductId}
                                onClose={() => setEditingProductId(null)}
                                onSuccess={() => {
                                    refetch();
                                    refetchStats();
                                    setEditingProductId(null);
                                }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {selectedOrderToView && (
                <ReceiptModal order={selectedOrderToView} onClose={() => setSelectedOrderToView(null)} />
            )}
        </div >
    );
};
