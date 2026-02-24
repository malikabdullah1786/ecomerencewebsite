import { useEffect } from 'react';
import { useProductStore, type Product } from '../stores/useProductStore';

export type { Product };

export const useProducts = () => {
    const { products, loading, error, fetchProducts, subscribe } = useProductStore();

    useEffect(() => {
        fetchProducts();
        return subscribe();
    }, [fetchProducts, subscribe]);

    return { products, loading, error, refetch: () => fetchProducts(true) };
};
