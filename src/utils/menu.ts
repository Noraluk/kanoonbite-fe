import type { MenuItem, MenuResponse } from '../types/menu'

export const ALL_CATEGORIES = 'all'

export const formatMenuPrice = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 0,
}).format

export interface MenuSectionData {
  category: string
  items: MenuItem[]
}

export function getMenuSections(menu: MenuResponse, activeCategory: string): MenuSectionData[] {
  const categories = Array.from(new Set([
    ...menu.categories,
    ...menu.items.map((item) => item.category),
  ]))
  const visibleCategories = activeCategory === ALL_CATEGORIES
    ? categories
    : categories.filter((category) => category === activeCategory)

  return visibleCategories
    .map((category) => ({
      category,
      items: menu.items.filter((item) => item.category === category),
    }))
    .filter((section) => section.items.length > 0)
}
