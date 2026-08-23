export const PENDING_ORDER_KEY = 'kanoonbite.pendingOrderKey'
export const LAST_ORDER_ID_KEY = 'kanoonbite.lastOrderId'

export function getOrCreateIdempotencyKey() {
  const existingKey = sessionStorage.getItem(PENDING_ORDER_KEY)
  if (existingKey) return existingKey

  const createdKey = crypto.randomUUID()
  sessionStorage.setItem(PENDING_ORDER_KEY, createdKey)
  return createdKey
}

export function clearPendingOrderKey() {
  sessionStorage.removeItem(PENDING_ORDER_KEY)
}

export function saveLastOrderId(orderId: string) {
  sessionStorage.setItem(LAST_ORDER_ID_KEY, orderId)
}
