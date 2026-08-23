import { create } from 'zustand'
import { initialAdminMenuItems, initialAdminOrders } from './adminData'
import type { AdminMenuItem, AdminOrder, NewAdminMenuItem } from './types'

interface AdminDemoState {
  orders: AdminOrder[]
  menuItems: AdminMenuItem[]
  advanceOrder: (orderId: string) => void
  toggleMenuAvailability: (itemId: string) => void
  addMenuItem: (item: NewAdminMenuItem) => void
  removeMenuItem: (itemId: string) => void
  resetDemoData: () => void
}

function cloneOrders() {
  return initialAdminOrders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({ ...item })),
  }))
}

function cloneMenuItems() {
  return initialAdminMenuItems.map((item) => ({ ...item }))
}

function getNextStatus(status: AdminOrder['status']): AdminOrder['status'] {
  if (status === 'received') return 'preparing'
  if (status === 'preparing') return 'ready'
  if (status === 'ready') return 'completed'
  return status
}

export const useAdminDemoStore = create<AdminDemoState>((set) => ({
  orders: cloneOrders(),
  menuItems: cloneMenuItems(),
  advanceOrder: (orderId) => set((state) => ({
    orders: state.orders.map((order) => (
      order.id === orderId ? { ...order, status: getNextStatus(order.status) } : order
    )),
  })),
  toggleMenuAvailability: (itemId) => set((state) => ({
    menuItems: state.menuItems.map((item) => (
      item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
    )),
  })),
  addMenuItem: (item) => set((state) => ({
    menuItems: [
      {
        ...item,
        id: crypto.randomUUID(),
        isAvailable: true,
      },
      ...state.menuItems,
    ],
  })),
  removeMenuItem: (itemId) => set((state) => ({
    menuItems: state.menuItems.filter((item) => item.id !== itemId),
  })),
  resetDemoData: () => set({ orders: cloneOrders(), menuItems: cloneMenuItems() }),
}))
