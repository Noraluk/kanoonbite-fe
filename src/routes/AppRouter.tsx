import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../admin/AdminLayout'
import { AdminLoginPage } from '../admin/AdminLoginPage'
import { AdminMenuPage } from '../admin/AdminMenuPage'
import { AdminOrdersPage } from '../admin/AdminOrdersPage'
import { AdminProtectedRoute } from '../admin/AdminProtectedRoute'
import { AdminSalesPage } from '../admin/AdminSalesPage'
import '../admin/admin.css'
import { AppLayout } from '../components/layout/AppLayout'
import { CartScreen } from '../pages/CartScreen'
import { MenuScreen } from '../pages/MenuScreen'
import { NotFoundScreen } from '../pages/NotFoundScreen'
import { OrderStatusScreen } from '../pages/OrderStatusScreen'
import { ReviewScreen } from '../pages/ReviewScreen'

export function AppRouter() {
  return (
    <Routes>
      <Route path="admin/login" element={<AdminLoginPage />} />
      <Route path="admin" element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="menu" element={<AdminMenuPage />} />
          <Route path="sales" element={<AdminSalesPage />} />
        </Route>
      </Route>
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
