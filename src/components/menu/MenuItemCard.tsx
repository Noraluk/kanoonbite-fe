import { Beef, CupSoda, Fish, ImageOff, Minus, Plus, Soup, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '../../store/cartStore'
import type { MenuItem } from '../../types/menu'
import { formatMenuPrice } from '../../utils/menu'

interface MenuItemCardProps {
  item: MenuItem
  onAdd?: (item: MenuItem) => void
}

function isPlaceholderImage(imageUrl: string) {
  try {
    const hostname = new URL(imageUrl).hostname.toLowerCase()
    return hostname === 'placehold.co' || hostname === 'via.placeholder.com'
  } catch {
    return false
  }
}

function CategoryIcon({ item }: { item: MenuItem }) {
  const itemKind = `${item.category} ${item.name}`.toLowerCase()
  if (itemKind.includes('seafood') || itemKind.includes('prawn') || itemKind.includes('squid')) return <Fish aria-hidden="true" />
  if (itemKind.includes('drink')) return <CupSoda aria-hidden="true" />
  if (itemKind.includes('side') || itemKind.includes('rice')) return <Soup aria-hidden="true" />
  if (itemKind.includes('meat') || itemKind.includes('grill')) return <Beef aria-hidden="true" />
  return <UtensilsCrossed aria-hidden="true" />
}

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImageFallback = imageFailed || !item.imageUrl || isPlaceholderImage(item.imageUrl)
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
        {showImageFallback ? (
          <div className="food-image-fallback" role="img" aria-label={`No image available for ${item.name}`}>
            {item.category ? <CategoryIcon item={item} /> : <ImageOff aria-hidden="true" />}
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
