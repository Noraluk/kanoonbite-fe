import { BarChart3, CalendarClock } from 'lucide-react'

export function AdminSalesPage() {
  return (
    <section className="admin-page" aria-labelledby="admin-sales-title">
      <div className="admin-page-heading">
        <p className="admin-eyebrow">Reporting</p>
        <h1 id="admin-sales-title">Sales</h1>
      </div>

      <div className="admin-feature-unavailable">
        <BarChart3 aria-hidden="true" size={42} />
        <h2>Sales metrics are not available yet</h2>
        <p>
          The current Kitchen API only returns active orders. Revenue, served-today,
          date-range, and aggregated statistics need a dedicated metrics endpoint.
        </p>
        <span><CalendarClock aria-hidden="true" size={18} /> This page will be enabled when that endpoint is ready.</span>
      </div>
    </section>
  )
}
