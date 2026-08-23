import type { CartItem } from '../types/cart'
import type { GetOrderResponse, SubmitOrderPayload, SubmitOrderResponse } from '../types/order'
import { apiRequest } from './client'

export function buildSubmitOrderPayload(
  cart: CartItem[],
  note: string,
  idempotencyKey: string,
): SubmitOrderPayload {
  const trimmedNote = note.trim()
  return {
    idempotencyKey,
    ...(trimmedNote ? { note: trimmedNote } : {}),
    items: cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  }
}

export function submitOrder(
  accessToken: string,
  cart: CartItem[],
  note: string,
  idempotencyKey: string,
  signal?: AbortSignal,
) {
  return apiRequest<SubmitOrderResponse>('/api/v1/customer/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildSubmitOrderPayload(cart, note, idempotencyKey)),
    signal,
  })
}

export async function getOrder(orderId: string, accessToken: string, signal?: AbortSignal) {
  const response = await apiRequest<GetOrderResponse>(
    `/api/v1/customer/orders/${encodeURIComponent(orderId)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    },
  )
  return response.data
}
