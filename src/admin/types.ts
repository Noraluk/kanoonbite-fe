import type { OrderStatus } from '../types/order'

export interface AdminOrderItem {
  name: string
  quantity: number
}

export interface AdminOrder {
  id: string
  orderNumber: number
  tableLabel: string
  items: AdminOrderItem[]
  total: number
  status: OrderStatus
  minutesAgo: number
}

export interface AdminMenuItem {
  id: string
  name: string
  category: string
  price: number
  imageUrl: string
  isAvailable: boolean
}

export interface NewAdminMenuItem {
  name: string
  category: string
  price: number
  imageUrl: string
}
