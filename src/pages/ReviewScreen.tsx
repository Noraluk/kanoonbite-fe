import { ArrowLeft, Flame, LoaderCircle, Ticket } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getValidTableSession } from '../auth/table-session.storage'
import { ScanQrAgain } from '../components/menu/ScanQrAgain'
import { useSubmitOrder } from '../orders/useSubmitOrder'
import { useCartStore } from '../store/cartStore'
import type { Order } from '../types/order'
import { formatMenuPrice } from '../utils/menu'

export function ReviewScreen() {
  const tableSession = getValidTableSession()
  const [note, setNote] = useState('')
  const navigate = useNavigate()
  const cartItems = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartUrl = '/cart'

  const handleSuccess = useCallback((order: Order) => {
    clearCart()
    navigate(`/orders/${order.id}`, { replace: true })
  }, [clearCart, navigate])
  const handleUnauthorized = useCallback(() => navigate('/menu', { replace: true }), [navigate])
  const { submit, isSubmitting, error } = useSubmitOrder({
    accessToken: tableSession?.accessToken ?? null,
    onSuccess: handleSuccess,
    onUnauthorized: handleUnauthorized,
  })

  if (!tableSession) {
    return <ScanQrAgain message="Your table session has expired. Please scan the QR code again." />
  }

  return (
    <section className="flow-screen review-screen" aria-labelledby="review-heading">
      <Link to={cartUrl} className="back-link">
        <ArrowLeft aria-hidden="true" size={21} /> Back to order
      </Link>
      <h1 id="review-heading" className="flow-title">Review &amp; place</h1>

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
                <li key={item.productId}>
                  <span className="review-item__details">
                    <span><b>{item.quantity}×</b> {item.name}</span>
                    <small>{formatMenuPrice(item.price)} each</small>
                  </span>
                  <strong>{formatMenuPrice(item.price * item.quantity)}</strong>
                </li>
              ))}
            </ul>
            <div className="summary-total">
              <span>Subtotal</span>
              <strong>{formatMenuPrice(total)}</strong>
            </div>
          </div>

          <div className="review-form">
            <label htmlFor="table-number">Table</label>
            <input id="table-number" value={tableSession?.table.label ?? ''} readOnly />

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
            <Ticket aria-hidden="true" size={26} />
            <p>The kitchen fires up as soon as you place the order. Pay at the counter when you’re done — cash, card, or PromptPay.</p>
          </aside>

          {error && (
            <div className={`submit-error submit-error--${error.kind}`} role="alert">
              <p>{error.message}</p>
              {error.kind === 'unavailable' && <Link to={cartUrl}>Back to cart</Link>}
            </div>
          )}

          <div className="bottom-action-wrap">
            <button
              type="button"
              onClick={() => void submit(cartItems, note)}
              className="primary-action"
              disabled={isSubmitting || error?.kind === 'unavailable'}
              aria-busy={isSubmitting}
            >
              <span>
                {isSubmitting
                  ? <LoaderCircle aria-hidden="true" className="spin-icon" size={22} />
                  : <Flame aria-hidden="true" size={22} fill="currentColor" />}
                {isSubmitting ? 'Placing order…' : error ? 'Retry order' : 'Place order'}
              </span>
              <span>{formatMenuPrice(total)}</span>
            </button>
          </div>
        </>
      )}
    </section>
  )
}
