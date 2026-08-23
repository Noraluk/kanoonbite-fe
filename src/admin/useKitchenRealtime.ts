import { useEffect, useRef, useState } from 'react'
import { getKitchenRealtimeTicket } from '../api/admin.api'
import { ApiError } from '../types/api'
import type { Order, OrderStatus } from '../types/order'

export type KitchenConnectionStatus = 'connecting' | 'live' | 'reconnecting' | 'offline'

export type KitchenRealtimeEvent = {
  type: 'order.created' | 'order.updated'
  eventId: string
  venueId: string
  orderId: string
  status?: OrderStatus
  occurredAt: string
  updatedAt: string
  order?: Order
}

interface UseKitchenRealtimeOptions {
  accessToken: string | null
  enabled: boolean
  venueId?: string
  onConnected: () => void
  onEvent: (event: KitchenRealtimeEvent) => void
  onUnauthorized: () => void
}

const FIRST_RECONNECT_DELAY_MS = 1_000
const MAX_RECONNECT_DELAY_MS = 30_000
const AUTHENTICATION_CLOSE_CODES = new Set([4_001, 4_003, 4_401, 4_403])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return ['received', 'preparing', 'ready', 'completed', 'cancelled'].includes(String(value))
}

function isOrder(value: unknown, orderId: string): value is Order {
  if (!isRecord(value) || !isRecord(value.table) || !Array.isArray(value.items)) return false
  return value.id === orderId
    && typeof value.orderNumber === 'number'
    && Number.isInteger(value.orderNumber)
    && typeof value.table.id === 'string'
    && typeof value.table.label === 'string'
    && typeof value.total === 'number'
    && typeof value.currency === 'string'
    && isOrderStatus(value.status)
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string'
}

function parseKitchenEvent(data: unknown, venueId?: string): KitchenRealtimeEvent | null {
  if (typeof data !== 'string') return null

  try {
    const event: unknown = JSON.parse(data)
    if (!isRecord(event)) return null
    if (event.type !== 'order.created' && event.type !== 'order.updated') return null
    if (
      typeof event.eventId !== 'string'
      || typeof event.venueId !== 'string'
      || typeof event.orderId !== 'string'
      || typeof event.occurredAt !== 'string'
      || typeof event.updatedAt !== 'string'
      || (venueId && event.venueId !== venueId)
      || (event.type === 'order.updated' && event.status !== undefined && !isOrderStatus(event.status))
      || (event.order !== undefined && !isOrder(event.order, event.orderId))
    ) return null

    return event as KitchenRealtimeEvent
  } catch {
    return null
  }
}

function createWebSocketUrl(websocketUrl: string, ticket: string) {
  const url = new URL(websocketUrl, window.location.origin)
  if (url.protocol === 'https:') url.protocol = 'wss:'
  if (url.protocol === 'http:') url.protocol = 'ws:'
  if (url.protocol !== 'ws:' && url.protocol !== 'wss:') throw new Error('Invalid WebSocket URL')
  url.searchParams.set('ticket', ticket)
  return url.toString()
}

export function useKitchenRealtime({
  accessToken,
  enabled,
  venueId,
  onConnected,
  onEvent,
  onUnauthorized,
}: UseKitchenRealtimeOptions) {
  const [status, setStatus] = useState<KitchenConnectionStatus>('offline')
  const onConnectedRef = useRef(onConnected)
  const onEventRef = useRef(onEvent)
  const onUnauthorizedRef = useRef(onUnauthorized)

  useEffect(() => { onConnectedRef.current = onConnected }, [onConnected])
  useEffect(() => { onEventRef.current = onEvent }, [onEvent])
  useEffect(() => { onUnauthorizedRef.current = onUnauthorized }, [onUnauthorized])

  useEffect(() => {
    if (!enabled || !accessToken || typeof WebSocket === 'undefined') {
      setStatus('offline')
      return
    }

    let disposed = false
    let reconnectAttempt = 0
    let socket: WebSocket | null = null
    let ticketController: AbortController | null = null
    let reconnectTimer: number | null = null

    const clearReconnectTimer = () => {
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer !== null) return
      if (!navigator.onLine) {
        setStatus('offline')
        return
      }

      setStatus('reconnecting')
      const baseDelay = Math.min(FIRST_RECONNECT_DELAY_MS * 2 ** reconnectAttempt, MAX_RECONNECT_DELAY_MS)
      const delay = Math.round(baseDelay * (0.8 + Math.random() * 0.4))
      reconnectAttempt += 1
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null
        void connect()
      }, delay)
    }

    const connect = async () => {
      if (disposed || !navigator.onLine) {
        setStatus('offline')
        return
      }

      setStatus(reconnectAttempt === 0 ? 'connecting' : 'reconnecting')
      ticketController?.abort()
      ticketController = new AbortController()

      try {
        const realtimeTicket = await getKitchenRealtimeTicket(accessToken, ticketController.signal)
        if (disposed) return

        const connectedSocket = new WebSocket(createWebSocketUrl(realtimeTicket.websocketUrl, realtimeTicket.ticket))
        socket = connectedSocket
        connectedSocket.addEventListener('open', () => {
          if (disposed) return
          reconnectAttempt = 0
          setStatus('live')
          onConnectedRef.current()
        })
        connectedSocket.addEventListener('message', (message) => {
          const event = parseKitchenEvent(message.data, venueId)
          if (!event) return

          onEventRef.current(event)
        })
        connectedSocket.addEventListener('close', (closeEvent) => {
          if (socket === connectedSocket) socket = null
          if (disposed) return
          if (AUTHENTICATION_CLOSE_CODES.has(closeEvent.code)) {
            setStatus('offline')
            onUnauthorizedRef.current()
            return
          }
          scheduleReconnect()
        })
        connectedSocket.addEventListener('error', () => connectedSocket.close())
      } catch (error) {
        if (disposed || (error instanceof DOMException && error.name === 'AbortError')) return
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          setStatus('offline')
          onUnauthorizedRef.current()
          return
        }
        scheduleReconnect()
      }
    }

    const handleOffline = () => {
      clearReconnectTimer()
      socket?.close()
      setStatus('offline')
    }
    const handleOnline = () => {
      clearReconnectTimer()
      reconnectAttempt = Math.max(reconnectAttempt, 1)
      void connect()
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    void connect()

    return () => {
      disposed = true
      clearReconnectTimer()
      ticketController?.abort()
      socket?.close(1_000, 'Kitchen page closed')
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [accessToken, enabled, venueId])

  return status
}
