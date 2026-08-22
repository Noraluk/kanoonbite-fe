import { ArrowLeft, Flame } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useOrderStore } from '../store/orderStore'

interface LayoutContext {
  tableNumber: number | null
}

export function ReviewScreen() {
  const { tableNumber } = useOutletContext<LayoutContext>()
  const [note, setNote] = useState('')
  const navigate = useNavigate()
  const cartItems = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const placeOrder = useOrderStore((state) => state.placeOrder)
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartUrl = `/cart${tableNumber ? `?table=${tableNumber}` : ''}`

  const handlePlaceOrder = () => {
    if (!tableNumber || cartItems.length === 0) return
    placeOrder(cartItems, tableNumber, total)
    clearCart()
    navigate(`/success?table=${tableNumber}`)
  }

  return (
    <section className="flow-screen review-screen" aria-labelledby="review-heading">
      <Link to={cartUrl} className="back-link">
        <ArrowLeft aria-hidden="true" size={21} /> Back to order
      </Link>
      <h1 id="review-heading" className="flow-title">Review &amp; place <span aria-hidden="true">🍢</span></h1>

      {cartItems.length === 0 ? (
        <div className="empty-state">
          <h2>There’s nothing to review yet</h2>
          <Link to={cartUrl} className="outline-action">Back to your grill</Link>
        </div>
      ) : (
        <>
          <div className="order-summary-card">
            <ul>
              {cartItems.map((item) => (
                <li key={item.id}>
                  <span><b>{item.quantity}x</b> {item.name}</span>
                  <strong>฿{(item.price * item.quantity).toLocaleString('th-TH')}</strong>
                </li>
              ))}
            </ul>
            <div className="summary-total">
              <span>Subtotal</span>
              <strong>฿{total.toLocaleString('th-TH')}</strong>
            </div>
          </div>

          <div className="review-form">
            <label htmlFor="table-number">Table number</label>
            <input id="table-number" value={tableNumber ?? ''} readOnly inputMode="numeric" />

            <label htmlFor="kitchen-note">Note for the kitchen (optional)</label>
            <textarea
              id="kitchen-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="E.g. no peanuts, please"
              rows={3}
            />
          </div>

          <aside className="payment-note">
            <span aria-hidden="true">🎫</span>
            <p>The kitchen fires up as soon as you place the order. Pay at the counter when you’re done — cash, card, or PromptPay.</p>
          </aside>

          <div className="bottom-action-wrap">
            <button type="button" onClick={handlePlaceOrder} className="primary-action">
              <span><Flame aria-hidden="true" size={22} fill="currentColor" /> Place order</span>
              <span>฿{total.toLocaleString('th-TH')}</span>
            </button>
          </div>
        </>
      )}
    </section>
  )
}
