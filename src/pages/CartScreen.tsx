import { ArrowLeft, ArrowRight, Minus, Plus, Trash2 } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import { menuItems } from '../data/menuItems'
import { useCartStore } from '../store/cartStore'

interface LayoutContext {
  tableNumber: number | null
}

export function CartScreen() {
  const { tableNumber } = useOutletContext<LayoutContext>()
  const cartItems = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const decreaseItem = useCartStore((state) => state.decreaseItem)
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const menuUrl = tableNumber ? `/?table=${tableNumber}` : '/'

  return (
    <section className="flow-screen" aria-labelledby="cart-heading">
      <Link to={menuUrl} className="back-link">
        <ArrowLeft aria-hidden="true" size={21} /> Back to menu
      </Link>
      <h1 id="cart-heading" className="flow-title">Your grill <span aria-hidden="true">🛒</span></h1>

      {cartItems.length === 0 ? (
        <div className="empty-state">
          <span aria-hidden="true">🍢</span>
          <h2>Your grill is waiting</h2>
          <p>Add a dish or two, then come back here.</p>
          <Link to={menuUrl} className="outline-action">Back to menu</Link>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {cartItems.map((cartItem) => {
              const menuItem = menuItems.find((item) => item.id === cartItem.id)
              if (!menuItem) return null
              return (
                <article key={cartItem.id} className="cart-card">
                  <div className={`food-art food-art--${menuItem.imageTone}`} aria-hidden="true">
                    {menuItem.emoji}
                  </div>
                  <div className="cart-card__copy">
                    <h2>{cartItem.name}</h2>
                    <p>฿{cartItem.price.toLocaleString('th-TH')} each</p>
                  </div>
                  <div className="cart-card__actions">
                    <div className="quantity-control" aria-label={`Quantity ${cartItem.quantity}`}>
                      <button
                        type="button"
                        onClick={() => decreaseItem(cartItem.id)}
                        aria-label={`Decrease ${cartItem.name}`}
                        className="round-control round-control--minus"
                      >
                        <Minus aria-hidden="true" size={21} strokeWidth={4} />
                      </button>
                      <span>{cartItem.quantity}</span>
                      <button
                        type="button"
                        onClick={() => addItem(menuItem)}
                        aria-label={`Increase ${cartItem.name}`}
                        className="round-control round-control--add"
                      >
                        <Plus aria-hidden="true" size={21} strokeWidth={4} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        for (let index = 0; index < cartItem.quantity; index += 1) decreaseItem(cartItem.id)
                      }}
                      className="remove-button"
                      aria-label={`Remove ${cartItem.name}`}
                    >
                      <Trash2 aria-hidden="true" size={18} /> Remove
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="subtotal-row">
            <span>Subtotal</span>
            <strong>฿{total.toLocaleString('th-TH')}</strong>
          </div>

          <div className="bottom-action-wrap">
            <Link to={`/review?table=${tableNumber}`} className="primary-action">
              <span>Checkout</span>
              <ArrowRight aria-hidden="true" size={24} strokeWidth={3} />
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
