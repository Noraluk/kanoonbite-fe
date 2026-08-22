import { ArrowRight, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/menu/ProductCard'
import { TableRequired } from '../components/menu/TableRequired'
import { menuItems } from '../data/menuItems'
import { useCartStore } from '../store/cartStore'
import type { MenuCategory } from '../types/menu'

interface LayoutContext {
  tableNumber: number | null
}

type MenuFilter = 'all' | MenuCategory

const categories: { id: MenuCategory; label: string; icon: string }[] = [
  { id: 'grill-sets', label: 'Grill Sets', icon: '🔥' },
  { id: 'meat', label: 'Meat', icon: '🥩' },
  { id: 'seafood', label: 'Seafood', icon: '🦐' },
  { id: 'sides', label: 'Sides', icon: '🥗' },
  { id: 'drinks', label: 'Drinks', icon: '🥤' },
]

const categoryTabs: { id: MenuFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  ...categories.map(({ id, label }) => ({ id, label })),
]

export function MenuScreen() {
  const { tableNumber } = useOutletContext<LayoutContext>()
  const [searchParams] = useSearchParams()
  const [activeCategory, setActiveCategory] = useState<MenuFilter>('all')
  const cartItems = useCartStore((state) => state.items)
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (!tableNumber) {
    return <TableRequired invalidTable={searchParams.has('table')} />
  }

  const visibleCategories =
    activeCategory === 'all'
      ? categories
      : categories.filter((category) => category.id === activeCategory)

  return (
    <div className="menu-screen">
      <section className="menu-hero" aria-labelledby="menu-title">
        <div className="menu-hero__meta">
          <span>Table {tableNumber} · Grill</span>
          <span>Dine-in 🔥</span>
        </div>
        <div className="menu-hero__welcome">
          <div className="mascot" aria-hidden="true">🥑</div>
          <div>
            <h1 id="menu-title">Let’s grill!</h1>
            <p>Tap a dish to add it 🍢</p>
          </div>
        </div>
      </section>

      <nav className="category-tabs" aria-label="Menu categories">
        {categoryTabs.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            className={activeCategory === category.id ? 'is-active' : ''}
            aria-pressed={activeCategory === category.id}
            aria-controls="menu-results"
          >
            {category.label}
          </button>
        ))}
      </nav>

      <div id="menu-results" className="menu-sections" aria-live="polite">
        {visibleCategories.map((category) => {
          const items = menuItems.filter((item) => item.category === category.id)
          if (items.length === 0) return null
          return (
            <section key={category.id} id={category.id} className="menu-section">
              <h2>
                <span aria-hidden="true">{category.icon}</span> {category.label}
              </h2>
              <div className="menu-list">
                {items.map((item) => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {itemCount > 0 && (
        <div className="bottom-action-wrap">
          <Link
            to={`/cart?table=${tableNumber}`}
            className="primary-action primary-action--orange"
            aria-label={`Open your grill with ${itemCount} items, total ${total} baht`}
          >
            <span><ShoppingCart aria-hidden="true" size={22} /> Your grill · {itemCount}</span>
            <span>฿{total.toLocaleString('th-TH')} <ArrowRight aria-hidden="true" size={20} /></span>
          </Link>
        </div>
      )}
    </div>
  )
}
