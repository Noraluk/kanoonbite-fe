import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { CartScreen } from '../pages/CartScreen'
import { MenuScreen } from '../pages/MenuScreen'
import { NotFoundScreen } from '../pages/NotFoundScreen'
import { OrderStatusScreen } from '../pages/OrderStatusScreen'
import { ReviewScreen } from '../pages/ReviewScreen'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<MenuScreen />} />
        <Route path="menu" element={<MenuScreen />} />
        <Route path="cart" element={<CartScreen />} />
        <Route path="review" element={<ReviewScreen />} />
        <Route path="orders/:orderId" element={<OrderStatusScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
    </Routes>
  )
}
