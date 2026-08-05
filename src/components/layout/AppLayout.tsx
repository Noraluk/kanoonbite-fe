import { useEffect } from 'react'
import { Search } from 'lucide-react'
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
    if (tableFromUrl) {
      setTableNumber(tableFromUrl)
    } else if (rawTable !== null) {
      clearTable()
    }
  }, [clearTable, rawTable, setTableNumber, tableFromUrl])

  const activeTable = rawTable === null ? tableNumber : tableFromUrl

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-white px-4 py-3 font-medium text-orange-700 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-2 focus:outline-offset-2 focus:outline-orange-600"
      >
        ข้ามไปยังเนื้อหาหลัก
      </a>

      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex min-h-14 max-w-md items-center gap-2 px-4">
          {activeTable && (
            <span className="rounded-md bg-stone-900 px-2 py-1 text-xs font-bold text-white">
              Table {activeTable}
            </span>
          )}
          <span className="font-bold tracking-tight">SiamBite</span>
          <button
            type="button"
            aria-label="ค้นหาเมนู"
            className="ml-auto inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            <Search aria-hidden="true" size={22} />
          </button>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-md">
        <Outlet context={{ tableNumber: activeTable }} />
      </main>
    </div>
  )
}
