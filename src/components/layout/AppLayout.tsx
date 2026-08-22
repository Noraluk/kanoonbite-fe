import { useEffect } from 'react'
import { Outlet, useSearchParams } from 'react-router-dom'
import { useOrderSessionStore } from '../../store/orderSessionStore'

function parseTableNumber(value: string | null) {
  if (!value || !/^[1-9]\d{0,2}$/.test(value)) return null
  return Number(value)
}

export function AppLayout() {
  const [searchParams] = useSearchParams()
  const rawTable = searchParams.get('table')
  const tableFromUrl = parseTableNumber(rawTable)
  const tableNumber = useOrderSessionStore((state) => state.tableNumber)
  const setTableNumber = useOrderSessionStore((state) => state.setTableNumber)
  const clearTable = useOrderSessionStore((state) => state.clearTable)

  useEffect(() => {
    if (tableFromUrl) setTableNumber(tableFromUrl)
    else if (rawTable !== null) clearTable()
  }, [clearTable, rawTable, setTableNumber, tableFromUrl])

  const activeTable = rawTable === null ? tableNumber : tableFromUrl

  return (
    <div className="app-canvas">
      <div className="app-shell">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <main id="main-content" className="app-content">
          <Outlet context={{ tableNumber: activeTable }} />
        </main>
      </div>
    </div>
  )
}
