import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuthStore } from './adminAuthStore'

export function AdminProtectedRoute() {
  const accessToken = useAdminAuthStore((state) => state.accessToken)
  const expiresAt = useAdminAuthStore((state) => state.expiresAt)
  const signOut = useAdminAuthStore((state) => state.signOut)
  const location = useLocation()
  const hasValidSession = Boolean(accessToken && expiresAt && expiresAt > Date.now())

  useEffect(() => {
    if (accessToken && !hasValidSession) signOut()
  }, [accessToken, hasValidSession, signOut])

  if (!hasValidSession) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
