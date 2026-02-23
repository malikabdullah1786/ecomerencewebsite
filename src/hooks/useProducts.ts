import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Product {
    id: number;
    name: string;
    sku: string;
    price: number;
    image_url: string;
    category: string;
    stock: number;
    created_at: string;
    is_returnable?: boolean;
    merchant_id?: string;
    description?: string;
    image_urls?: string[];
    avg_rating?: number;
}

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, reviews(rating)')
                .is('deleted_at', null) // Filter out soft-deleted products
                .order('id', { ascending: true });

            if (error) throw error;

            // Compute avg_rating from joined reviews
            const enriched = (data || []).map((p: any) => {
                const revs: { rating: number }[] = p.reviews || [];
                const avg_rating = revs.length > 0
                    ? revs.reduce((sum, r) => sum + r.rating, 0) / revs.length
                    : 0;
                return { ...p, avg_rating };
            });

            setProducts(enriched);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching products:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();

        // Real-time listener for stock/price updates
        const channel = supabase
            .channel('products-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
                console.log('Real-time update:', payload);
                fetchProducts(); // Refresh on any change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { products, loading, error, refetch: fetchProducts };
};
