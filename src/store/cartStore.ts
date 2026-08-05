import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CartItem } from '../types/cart'
import type { MenuItem } from '../types/menu'

interface CartState {
  items: CartItem[]
  addItem: (item: MenuItem) => void
  decreaseItem: (itemId: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((cartItem) => cartItem.id === item.id)

          if (existingItem) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.id === item.id
                  ? { ...cartItem, quantity: cartItem.quantity + 1 }
                  : cartItem,
              ),
            }
          }

          return {
            items: [
              ...state.items,
              { id: item.id, name: item.name, price: item.price, quantity: 1 },
            ],
          }
        }),
      decreaseItem: (itemId) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'kanoon-bite-cart',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
