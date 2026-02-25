import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';
import { useToastStore } from './useToastStore';

interface CartItem {
    id: number;
    name: string;
    price: number;
    compare_at_price?: number;
    image: string;
    quantity: number;
    stock: number; // Current available stock
}

interface CartState {
    items: CartItem[];
    addItem: (product: any) => void;
    removeItem: (id: number) => void;
    updateQuantity: (id: number, change: number) => void;
    clearCart: () => void;
    setItems: (items: CartItem[]) => void;
    syncWithProducts: (availableProductIds: number[]) => void;
    total: number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product) => {
                const currentItems = get().items;
                const existingItem = currentItems.find(item => item.id === product.id);
                const availableStock = product.stock ?? 0;

                if (availableStock <= 0) return;
                let newItems: CartItem[];
                if (existingItem) {
                    if (existingItem.quantity >= availableStock) {
                        useToastStore.getState().show(`Only ${availableStock} units available in stock.`, 'error');
                        return;
                    }
                    newItems = currentItems.map(item =>
                        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                    );
                } else {
                    const itemImage = product.image || product.image_url;
                    newItems = [...currentItems, {
                        ...product,
                        image: itemImage,
                        compare_at_price: product.compare_at_price,
                        quantity: 1,
                        stock: availableStock
                    }];
                }
                set({ items: newItems, total: newItems.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0) });

                // Sync to DB if logged in
                const user = (useAuthStore.getState() as any).user; // Simple way to check user without hook in store
                if (user) {
                    const item = newItems.find(i => i.id === product.id);
                    if (item) {
                        supabase.from('cart_items').upsert({
                            user_id: user.id,
                            product_id: item.id,
                            quantity: item.quantity
                        }, { onConflict: 'user_id,product_id' }).then();
                    }
                }
            },
            removeItem: (id) => {
                const newItems = get().items.filter(item => item.id !== id);
                set({ items: newItems, total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0) });

                // Sync to DB if logged in
                const user = (useAuthStore.getState() as any).user;
                if (user) {
                    supabase.from('cart_items')
                        .delete()
                        .eq('user_id', user.id)
                        .eq('product_id', id)
                        .then();
                }
            },
            updateQuantity: (id, change) => {
                const currentItems = get().items;
                const item = currentItems.find(i => i.id === id);
                if (!item) return;

                const newQuantity = item.quantity + change;
                if (newQuantity > item.stock) {
                    useToastStore.getState().show(`Only ${item.stock} units available.`, 'error');
                    return;
                }

                if (newQuantity < 1) return;

                const newItems = currentItems.map(i =>
                    i.id === id ? { ...i, quantity: newQuantity } : i
                );
                set({ items: newItems, total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0) });
            },
            clearCart: () => set({ items: [], total: 0 }),
            setItems: (items) => set({
                items,
                total: items.reduce((sum, item) => sum + item.price * item.quantity, 0)
            }),
            syncWithProducts: (availableProductIds) => {
                const currentItems = get().items;
                const newItems = currentItems.filter(item => availableProductIds.includes(item.id));
                if (newItems.length !== currentItems.length) {
                    set({
                        items: newItems,
                        total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
                    });
                }
            },
            total: 0
        }),
        { name: 'cart-storage' }
    )
);
