import { Check, Flame, LoaderCircle, ReceiptText, RefreshCw, XCircle } from 'lucide-react'
import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ScanQrAgain } from '../components/menu/ScanQrAgain'
import { useOrderStatus } from '../orders/useOrderStatus'
import { useTableSession } from '../hooks/useTableSession'
import type { OrderStatus } from '../types/order'
import { formatOrderPrice } from '../utils/order'

const steps = [
  { title: 'Order received', subtitle: 'Sent to the kitchen' },
  { title: 'On the grill', subtitle: 'The chef is firing up your dishes' },
  { title: 'Ready — pay at counter', subtitle: 'Cash, card, or PromptPay' },
]

const activeStepByStatus: Partial<Record<OrderStatus, number>> = {
  received: 0,
  preparing: 1,
  ready: 2,
}

function getStatusHeading(status: OrderStatus) {
  switch (status) {
    case 'received': return 'Order received'
    case 'preparing': return 'On the grill'
    case 'ready': return 'Ready for you'
    case 'completed': return 'Order completed'
    case 'cancelled': return 'Order cancelled'
  }
}

export function OrderStatusScreen() {
  const { orderId = null } = useParams()
  const tableSession = useTableSession()
  const { requireNewScan } = tableSession
  const accessToken = tableSession.status === 'authenticated' ? tableSession.session.accessToken : null
  const handleUnauthorized = useCallback(() => {
    requireNewScan('Your table session is no longer active. Please scan the QR code again.')
  }, [requireNewScan])
  const orderState = useOrderStatus({ orderId, accessToken, onUnauthorized: handleUnauthorized })

  if (tableSession.status === 'scan-required') return <ScanQrAgain message={tableSession.message} />

  if (orderState.status === 'loading' || tableSession.status === 'exchanging') {
    return (
      <section className="order-status-feedback" role="status">
        <LoaderCircle aria-hidden="true" className="spin-icon" size={42} />
        <h1>Loading your order…</h1>
      </section>
    )
  }

  if (orderState.status === 'not-found') {
    return (
      <section className="order-status-feedback">
        <ReceiptText aria-hidden="true" size={48} />
        <h1>Order not found</h1>
        <p>{orderState.message}</p>
        <Link to="/menu" className="outline-action">Back to menu</Link>
      </section>
    )
  }

  if (orderState.status === 'error') {
    return (
      <section className="order-status-feedback" role="alert">
        <h1>Status unavailable</h1>
        <p>{orderState.message}</p>
        <button type="button" className="outline-action" onClick={orderState.retry}>
          <RefreshCw aria-hidden="true" size={20} /> Try again
        </button>
      </section>
    )
  }

  if (!orderState.order) return null
  const { order } = orderState
  const activeStep = activeStepByStatus[order.status]
  const isCompleted = order.status === 'completed'
  const isCancelled = order.status === 'cancelled'

  return (
    <section className="success-screen" aria-labelledby="status-heading">
      <div className={`order-state-icon${isCancelled ? ' is-cancelled' : ''}`} aria-hidden="true">
        {isCancelled ? <XCircle size={50} /> : isCompleted ? <Check size={50} /> : <Flame size={48} />}
      </div>
      <h1 id="status-heading">{getStatusHeading(order.status)}</h1>
      <p className="order-meta">Order #{order.orderNumber} · Table {order.table.label}</p>

      {!isCancelled && (
        <div className="status-card" aria-label="Order progress">
          {steps.map((step, index) => {
            const isStepComplete = isCompleted || activeStep !== undefined && index < activeStep
            const isCurrent = activeStep === index
            return (
              <div
                key={step.title}
                className={`status-step${isStepComplete ? ' is-complete' : ''}${isCurrent ? ' is-current' : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className="status-dot">
                  {isStepComplete ? <Check aria-hidden="true" size={27} strokeWidth={4} /> : index + 1}
                </span>
                <div><strong>{step.title}</strong><p>{step.subtitle}</p></div>
              </div>
            )
          })}
        </div>
      )}

      {isCancelled && (
        <div className="status-banner status-banner--cancelled" role="status">
          The kitchen cancelled this order. Please ask our team if you need assistance.
        </div>
      )}

      <div className="receipt-card">
        <h2>Your dishes</h2>
        <ul className="order-dishes">
          {order.items.map((item) => (
            <li key={item.productId}>
              <span>{item.quantity}× {item.name}</span>
              <strong>{formatOrderPrice(item.lineTotal, order.currency)}</strong>
            </li>
          ))}
        </ul>
        {order.note && <p className="order-note"><strong>Kitchen note:</strong> {order.note}</p>}
        <div className="summary-total">
          <span>Total</span>
          <strong>{formatOrderPrice(order.total, order.currency)}</strong>
        </div>
      </div>

      <div className="bottom-action-wrap bottom-action-wrap--cream">
        <Link to="/menu" className="outline-action outline-action--wide">Back to menu</Link>
      </div>
    </section>
  )
}
