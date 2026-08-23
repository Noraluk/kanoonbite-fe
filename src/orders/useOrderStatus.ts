import { useCallback, useEffect, useRef, useState } from 'react'
import { getOrder } from '../api/order.api'
import { clearTableSession } from '../auth/table-session.storage'
import { ApiError } from '../types/api'
import type { Order } from '../types/order'

type OrderStatusState =
  | { status: 'loading'; order: null; message: null }
  | { status: 'ready'; order: Order; message: null }
  | { status: 'not-found' | 'error'; order: null; message: string }

interface UseOrderStatusOptions {
  orderId: string | null
  accessToken: string | null
  onUnauthorized: () => void
  pollDelay?: number
}

const ACTIVE_STATUSES = new Set(['received', 'preparing', 'ready'])

function getStatusErrorMessage(error: unknown) {
  if (error instanceof ApiError && ['ORDER_RATE_LIMITED', 'RATE_LIMITED'].includes(error.code)) {
    return 'Status updates are busy. We will try again shortly.'
  }
  return 'We could not refresh your order status. Please try again.'
}

export function useOrderStatus({
  orderId,
  accessToken,
  onUnauthorized,
  pollDelay = 4_000,
}: UseOrderStatusOptions) {
  const [state, setState] = useState<OrderStatusState>({ status: 'loading', order: null, message: null })
  const [retryVersion, setRetryVersion] = useState(0)
  const onUnauthorizedRef = useRef(onUnauthorized)

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized
  }, [onUnauthorized])

  useEffect(() => {
    if (!orderId || !accessToken) return

    let active = true
    let requestController: AbortController | null = null
    let pollTimer: ReturnType<typeof setTimeout> | null = null

    const poll = async () => {
      requestController = new AbortController()
      try {
        const order = await getOrder(orderId, accessToken, requestController.signal)
        if (!active) return
        setState({ status: 'ready', order, message: null })
        if (ACTIVE_STATUSES.has(order.status)) {
          pollTimer = setTimeout(() => void poll(), pollDelay)
        }
      } catch (error: unknown) {
        if (!active || (error instanceof DOMException && error.name === 'AbortError')) return
        if (error instanceof ApiError && error.status === 401) {
          clearTableSession()
          onUnauthorizedRef.current()
          return
        }
        if (error instanceof ApiError && error.code === 'ORDER_NOT_FOUND') {
          setState({ status: 'not-found', order: null, message: 'This order could not be found for your table session.' })
          return
        }
        setState({ status: 'error', order: null, message: getStatusErrorMessage(error) })
        pollTimer = setTimeout(() => void poll(), pollDelay)
      }
    }

    void poll()
    return () => {
      active = false
      if (pollTimer) clearTimeout(pollTimer)
      requestController?.abort()
    }
  }, [accessToken, orderId, pollDelay, retryVersion])

  const retry = useCallback(() => {
    setState({ status: 'loading', order: null, message: null })
    setRetryVersion((version) => version + 1)
  }, [])

  return { ...state, retry }
}
