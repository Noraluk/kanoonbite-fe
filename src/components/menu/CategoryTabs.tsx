import { ALL_CATEGORIES } from '../../utils/menu'

interface CategoryTabsProps {
  categories: string[]
  activeCategory: string
  onChange: (category: string) => void
}

export function CategoryTabs({ categories, activeCategory, onChange }: CategoryTabsProps) {
  const tabs = [ALL_CATEGORIES, ...new Set(categories)]

  return (
    <div className="category-tabs" role="tablist" aria-label="Menu categories">
      {tabs.map((category) => {
        const isActive = activeCategory === category
        return (
          <button
            key={category}
            type="button"
            role="tab"
            onClick={() => onChange(category)}
            className={isActive ? 'is-active' : ''}
            aria-selected={isActive}
            aria-controls="menu-results"
          >
            {category === ALL_CATEGORIES ? 'All' : category}
          </button>
        )
      })}
    </div>
  )
}
