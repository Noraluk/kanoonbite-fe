import { Check } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import { useOrderStore } from '../store/orderStore'

interface LayoutContext {
  tableNumber: number | null
}

export function OrderSuccessScreen() {
  const { tableNumber } = useOutletContext<LayoutContext>()
  const order = useOrderStore((state) => state.lastOrder)
  const menuUrl = tableNumber ? `/?table=${tableNumber}` : '/'

  if (!order) {
    return (
      <section className="flow-screen">
        <div className="empty-state">
          <h1>No recent order</h1>
          <Link to={menuUrl} className="outline-action">Back to menu</Link>
        </div>
      </section>
    )
  }

  const dishList = order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')

  return (
    <section className="success-screen" aria-labelledby="success-heading">
      <div className="celebration" aria-hidden="true">🎉</div>
      <h1 id="success-heading">Order placed!</h1>
      <p className="order-meta">Order #{order.orderNumber} · Table {order.tableNumber}</p>

      <div className="status-card" aria-label="Order progress">
        <div className="status-step is-complete">
          <span className="status-dot"><Check aria-hidden="true" size={28} strokeWidth={4} /></span>
          <div><strong>Order received</strong><p>Sent to the kitchen</p></div>
        </div>
        <div className="status-step is-current">
          <span className="status-dot">2</span>
          <div><strong>On the grill</strong><p>The chef is firing up your dishes</p></div>
        </div>
        <div className="status-step">
          <span className="status-dot">3</span>
          <div><strong>Ready — pay at counter</strong><p>Cash, card, or PromptPay</p></div>
        </div>
      </div>

      <div className="receipt-card">
        <h2>Your dishes</h2>
        <p>{dishList}</p>
        <div className="summary-total">
          <span>Pay at counter</span>
          <strong>฿{order.total.toLocaleString('th-TH')}</strong>
        </div>
      </div>

      <div className="bottom-action-wrap bottom-action-wrap--cream">
        <Link to={menuUrl} className="outline-action outline-action--wide">Back to menu</Link>
      </div>
    </section>
  )
}
