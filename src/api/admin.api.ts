import type { Order, OrderStatus } from '../types/order'
import { apiRequest } from './client'

export interface AdminIdentity {
  id: string
  email: string
  venueId: string
  role: string
}

interface AdminLoginResponse {
  data: {
    accessToken: string
    tokenType: string
    expiresIn: number
    admin: AdminIdentity
  }
}

interface KitchenOrdersResponse {
  data: {
    orders: Order[]
  }
}

interface KitchenOrderResponse {
  data: Order
}

export type NextOrderStatus = Exclude<OrderStatus, 'received'>

export function loginAdmin(email: string, password: string, signal?: AbortSignal) {
  return apiRequest<AdminLoginResponse>('/api/v1/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    signal,
  })
}

export async function getKitchenOrders(
  accessToken: string,
  status?: OrderStatus,
  signal?: AbortSignal,
) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  const response = await apiRequest<KitchenOrdersResponse>(`/api/v1/kitchen/orders${query}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  })
  return response.data.orders
}

export async function updateKitchenOrderStatus(
  accessToken: string,
  orderId: string,
  status: NextOrderStatus,
  signal?: AbortSignal,
) {
  const response = await apiRequest<KitchenOrderResponse>(
    `/api/v1/kitchen/orders/${encodeURIComponent(orderId)}/status`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
      signal,
    },
  )
  return response.data
}
