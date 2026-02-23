import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
    id: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (product: any) => void;
    removeItem: (id: number) => void;
    updateQuantity: (id: number, change: number) => void;
    clearCart: () => void;
    total: number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product) => {
                const currentItems = get().items;
                const existingItem = currentItems.find(item => item.id === product.id);
                let newItems;

                if (existingItem) {
                    newItems = currentItems.map(item =>
                        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                    );
                } else {
                    newItems = [...currentItems, { ...product, quantity: 1 }];
                }
                set({ items: newItems, total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0) });
            },
            removeItem: (id) => {
                const newItems = get().items.filter(item => item.id !== id);
                set({ items: newItems, total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0) });
            },
            updateQuantity: (id, change) => {
                const currentItems = get().items;
                const newItems = currentItems.map(item => {
                    if (item.id === id) {
                        const newQuantity = Math.max(1, item.quantity + change);
                        return { ...item, quantity: newQuantity };
                    }
                    return item;
                });
                set({ items: newItems, total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0) });
            },
            clearCart: () => set({ items: [], total: 0 }),
            total: 0
        }),
        { name: 'cart-storage' }
    )
);
