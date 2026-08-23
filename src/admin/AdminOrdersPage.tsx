import { useEffect } from 'react'
import { AlertCircle, BellRing, ChefHat, Clock3, LoaderCircle, RefreshCw, Wifi, WifiOff, X } from 'lucide-react'
import type { NextOrderStatus } from '../api/admin.api'
import type { Order, OrderStatus } from '../types/order'
import { formatOrderPrice } from '../utils/order'
import { useKitchenOrders } from './useKitchenOrders'

const statusCopy: Record<OrderStatus, string> = {
  received: 'New',
  preparing: 'Cooking',
  ready: 'Ready',
  completed: 'Served',
  cancelled: 'Cancelled',
}

const actionCopy: Partial<Record<OrderStatus, { label: string; nextStatus: NextOrderStatus }>> = {
  received: { label: 'Start grilling', nextStatus: 'preparing' },
  preparing: { label: 'Mark ready', nextStatus: 'ready' },
  ready: { label: 'Complete order', nextStatus: 'completed' },
}

function summarizeItems(order: Order) {
  const groupedItems = order.items.reduce<Map<string, number>>((items, item) => {
    items.set(item.name, (items.get(item.name) ?? 0) + item.quantity)
    return items
  }, new Map())
  return Array.from(groupedItems, ([name, quantity]) => `${quantity}x ${name}`).join(', ')
}

function formatRelativeTime(createdAt: string) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1_000))
  const elapsedMinutes = Math.max(1, Math.floor(elapsedSeconds / 60))
  if (elapsedMinutes < 60) return `${elapsedMinutes} ${elapsedMinutes === 1 ? 'min' : 'mins'} ago`
  const elapsedHours = Math.floor(elapsedMinutes / 60)
  return `${elapsedHours} ${elapsedHours === 1 ? 'hr' : 'hrs'} ago`
}

export function AdminOrdersPage() {
  const {
    orders,
    isInitialLoading,
    error,
    pendingOrderIds,
    newOrderNotification,
    connectionStatus,
    pollIntervalMs,
    dismissNewOrderNotification,
    refresh,
    updateStatus,
  } = useKitchenOrders()
  const openOrders = orders.filter((order) => ['received', 'preparing', 'ready'].includes(order.status)).length
  const visibleConnectionStatus = isInitialLoading ? 'connecting' : connectionStatus
  const connectionCopy = {
    connecting: 'Connecting to live orders',
    live: 'Live',
    reconnecting: 'Reconnecting — backup refresh is active',
    offline: `Offline — refreshing every ${pollIntervalMs / 1_000} seconds`,
  }[visibleConnectionStatus]

  useEffect(() => {
    if (!newOrderNotification) return
    const timeoutId = window.setTimeout(dismissNewOrderNotification, 8_000)
    return () => window.clearTimeout(timeoutId)
  }, [dismissNewOrderNotification, newOrderNotification])

  return (
    <section className="admin-page admin-orders-page" aria-labelledby="admin-orders-title">
      <div className="admin-page-heading admin-page-heading--split">
        <div>
          <p className="admin-eyebrow">Kitchen counter</p>
          <h1 id="admin-orders-title">Live orders</h1>
        </div>
        <p
          className={`admin-connection-status admin-connection-status--${visibleConnectionStatus}`}
          role="status"
          aria-atomic="true"
        >
          {visibleConnectionStatus === 'live' ? <Wifi aria-hidden="true" size={18} /> : visibleConnectionStatus === 'offline'
            ? <WifiOff aria-hidden="true" size={18} />
            : <RefreshCw aria-hidden="true" className="admin-spin" size={18} />}
          {connectionCopy}
        </p>
      </div>

      {newOrderNotification && (
        <aside className="admin-new-order-notification" role="alert" aria-atomic="true">
          <span className="admin-new-order-notification__icon"><BellRing aria-hidden="true" size={23} /></span>
          <div>
            <strong>{newOrderNotification.count === 1
              ? `New order #${newOrderNotification.orderNumber}`
              : `${newOrderNotification.count} new orders`}</strong>
            <span>{newOrderNotification.count === 1
              ? `Table ${newOrderNotification.tableLabel} just placed an order.`
              : 'New customer orders are ready for the kitchen.'}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss new order notification"
            onClick={dismissNewOrderNotification}
          >
            <X aria-hidden="true" size={20} />
          </button>
        </aside>
      )}

      <div className="admin-stat-grid" aria-label="Order summary">
        <article className="admin-stat-card">
          <ChefHat aria-hidden="true" />
          <div><span>Open orders</span><strong>{isInitialLoading ? '—' : openOrders}</strong></div>
        </article>
        <article className="admin-stat-card admin-stat-card--unavailable">
          <Clock3 aria-hidden="true" />
          <div><span>Served today</span><strong>Not available</strong><small>Metrics API required</small></div>
        </article>
        <article className="admin-stat-card admin-stat-card--unavailable">
          <AlertCircle aria-hidden="true" />
          <div><span>Revenue today</span><strong>Not available</strong><small>Metrics API required</small></div>
        </article>
      </div>

      {error && (
        <div className="admin-api-alert" role="alert">
          <WifiOff aria-hidden="true" />
          <span>{error}</span>
          <button type="button" onClick={refresh}>Retry</button>
        </div>
      )}

      {isInitialLoading ? (
        <div className="admin-orders-loading" role="status">
          <LoaderCircle aria-hidden="true" className="admin-spin" /> Loading live orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="admin-orders-empty">
          <ChefHat aria-hidden="true" size={38} />
          <h2>No orders yet</h2>
          <p>New and completed kitchen orders will appear here automatically.</p>
        </div>
      ) : (
        <div className="admin-order-list" aria-label="Orders">
          {orders.map((order) => {
            const action = actionCopy[order.status]
            const isPending = pendingOrderIds.has(order.id)
            return (
              <article key={order.id} className={`admin-order-card admin-order-card--${order.status}`}>
                <div className="admin-order-number">
                  <strong>#{order.orderNumber}</strong>
                  <span>Table {order.table.label}</span>
                </div>
                <div className="admin-order-items">
                  <strong>{summarizeItems(order)}</strong>
                  <span>{formatRelativeTime(order.createdAt)}</span>
                  {(order.note || order.items.some((item) => item.notes)) && (
                    <small>{order.note || order.items.find((item) => item.notes)?.notes}</small>
                  )}
                </div>
                <span className={`admin-status admin-status--${order.status}`}>{statusCopy[order.status]}</span>
                <div className="admin-order-total">
                  <strong>{formatOrderPrice(order.total, order.currency)}</strong>
                  {action && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => void updateStatus(order.id, action.nextStatus)}
                    >
                      {isPending && <LoaderCircle aria-hidden="true" className="admin-spin" size={17} />}
                      {isPending ? 'Updating…' : action.label}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
