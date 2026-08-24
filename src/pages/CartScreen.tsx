import { ArrowLeft, ArrowRight, Beef, Fish, ImageOff, Minus, Plus, ShoppingCart, Soup, Trash2, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getValidTableSession } from '../auth/table-session.storage'
import { ScanQrAgain } from '../components/menu/ScanQrAgain'
import { useCartStore } from '../store/cartStore'
import { formatMenuPrice } from '../utils/menu'

function isPlaceholderImage(imageUrl: string) {
  try {
    const hostname = new URL(imageUrl).hostname.toLowerCase()
    return hostname === 'placehold.co' || hostname === 'via.placeholder.com'
  } catch {
    return false
  }
}

function CartItemIcon({ name }: { name: string }) {
  const itemName = name.toLowerCase()
  if (itemName.includes('seafood') || itemName.includes('prawn') || itemName.includes('squid')) return <Fish aria-hidden="true" />
  if (itemName.includes('vegetable') || itemName.includes('rice') || itemName.includes('side')) return <Soup aria-hidden="true" />
  return <Beef aria-hidden="true" />
}

export function CartScreen() {
  const tableSession = getValidTableSession()
  const cartItems = useCartStore((state) => state.items)
  const increaseItem = useCartStore((state) => state.increaseItem)
  const decreaseItem = useCartStore((state) => state.decreaseItem)
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const menuUrl = '/menu'

  if (!tableSession) {
    return <ScanQrAgain message="Your table session has expired. Please scan the QR code again." />
  }

  return (
    <section className="flow-screen" aria-labelledby="cart-heading">
      <Link to={menuUrl} className="back-link">
        <ArrowLeft aria-hidden="true" size={21} /> Back to menu
      </Link>
      <h1 id="cart-heading" className="flow-title">
        Your grill <ShoppingCart className="flow-title__icon" aria-hidden="true" />
      </h1>

      {cartItems.length === 0 ? (
        <div className="empty-state">
          <Utensils aria-hidden="true" size={58} />
          <h2>Your grill is waiting</h2>
          <p>Add a dish or two, then come back here.</p>
          <Link to={menuUrl} className="outline-action">Back to menu</Link>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {cartItems.map((cartItem) => {
              const showImageFallback = !cartItem.imageUrl || isPlaceholderImage(cartItem.imageUrl)
              return (
                <article key={cartItem.productId} className="cart-card">
                  <div className="food-image-wrap food-image-wrap--cart">
                    {showImageFallback ? (
                      <div className="food-image-fallback" role="img" aria-label={`No image available for ${cartItem.name}`}>
                        {cartItem.name ? <CartItemIcon name={cartItem.name} /> : <ImageOff aria-hidden="true" />}
                      </div>
                    ) : (
                      <img className="food-image" src={cartItem.imageUrl} alt="" loading="lazy" />
                    )}
                  </div>
                  <div className="cart-card__copy">
                    <h2>{cartItem.name}</h2>
                    <p>{formatMenuPrice(cartItem.price)} each</p>
                  </div>
                  <div className="cart-card__actions">
                    <div className="quantity-control" aria-label={`Quantity ${cartItem.quantity}`}>
                      <button
                        type="button"
                        onClick={() => decreaseItem(cartItem.productId)}
                        aria-label={`Decrease ${cartItem.name}`}
                        className="round-control round-control--minus"
                      >
                        <Minus aria-hidden="true" size={21} strokeWidth={4} />
                      </button>
                      <span>{cartItem.quantity}</span>
                      <button
                        type="button"
                        onClick={() => increaseItem(cartItem.productId)}
                        aria-label={`Increase ${cartItem.name}`}
                        className="round-control round-control--add"
                      >
                        <Plus aria-hidden="true" size={21} strokeWidth={4} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        for (let index = 0; index < cartItem.quantity; index += 1) decreaseItem(cartItem.productId)
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
            <strong>{formatMenuPrice(total)}</strong>
          </div>

          <div className="bottom-action-wrap">
            <Link to="/review" className="primary-action">
              <span>Checkout</span>
              <ArrowRight aria-hidden="true" size={24} strokeWidth={3} />
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
