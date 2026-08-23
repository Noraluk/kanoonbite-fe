import { ImageOff, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '../../store/cartStore'
import type { MenuItem } from '../../types/menu'
import { formatMenuPrice } from '../../utils/menu'

interface MenuItemCardProps {
  item: MenuItem
  onAdd?: (item: MenuItem) => void
}

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const quantity = useCartStore(
    (state) => state.items.find((cartItem) => cartItem.productId === item.id)?.quantity ?? 0,
  )
  const addItem = useCartStore((state) => state.addItem)
  const decreaseItem = useCartStore((state) => state.decreaseItem)

  const handleAdd = () => {
    addItem(item)
    onAdd?.(item)
  }

  return (
    <article className="menu-card">
      {item.isPopular && <span className="popular-badge">POPULAR</span>}
      <div className="food-image-wrap">
        {imageFailed || !item.imageUrl ? (
          <div className="food-image-fallback" role="img" aria-label={`No image available for ${item.name}`}>
            <ImageOff aria-hidden="true" size={30} />
          </div>
        ) : (
          <img
            className="food-image"
            src={item.imageUrl}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>
      <div className="menu-card__copy">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <strong>{formatMenuPrice(item.price)}</strong>
      </div>

      {quantity === 0 ? (
        <button
          type="button"
          onClick={handleAdd}
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
          <span aria-live="polite">{quantity}</span>
          <button
            type="button"
            onClick={handleAdd}
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
