import { Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <div className="app-canvas">
      <div className="app-shell">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <main id="main-content" className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
