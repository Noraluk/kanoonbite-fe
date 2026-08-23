import type { AdminMenuItem, AdminOrder } from './types'

export const initialAdminOrders: AdminOrder[] = [
  {
    id: 'admin-order-104',
    orderNumber: 104,
    tableLabel: '7',
    items: [
      { name: 'Premium Beef Set', quantity: 1 },
      { name: 'Thai Iced Tea', quantity: 2 },
    ],
    total: 529,
    status: 'received',
    minutesAgo: 1,
  },
  {
    id: 'admin-order-103',
    orderNumber: 103,
    tableLabel: '9',
    items: [{ name: 'Pork Value Set', quantity: 2 }],
    total: 598,
    status: 'received',
    minutesAgo: 3,
  },
  {
    id: 'admin-order-102',
    orderNumber: 102,
    tableLabel: '4',
    items: [
      { name: 'Seafood Grill Set', quantity: 1 },
      { name: 'Golden Garlic Rice', quantity: 1 },
      { name: 'Draft Beer', quantity: 2 },
    ],
    total: 638,
    status: 'preparing',
    minutesAgo: 8,
  },
  {
    id: 'admin-order-101',
    orderNumber: 101,
    tableLabel: '2',
    items: [
      { name: 'Mixed Party Set', quantity: 1 },
      { name: 'Coconut Water', quantity: 3 },
    ],
    total: 719,
    status: 'completed',
    minutesAgo: 14,
  },
]

export const initialAdminMenuItems: AdminMenuItem[] = [
  { id: 'menu-1', name: 'Pork Value Set', category: 'Grill Sets', price: 299, imageUrl: '', isAvailable: true },
  { id: 'menu-2', name: 'Premium Beef Set', category: 'Grill Sets', price: 459, imageUrl: '', isAvailable: true },
  { id: 'menu-3', name: 'Seafood Grill Set', category: 'Grill Sets', price: 399, imageUrl: '', isAvailable: true },
  { id: 'menu-4', name: 'Mixed Party Set', category: 'Grill Sets', price: 599, imageUrl: '', isAvailable: true },
  { id: 'menu-5', name: 'Pork Belly Slices', category: 'Meat', price: 99, imageUrl: '', isAvailable: true },
  { id: 'menu-6', name: 'Marinated Chicken', category: 'Meat', price: 79, imageUrl: '', isAvailable: true },
  { id: 'menu-7', name: 'Marbled Beef Slices', category: 'Meat', price: 159, imageUrl: '', isAvailable: false },
  { id: 'menu-8', name: 'Tiger Prawns', category: 'Seafood', price: 149, imageUrl: '', isAvailable: true },
  { id: 'menu-9', name: 'Fresh Squid', category: 'Seafood', price: 119, imageUrl: '', isAvailable: false },
  { id: 'menu-10', name: 'Golden Garlic Rice', category: 'Sides', price: 69, imageUrl: '', isAvailable: true },
]
