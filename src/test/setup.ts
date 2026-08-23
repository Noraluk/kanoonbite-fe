import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { resetTableSessionExchangeCache } from '../api/table-session.api'
import { clearConsumedQrCode } from '../auth/qr-fragment'
import { clearTableSession } from '../auth/table-session.storage'
import { useCartStore } from '../store/cartStore'
import { LAST_ORDER_ID_KEY, PENDING_ORDER_KEY } from '../orders/order-idempotency'
import { useAdminAuthStore } from '../admin/adminAuthStore'
import { useAdminDemoStore } from '../admin/adminStore'

afterEach(() => {
  cleanup()
  resetTableSessionExchangeCache()
  clearConsumedQrCode()
  clearTableSession()
  sessionStorage.removeItem(PENDING_ORDER_KEY)
  sessionStorage.removeItem(LAST_ORDER_ID_KEY)
  useCartStore.setState({ items: [] })
  useAdminAuthStore.setState({ accessToken: null, expiresAt: null, admin: null })
  useAdminDemoStore.getState().resetDemoData()
  sessionStorage.removeItem('kanoonbite.adminSession')
  window.history.replaceState({}, '', '/')
})
