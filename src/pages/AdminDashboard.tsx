import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, ShoppingBag, Package, Users, Bell, Settings, ArrowUpRight, Search, Plus, Save, Loader2, Menu, X } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { supabase } from '../lib/supabase';
import { useAdminStats } from '../hooks/useAdminStats';
import { ProductForm } from '../components/ProductForm';
import { useToastStore } from '../stores/useToastStore';

export const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const { products, loading: productsLoading, refetch } = useProducts();
    const { stats, loading: statsLoading, refetch: refetchStats } = useAdminStats();

    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [localStock, setLocalStock] = useState<Record<number, number>>({});
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Data States
    const [orders, setOrders] = useState([] as any[]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(false);

    useEffect(() => {
        const initialStock: Record<number, number> = {};
        products.forEach(p => initialStock[p.id] = p.stock);
        setLocalStock(initialStock);
    }, [products]);

    // Fetch Orders/Customers on tab change
    useEffect(() => {
        const fetchData = async () => {
            setDataLoading(true);
            if (activeTab === 'orders') {
                const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
                if (data) setOrders(data);
            }
            if (activeTab === 'customers') {
                const { data } = await supabase.from('profiles').select('*').eq('role', 'customer');
                if (data) setCustomers(data);
            }
            setDataLoading(false);
        };
        if (activeTab === 'orders' || activeTab === 'customers') fetchData();
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

    const handleSeed = async () => {
        if (!confirm('This will seed 8 demo products. Continue?')) return;
        setDataLoading(true);
        try {
            const { VITE_API_URL } = import.meta.env;
            const res = await fetch(`${VITE_API_URL}/setup/seed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                useToastStore.getState().show('Success: ' + data.message, 'success');
                await refetch();
                await refetchStats();
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            useToastStore.getState().show('Seed failed: ' + err.message, 'error');
        } finally {
            setDataLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex pt-20">
            {/* Sidebar */}
            <div className={`fixed lg:relative inset-y-0 left-0 z-[110] w-64 border-r border-foreground/5 p-6 flex flex-col gap-2 bg-background transition-transform duration-300 lg:translate-x-0 ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between mb-8 lg:mb-4 px-4">
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-30">Menu</h3>
                    <button onClick={() => setShowMobileMenu(false)} className="lg:hidden p-2 hover:bg-foreground/5 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <button onClick={() => { setActiveTab('overview'); setShowMobileMenu(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-primary text-white shadow-lg' : 'hover:bg-foreground/5 opacity-60'}`}>
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="font-bold">Overview</span>
                </button>
                <button onClick={() => { setActiveTab('inventory'); setShowMobileMenu(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'inventory' ? 'bg-primary text-white shadow-lg' : 'hover:bg-foreground/5 opacity-60'}`}>
                    <Package className="w-5 h-5" />
                    <span className="font-bold">Inventory</span>
                </button>
                <button onClick={() => { setActiveTab('orders'); setShowMobileMenu(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-primary text-white shadow-lg' : 'hover:bg-foreground/5 opacity-60'}`}>
                    <ShoppingBag className="w-5 h-5" />
                    <span className="font-bold">Orders</span>
                </button>
                <button onClick={() => { setActiveTab('customers'); setShowMobileMenu(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'customers' ? 'bg-primary text-white shadow-lg' : 'hover:bg-foreground/5 opacity-60'}`}>
                    <Users className="w-5 h-5" />
                    <span className="font-bold">Customers</span>
                </button>
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
                                <button onClick={() => setShowAddProduct(true)} className="w-full sm:w-auto bg-primary text-white font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20">
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
                                                    <button onClick={() => handleUpdateStock(product.id)} disabled={updatingId === product.id} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex items-center gap-2">
                                                        {updatingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                        <span className="text-xs">Save</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
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
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-foreground/5 font-bold">
                                    {dataLoading ? (
                                        [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={4} className="px-6 py-4 bg-foreground/5 h-12" /></tr>)
                                    ) : orders.map(order => (
                                        <tr key={order.id} className="hover:bg-foreground/[0.01]">
                                            <td className="px-6 py-4">#{order.order_number}</td>
                                            <td className="px-6 py-4 capitalize">{order.status}</td>
                                            <td className="px-6 py-4">Rs. {Number(order.total_amount).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-xs opacity-50">{new Date(order.created_at).toLocaleDateString()}</td>
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
                                        <th className="px-6 py-4">ID</th>
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
                                            <td className="px-6 py-4 text-xs font-mono opacity-50">{customer.id}</td>
                                            <td className="px-6 py-4 capitalize">{customer.role}</td>
                                            <td className="px-6 py-4 text-xs opacity-50">{new Date(customer.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Modal */}
            {
                showAddProduct && (
                    <ProductForm
                        onClose={() => setShowAddProduct(false)}
                        onSuccess={() => {
                            refetch();
                            refetchStats();
                        }}
                    />
                )
            }
        </div >
    );
};
