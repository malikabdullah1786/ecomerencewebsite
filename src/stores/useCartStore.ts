import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
    id: number;
    name: string;
    price: number;
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

                let newItems;
                if (existingItem) {
                    if (existingItem.quantity >= availableStock) {
                        alert(`Only ${availableStock} units available in stock.`);
                        return;
                    }
                    newItems = currentItems.map(item =>
                        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                    );
                } else {
                    newItems = [...currentItems, { ...product, quantity: 1, stock: availableStock }];
                }
                set({ items: newItems, total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0) });
            },
            removeItem: (id) => {
                const newItems = get().items.filter(item => item.id !== id);
                set({ items: newItems, total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0) });
            },
            updateQuantity: (id, change) => {
                const currentItems = get().items;
                const item = currentItems.find(i => i.id === id);
                if (!item) return;

                const newQuantity = item.quantity + change;
                if (newQuantity > item.stock) {
                    alert(`Only ${item.stock} units available.`);
                    return;
                }

                if (newQuantity < 1) return;

                const newItems = currentItems.map(i =>
                    i.id === id ? { ...i, quantity: newQuantity } : i
                );
                set({ items: newItems, total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0) });
            },
            clearCart: () => set({ items: [], total: 0 }),
            total: 0
        }),
        { name: 'cart-storage' }
    )
);
