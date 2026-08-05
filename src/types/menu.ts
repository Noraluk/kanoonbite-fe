export type MenuCategory = 'popular' | 'appetizers' | 'mains' | 'desserts'

export interface MenuItem {
  id: string
  name: string
  price: number
  category: MenuCategory
  imageUrl: string
  popular?: boolean
}
