import { Flame, LogOut, Menu as MenuIcon, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAdminAuthStore } from './adminAuthStore'

const adminNavigation = [
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/menu', label: 'Menu' },
  { to: '/admin/sales', label: 'Sales' },
]

export function AdminLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const signOut = useAdminAuthStore((state) => state.signOut)
  const adminEmail = useAdminAuthStore((state) => state.admin?.email)
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-root">
      <a href="#admin-main" className="skip-link">Skip to admin content</a>
      <header className="admin-header">
        <NavLink to="/admin/orders" className="admin-brand" aria-label="Kanoonbite Admin home">
          <Flame aria-hidden="true" size={26} fill="currentColor" />
          <strong>Kanoonbite</strong>
          <span>Admin</span>
        </NavLink>

        <button
          type="button"
          className="admin-mobile-menu"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="admin-navigation"
          aria-label={isMenuOpen ? 'Close admin navigation' : 'Open admin navigation'}
        >
          {isMenuOpen ? <X aria-hidden="true" /> : <MenuIcon aria-hidden="true" />}
        </button>

        <nav id="admin-navigation" className={isMenuOpen ? 'admin-nav is-open' : 'admin-nav'} aria-label="Admin sections">
          {adminNavigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) => isActive ? 'is-active' : undefined}
            >
              {item.label}
            </NavLink>
          ))}
          <button type="button" onClick={handleSignOut} className="admin-mobile-signout">
            <LogOut aria-hidden="true" size={19} /> Sign out {adminEmail ? `(${adminEmail})` : ''}
          </button>
        </nav>

        <div className="admin-account">
          <span className="admin-account__name">{adminEmail}</span>
          <button type="button" onClick={handleSignOut} className="admin-signout">
            <LogOut aria-hidden="true" size={19} /> Sign out
          </button>
        </div>
      </header>

      <main id="admin-main" className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
