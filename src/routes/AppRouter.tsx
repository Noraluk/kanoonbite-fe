import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { CartScreen } from '../pages/CartScreen'
import { MenuScreen } from '../pages/MenuScreen'
import { NotFoundScreen } from '../pages/NotFoundScreen'
import { OrderSuccessScreen } from '../pages/OrderSuccessScreen'
import { ReviewScreen } from '../pages/ReviewScreen'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<MenuScreen />} />
        <Route path="cart" element={<CartScreen />} />
        <Route path="review" element={<ReviewScreen />} />
        <Route path="success" element={<OrderSuccessScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
    </Routes>
  )
}
