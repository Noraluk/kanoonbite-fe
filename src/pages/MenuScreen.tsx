import { ArrowRight, RefreshCw, ShoppingCart } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { CategoryTabs } from '../components/menu/CategoryTabs'
import { MenuSection } from '../components/menu/MenuSection'
import { MenuSkeleton } from '../components/menu/MenuSkeleton'
import { ScanQrAgain } from '../components/menu/ScanQrAgain'
import { useMenu } from '../hooks/useMenu'
import { useTableSession } from '../hooks/useTableSession'
import { useCartStore } from '../store/cartStore'
import { ALL_CATEGORIES, formatMenuPrice, getMenuSections } from '../utils/menu'

export function MenuScreen() {
  const tableSession = useTableSession()
  const { requireNewScan } = tableSession
  const accessToken = tableSession.status === 'authenticated' ? tableSession.session.accessToken : null
  const handleUnauthorized = useCallback(() => {
    requireNewScan('Your table session has expired or is no longer active. Please scan the QR code again.')
  }, [requireNewScan])
  const menuState = useMenu(accessToken, handleUnauthorized)
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES)
  const cartItems = useCartStore((state) => state.items)
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (tableSession.status === 'scan-required') {
    return <ScanQrAgain message={tableSession.message} />
  }

  const tableLabel = tableSession.status === 'authenticated' ? tableSession.session.table.label : null
  const sections = menuState.status === 'ready'
    ? getMenuSections(menuState.menu, activeCategory)
    : []

  return (
    <div className="menu-screen">
      <section className="menu-hero" aria-labelledby="menu-title">
        <div className="menu-hero__meta">
          <span>{tableLabel ? `Table ${tableLabel}` : 'Opening your table…'}</span>
          <span>Dine-in</span>
        </div>
        <div className="menu-hero__welcome">
          <div>
            <h1 id="menu-title">Let’s grill!</h1>
            <p>Choose a dish and add it to your grill.</p>
          </div>
        </div>
      </section>

      {(tableSession.status === 'exchanging' || menuState.status === 'idle' || menuState.status === 'loading') && (
        <MenuSkeleton />
      )}

      {menuState.status === 'error' && (
        <div className="menu-feedback" role="alert">
          <h2>Menu unavailable</h2>
          <p>{menuState.message}</p>
          <button type="button" className="outline-action" onClick={menuState.retry}>
            <RefreshCw aria-hidden="true" size={20} /> Try again
          </button>
        </div>
      )}

      {menuState.status === 'ready' && menuState.menu.items.length === 0 && (
        <div className="menu-feedback">
          <h2>No dishes available</h2>
          <p>The kitchen has not published any menu items yet. Please check again shortly.</p>
          <button type="button" className="outline-action" onClick={menuState.retry}>
            <RefreshCw aria-hidden="true" size={20} /> Refresh menu
          </button>
        </div>
      )}

      {menuState.status === 'ready' && menuState.menu.items.length > 0 && (
        <>
          <CategoryTabs
            categories={menuState.menu.categories}
            activeCategory={activeCategory}
            onChange={setActiveCategory}
          />
          <div id="menu-results" className="menu-sections" role="tabpanel" aria-live="polite">
            {sections.map((section) => (
              <MenuSection key={section.category} category={section.category} items={section.items} />
            ))}
          </div>
        </>
      )}

      {itemCount > 0 && (
        <div className="bottom-action-wrap">
          <Link
            to="/cart"
            className="primary-action primary-action--orange"
            aria-label={`Open your grill with ${itemCount} items, total ${formatMenuPrice(total)}`}
          >
            <span><ShoppingCart aria-hidden="true" size={22} /> Your grill · {itemCount}</span>
            <span>{formatMenuPrice(total)} <ArrowRight aria-hidden="true" size={20} /></span>
          </Link>
        </div>
      )}
    </div>
  )
}
