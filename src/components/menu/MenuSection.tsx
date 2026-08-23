import type { MenuItem } from '../../types/menu'
import { MenuItemCard } from './MenuItemCard'

interface MenuSectionProps {
  category: string
  items: MenuItem[]
}

export function MenuSection({ category, items }: MenuSectionProps) {
  const headingId = `category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <section className="menu-section" aria-labelledby={headingId}>
      <h2 id={headingId}>{category}</h2>
      <div className="menu-list">
        {items.map((item) => <MenuItemCard key={item.id} item={item} />)}
      </div>
    </section>
  )
}
