export type MenuCategory = 'grill-sets' | 'meat' | 'seafood' | 'sides' | 'drinks'

export interface MenuItem {
  id: string
  name: string
  price: number
  category: MenuCategory
  description: string
  emoji: string
  imageTone: 'yellow' | 'pink' | 'blue' | 'green' | 'peach'
  popular?: boolean
}
