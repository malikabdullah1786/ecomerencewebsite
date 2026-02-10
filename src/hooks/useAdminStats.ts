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
            // 1. Total Revenue & Orders
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('total_amount');

            if (ordersError) throw ordersError;

            const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
            const totalOrders = orders?.length || 0;

            // 2. Active Customers
            const { count: customerCount, error: customerError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'customer');

            if (customerError) throw customerError;

            // 3. Active Products
            const { count: productCount, error: productError } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true });

            if (productError) throw productError;

            setStats({
                totalRevenue,
                totalOrders,
                totalCustomers: customerCount || 0,
                activeProducts: productCount || 0
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
