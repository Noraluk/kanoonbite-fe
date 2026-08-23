export type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export interface OrderItem {
  productId: string
  name: string
  quantity: number
  notes?: string
  unitPrice: number
  lineTotal: number
}

export interface Order {
  id: string
  orderNumber: number
  table: {
    id: string
    label: string
  }
  items: OrderItem[]
  note?: string
  total: number
  currency: string
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export interface SubmitOrderResponse {
  data: Order
  meta: {
    idempotentReplay: boolean
  }
}

export interface GetOrderResponse {
  data: Order
}

export interface KitchenOrderListResponse {
  data: {
    orders: Order[]
  }
}

export interface SubmitOrderPayload {
  idempotencyKey: string
  note?: string
  items: Array<{
    productId: string
    quantity: number
  }>
}
