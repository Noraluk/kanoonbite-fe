import { Beef, CupSoda, Fish, Plus, Soup, Trash2, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { formatOrderPrice } from '../utils/order'
import { AddMenuItemDialog } from './AddMenuItemDialog'
import { useAdminDemoStore } from './adminStore'

function CategoryIcon({ category }: { category: string }) {
  if (category === 'Meat') return <Beef aria-hidden="true" />
  if (category === 'Seafood') return <Fish aria-hidden="true" />
  if (category === 'Sides') return <Soup aria-hidden="true" />
  if (category === 'Drinks') return <CupSoda aria-hidden="true" />
  return <UtensilsCrossed aria-hidden="true" />
}

export function AdminMenuPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const menuItems = useAdminDemoStore((state) => state.menuItems)
  const addMenuItem = useAdminDemoStore((state) => state.addMenuItem)
  const removeMenuItem = useAdminDemoStore((state) => state.removeMenuItem)
  const toggleMenuAvailability = useAdminDemoStore((state) => state.toggleMenuAvailability)

  const handleDelete = (itemId: string, itemName: string) => {
    if (window.confirm(`Delete ${itemName} from the demo menu?`)) removeMenuItem(itemId)
  }

  return (
    <section className="admin-page" aria-labelledby="admin-menu-title">
      <div className="admin-page-heading admin-page-heading--split">
        <div>
          <p className="admin-eyebrow">Guest menu controls</p>
          <h1 id="admin-menu-title">Menu</h1>
          <p>Toggle availability to instantly hide a dish in this admin demo.</p>
        </div>
        <button type="button" className="admin-primary-button admin-add-item" onClick={() => setIsDialogOpen(true)}>
          <Plus aria-hidden="true" size={20} /> Add item
        </button>
      </div>

      <div className="admin-menu-list" aria-label="Menu items">
        {menuItems.map((item) => (
          <article key={item.id} className="admin-menu-row">
            <div className="admin-menu-thumb">
              {item.imageUrl ? <img src={item.imageUrl} alt="" width="62" height="62" loading="lazy" /> : <CategoryIcon category={item.category} />}
            </div>
            <div className="admin-menu-name"><strong>{item.name}</strong><span>{item.category}</span></div>
            <strong className="admin-menu-price">{formatOrderPrice(item.price, 'THB')}</strong>
            <button
              type="button"
              className={item.isAvailable ? 'admin-stock-toggle is-available' : 'admin-stock-toggle'}
              aria-pressed={item.isAvailable}
              onClick={() => toggleMenuAvailability(item.id)}
            >
              <span aria-hidden="true" /> {item.isAvailable ? 'In stock' : 'Sold out'}
            </button>
            <button
              type="button"
              className="admin-delete-button"
              onClick={() => handleDelete(item.id, item.name)}
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 aria-hidden="true" size={20} />
            </button>
          </article>
        ))}
      </div>

      <AddMenuItemDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onAdd={addMenuItem} />
    </section>
  )
}
