import { Minus, Plus } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import type { MenuItem } from '../../types/menu'

interface ProductCardProps {
  item: MenuItem
}

export function ProductCard({ item }: ProductCardProps) {
  const quantity = useCartStore(
    (state) => state.items.find((cartItem) => cartItem.id === item.id)?.quantity ?? 0,
  )
  const addItem = useCartStore((state) => state.addItem)
  const decreaseItem = useCartStore((state) => state.decreaseItem)

  return (
    <article className="menu-card">
      {item.popular && <span className="popular-badge">POPULAR</span>}
      <div className={`food-art food-art--${item.imageTone}`} aria-hidden="true">
        {item.emoji}
      </div>
      <div className="menu-card__copy">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <strong>฿{item.price.toLocaleString('th-TH')}</strong>
      </div>

      {quantity === 0 ? (
        <button
          type="button"
          onClick={() => addItem(item)}
          aria-label={`Add ${item.name} to your grill`}
          className="round-control round-control--add"
        >
          <Plus aria-hidden="true" size={24} strokeWidth={4} />
        </button>
      ) : (
        <div className="quantity-control" aria-label={`Quantity ${quantity}`}>
          <button
            type="button"
            onClick={() => decreaseItem(item.id)}
            aria-label={`Decrease ${item.name}`}
            className="round-control round-control--minus"
          >
            <Minus aria-hidden="true" size={22} strokeWidth={4} />
          </button>
          <span>{quantity}</span>
          <button
            type="button"
            onClick={() => addItem(item)}
            aria-label={`Increase ${item.name}`}
            className="round-control round-control--add"
          >
            <Plus aria-hidden="true" size={22} strokeWidth={4} />
          </button>
        </div>
      )}
    </article>
  )
}
