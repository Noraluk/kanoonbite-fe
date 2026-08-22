import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CartItem } from '../types/cart'

interface PlacedOrder {
  orderNumber: number
  tableNumber: number
  items: CartItem[]
  total: number
}

interface OrderState {
  lastOrder: PlacedOrder | null
  placeOrder: (items: CartItem[], tableNumber: number, total: number) => PlacedOrder
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      lastOrder: null,
      placeOrder: (items, tableNumber, total) => {
        const order = {
          orderNumber: 105,
          tableNumber,
          items: items.map((item) => ({ ...item })),
          total,
        }
        set({ lastOrder: order })
        return order
      },
    }),
    {
      name: 'kanoon-bite-last-order',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
