import { useMemo, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/menu/ProductCard'
import { TableRequired } from '../components/menu/TableRequired'
import { menuItems } from '../data/menuItems'
import { useCartStore } from '../store/cartStore'
import type { MenuCategory } from '../types/menu'

interface LayoutContext {
  tableNumber: number | null
}

const categories: { id: MenuCategory; label: string }[] = [
  { id: 'popular', label: 'Popular' },
  { id: 'appetizers', label: 'Appetizers' },
  { id: 'mains', label: 'Mains' },
  { id: 'desserts', label: 'Desserts' },
]

export function MenuScreen() {
  const { tableNumber } = useOutletContext<LayoutContext>()
  const [searchParams] = useSearchParams()
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('popular')
  const cartItems = useCartStore((state) => state.items)

  const visibleItems = useMemo(
    () =>
      activeCategory === 'popular'
        ? menuItems.filter((item) => item.popular)
        : menuItems.filter((item) => item.category === activeCategory),
    [activeCategory],
  )

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const rawTable = searchParams.get('table')

  if (!tableNumber) {
    return <TableRequired invalidTable={rawTable !== null} />
  }

  return (
    <>
      <nav
        aria-label="หมวดหมู่อาหาร"
        className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-stone-200 bg-white px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            aria-pressed={activeCategory === category.id}
            className={[
              'min-h-11 shrink-0 cursor-pointer rounded-full px-5 text-sm font-semibold transition-colors motion-reduce:transition-none',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600',
              activeCategory === category.id
                ? 'bg-orange-600 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200',
            ].join(' ')}
          >
            {category.label}
          </button>
        ))}
      </nav>

      <section className="px-4 pb-32 pt-5" aria-labelledby="menu-heading">
        <h1 id="menu-heading" className="text-sm font-bold uppercase tracking-wider text-stone-400">
          {categories.find((category) => category.id === activeCategory)?.label} Choices
        </h1>
        <div className="mt-4 grid gap-3">
          {visibleItems.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {itemCount > 0 && (
        <Link
          to={`/cart?table=${tableNumber}`}
          aria-label={`เปิดตะกร้า มี ${itemCount} รายการ ยอดรวม ${total.toLocaleString('th-TH')} บาท`}
          className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex min-h-14 w-[calc(100%-2rem)] max-w-[calc(28rem-2rem)] -translate-x-1/2 cursor-pointer items-center justify-center gap-3 rounded-2xl bg-orange-600 px-5 font-bold text-white shadow-[0_12px_28px_rgba(234,88,12,0.3)] transition-colors hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 motion-reduce:transition-none"
        >
          <span className="relative">
            <ShoppingCart aria-hidden="true" size={22} />
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-900 px-1 text-[10px] text-white">
              {itemCount}
            </span>
          </span>
          <span>{total.toLocaleString('th-TH')} ฿</span>
        </Link>
      )}
    </>
  )
}
