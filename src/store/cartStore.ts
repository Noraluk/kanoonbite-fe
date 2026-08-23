import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CartItem } from '../types/cart'
import type { MenuItem } from '../types/menu'

interface CartState {
  items: CartItem[]
  addItem: (item: MenuItem) => void
  increaseItem: (productId: string) => void
  decreaseItem: (productId: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((cartItem) => cartItem.productId === item.id)

          if (existingItem) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.productId === item.id
                  ? { ...cartItem, quantity: cartItem.quantity + 1 }
                  : cartItem,
              ),
            }
          }

          return {
            items: [
              ...state.items,
              {
                productId: item.id,
                name: item.name,
                imageUrl: item.imageUrl,
                price: item.price,
                quantity: 1,
              },
            ],
          }
        }),
      increaseItem: (productId) =>
        set((state) => ({
          items: state.items.map((item) => (
            item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
          )),
        })),
      decreaseItem: (productId) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'kanoon-bite-cart-v2',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
