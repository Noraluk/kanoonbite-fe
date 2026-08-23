export interface MenuItem {
  id: string
  name: string
  description: string
  category: string
  imageUrl: string
  isPopular: boolean
  price: number
}

export interface MenuResponse {
  categories: string[]
  items: MenuItem[]
}
