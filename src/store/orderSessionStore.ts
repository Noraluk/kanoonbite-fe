import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface OrderSessionState {
  tableNumber: number | null
  setTableNumber: (tableNumber: number) => void
  clearTable: () => void
}

export const useOrderSessionStore = create<OrderSessionState>()(
  persist(
    (set) => ({
      tableNumber: null,
      setTableNumber: (tableNumber) => set({ tableNumber }),
      clearTable: () => set({ tableNumber: null }),
    }),
    {
      name: 'kanoon-bite-order-session',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
