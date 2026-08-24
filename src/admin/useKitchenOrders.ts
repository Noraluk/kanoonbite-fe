import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getKitchenOrders, type NextOrderStatus, updateKitchenOrderStatus } from '../api/admin.api'
import { ApiError } from '../types/api'
import type { Order } from '../types/order'
import { useAdminAuthStore } from './adminAuthStore'
import { useKitchenRealtime, type KitchenRealtimeEvent } from './useKitchenRealtime'

const LIVE_POLL_INTERVAL_MS = 30_000
const FALLBACK_POLL_INTERVAL_MS = 4_000
const RATE_LIMIT_PAUSE_MS = 15_000

export interface NewOrderNotification {
  id: string
  count: number
  orderNumber: number
  tableLabel: string
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function mergeOrders(activeOrders: Order[], completedOrders: Order[]) {
  const ordersById = new Map<string, Order>()
  for (const order of [...activeOrders, ...completedOrders]) ordersById.set(order.id, order)
  return Array.from(ordersById.values()).sort((left, right) => {
    const leftIsClosed = left.status === 'completed' || left.status === 'cancelled'
    const rightIsClosed = right.status === 'completed' || right.status === 'cancelled'
    if (leftIsClosed !== rightIsClosed) return leftIsClosed ? 1 : -1

    const createdAtDifference = Date.parse(right.createdAt) - Date.parse(left.createdAt)
    return createdAtDifference || right.orderNumber - left.orderNumber
  })
}

function reconcileRealtimeOrders(apiOrders: Order[], realtimeOrders: Map<string, Order>) {
  const reconciledOrders = [...apiOrders]

  for (const [orderId, realtimeOrder] of realtimeOrders) {
    const apiOrderIndex = reconciledOrders.findIndex((order) => order.id === orderId)
    const apiOrder = reconciledOrders[apiOrderIndex]

    if (apiOrder && Date.parse(apiOrder.updatedAt) >= Date.parse(realtimeOrder.updatedAt)) {
      realtimeOrders.delete(orderId)
      continue
    }

    if (apiOrderIndex >= 0) reconciledOrders[apiOrderIndex] = realtimeOrder
    else reconciledOrders.push(realtimeOrder)
  }

  return mergeOrders(reconciledOrders, [])
}

export function useKitchenOrders() {
  const accessToken = useAdminAuthStore((state) => state.accessToken)
  const venueId = useAdminAuthStore((state) => state.admin?.venueId)
  const signOut = useAdminAuthStore((state) => state.signOut)
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingOrderIds, setPendingOrderIds] = useState<Set<string>>(() => new Set())
  const [newOrderNotification, setNewOrderNotification] = useState<NewOrderNotification | null>(null)
  const requestRef = useRef<AbortController | null>(null)
  const pausedUntilRef = useRef(0)
  const knownOrderIdsRef = useRef<Set<string>>(new Set())
  const hasLoadedOrdersRef = useRef(false)
  const realtimeOrdersRef = useRef<Map<string, Order>>(new Map())

  const abortActiveRequest = useCallback(() => {
    const activeRequest = requestRef.current
    requestRef.current = null
    activeRequest?.abort()
  }, [])

  const handleApiError = useCallback((requestError: unknown, fallbackMessage: string) => {
    if (!(requestError instanceof ApiError)) {
      setError(fallbackMessage)
      return
    }

    if (requestError.status === 401) {
      signOut()
      navigate('/admin/login', { replace: true })
      return
    }
    if (requestError.status === 403) {
      setError('This account does not have permission to access kitchen orders.')
      return
    }
    if (requestError.status === 429) {
      pausedUntilRef.current = Date.now() + RATE_LIMIT_PAUSE_MS
      setError('Too many requests. Polling is paused briefly; please try again later.')
      return
    }
    setError(requestError.status >= 500 ? 'The kitchen service is unavailable. Please retry.' : requestError.message)
  }, [navigate, signOut])

  const refresh = useCallback(async (force = false, preserveError = false) => {
    if (!accessToken) return
    if (!force && (requestRef.current || Date.now() < pausedUntilRef.current)) return
    if (force) {
      pausedUntilRef.current = 0
      abortActiveRequest()
    }

    const controller = new AbortController()
    requestRef.current = controller
    try {
      const activeOrders = await getKitchenOrders(accessToken, undefined, controller.signal)
      const completedOrders = await getKitchenOrders(accessToken, 'completed', controller.signal)
      const apiOrders = mergeOrders(activeOrders, completedOrders)
      // A realtime event can arrive before a read replica exposes the new row.
      // Keep its snapshot until the API returns the same or a newer version.
      const nextOrders = reconcileRealtimeOrders(apiOrders, realtimeOrdersRef.current)
      if (hasLoadedOrdersRef.current) {
        const receivedOrders = nextOrders.filter((order) => (
          order.status === 'received' && !knownOrderIdsRef.current.has(order.id)
        ))
        const latestOrder = receivedOrders[0]
        if (latestOrder) {
          setNewOrderNotification({
            id: latestOrder.id,
            count: receivedOrders.length,
            orderNumber: latestOrder.orderNumber,
            tableLabel: latestOrder.table.label,
          })
        }
      }
      knownOrderIdsRef.current = new Set(nextOrders.map((order) => order.id))
      hasLoadedOrdersRef.current = true
      setOrders(nextOrders)
      if (!preserveError) setError('')
    } catch (requestError) {
      if (!isAbortError(requestError)) handleApiError(requestError, 'Cannot load live orders. Please retry.')
    } finally {
      if (requestRef.current === controller) requestRef.current = null
      setIsInitialLoading(false)
    }
  }, [abortActiveRequest, accessToken, handleApiError])

  const handleRealtimeUnauthorized = useCallback(() => {
    signOut()
    navigate('/admin/login', { replace: true })
  }, [navigate, signOut])

  const handleRealtimeEvent = useCallback((event: KitchenRealtimeEvent) => {
    const realtimeOrder = event.order
    if (realtimeOrder) {
      const pendingRealtimeOrder = realtimeOrdersRef.current.get(realtimeOrder.id)
      if (
        !pendingRealtimeOrder
        || Date.parse(realtimeOrder.updatedAt) >= Date.parse(pendingRealtimeOrder.updatedAt)
      ) {
        realtimeOrdersRef.current.set(realtimeOrder.id, realtimeOrder)
      }
      knownOrderIdsRef.current.add(realtimeOrder.id)
      setOrders((current) => {
        const existing = current.find((order) => order.id === realtimeOrder.id)
        if (existing && Date.parse(existing.updatedAt) > Date.parse(realtimeOrder.updatedAt)) {
          return current
        }
        return mergeOrders(
          [...current.filter((order) => order.id !== realtimeOrder.id), realtimeOrder],
          [],
        )
      })

      if (event.type === 'order.created' && realtimeOrder.status === 'received') {
        setNewOrderNotification((current) => ({
          id: realtimeOrder.id,
          count: (current?.count ?? 0) + 1,
          orderNumber: realtimeOrder.orderNumber,
          tableLabel: realtimeOrder.table.label,
        }))
      }
    }

    // PostgreSQL remains authoritative; reconcile without delaying the UI update.
    void refresh(true)
  }, [refresh])

  const connectionStatus = useKitchenRealtime({
    accessToken,
    enabled: !isInitialLoading,
    venueId,
    // Reconcile after every connection so changes made during a disconnect cannot be missed.
    onConnected: () => { void refresh(true) },
    onEvent: handleRealtimeEvent,
    onUnauthorized: handleRealtimeUnauthorized,
  })

  const pollIntervalMs = connectionStatus === 'live'
    ? LIVE_POLL_INTERVAL_MS
    : FALLBACK_POLL_INTERVAL_MS

  // Initial page load is intentionally independent from the polling timer.
  useEffect(() => {
    void refresh()

    return abortActiveRequest
  }, [abortActiveRequest, refresh])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, pollIntervalMs)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') abortActiveRequest()
      else void refresh()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [abortActiveRequest, pollIntervalMs, refresh])

  const updateStatus = useCallback(async (orderId: string, status: NextOrderStatus) => {
    if (!accessToken) return
    setPendingOrderIds((current) => new Set(current).add(orderId))
    setError('')

    try {
      const updatedOrder = await updateKitchenOrderStatus(accessToken, orderId, status)
      const realtimeOrder = realtimeOrdersRef.current.get(updatedOrder.id)
      const latestOrder = realtimeOrder
        && Date.parse(realtimeOrder.updatedAt) > Date.parse(updatedOrder.updatedAt)
        ? realtimeOrder
        : updatedOrder
      // The PATCH response is authoritative. Retain it while the list endpoint catches up,
      // otherwise a stale GET can immediately revert the card to its previous status.
      realtimeOrdersRef.current.set(updatedOrder.id, latestOrder)
      setOrders((current) => mergeOrders(
        [...current.filter((order) => order.id !== updatedOrder.id), latestOrder],
        [],
      ))
      await refresh(true)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 409) {
        setError('This order was already updated or cannot move to that status. The list has been refreshed.')
        await refresh(true, true)
      } else if (!isAbortError(requestError)) {
        handleApiError(requestError, 'Cannot update this order. Its status was not changed.')
        // A backend side effect can succeed even when its response fails (for example,
        // when publishing the realtime event times out). Reconcile immediately instead
        // of waiting for the next polling interval to reveal the committed status.
        if (!(requestError instanceof ApiError) || requestError.status !== 401) {
          await refresh(true, true)
        }
      }
    } finally {
      setPendingOrderIds((current) => {
        const next = new Set(current)
        next.delete(orderId)
        return next
      })
    }
  }, [accessToken, handleApiError, refresh])

  const dismissNewOrderNotification = useCallback(() => {
    setNewOrderNotification(null)
  }, [])

  return {
    orders,
    isInitialLoading,
    error,
    pendingOrderIds,
    newOrderNotification,
    connectionStatus,
    pollIntervalMs,
    dismissNewOrderNotification,
    refresh: () => refresh(true),
    updateStatus,
  }
}
