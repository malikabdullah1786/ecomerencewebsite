import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAdminStats = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        activeProducts: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Run all queries in parallel for maximum speed
            const [ordersRes, customersRes, productsRes] = await Promise.all([
                supabase.from('orders').select('total_amount'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
                supabase.from('products').select('*', { count: 'exact', head: true })
            ]);

            if (ordersRes.error) throw ordersRes.error;
            if (customersRes.error) throw customersRes.error;
            if (productsRes.error) throw productsRes.error;

            const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
            const totalOrders = ordersRes.data?.length || 0;

            setStats({
                totalRevenue,
                totalOrders,
                totalCustomers: customersRes.count || 0,
                activeProducts: productsRes.count || 0
            });
        } catch (err) {
            console.error('Error fetching admin stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return { stats, loading, refetch: fetchStats };
};
