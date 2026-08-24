import { StrictMode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { readAndRemoveQrCode } from '../auth/qr-fragment'
import {
  getValidTableSession,
  saveTableSession,
  TABLE_SESSION_STORAGE_KEYS,
} from '../auth/table-session.storage'
import { MenuScreen } from '../pages/MenuScreen'
import type { MenuResponse } from '../types/menu'
import type { TableSession, TableSessionResponse } from '../types/table-session'
import { formatMenuPrice, getMenuSections } from '../utils/menu'

const tableSession: TableSession = {
  accessToken: 'customer-jwt',
  tokenType: 'Bearer',
  expiresIn: 10_800,
  expiresAt: '2099-08-23T03:00:00.000Z',
  sessionId: 'session-123',
  table: { id: 'table-123', label: 'A01' },
}

const menu: MenuResponse = {
  categories: ['Grill Sets', 'Seafood'],
  items: [
    {
      id: 'pork-set',
      name: 'Pork Value Set',
      description: 'Pork shoulder and vegetables',
      category: 'Grill Sets',
      imageUrl: 'https://images.example.com/pork.jpg',
      isPopular: true,
      price: 299,
    },
    {
      id: 'prawns',
      name: 'Garlic Prawns',
      description: 'Prawns with garlic butter',
      category: 'Seafood',
      imageUrl: 'https://images.example.com/prawns.jpg',
      isPopular: false,
      price: 229,
    },
  ],
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderMenu(strict = false) {
  const content = <MemoryRouter><MenuScreen /></MemoryRouter>
  return render(strict ? <StrictMode>{content}</StrictMode> : content)
}

describe('customer table session flow', () => {
  it('reads the QR from the URL fragment and removes the secret from the address bar', () => {
    window.history.replaceState({}, '', '/menu#qr=kbq_table.random-secret&campaign=dine-in')

    const qrCode = readAndRemoveQrCode(window)

    expect(qrCode).toBe('kbq_table.random-secret')
    expect(window.location.pathname).toBe('/menu')
    expect(window.location.hash).toBe('#campaign=dine-in')
    expect(window.location.href).not.toContain('random-secret')
  })

  it('exchanges a QR once in Strict Mode, stores the session, and uses the JWT to load the menu', async () => {
    window.history.replaceState({}, '', '/menu#qr=kbq_table.random-secret')
    const fetchMock = vi.fn((_: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') {
        const response: TableSessionResponse = { data: tableSession }
        return Promise.resolve(jsonResponse(response, 201))
      }
      return Promise.resolve(jsonResponse(menu))
    })
    vi.stubGlobal('fetch', fetchMock)

    renderMenu(true)

    expect(await screen.findByText('Pork Value Set')).toBeInTheDocument()
    const postCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')
    expect(postCalls).toHaveLength(1)
    expect(window.location.hash).toBe('')
    expect(sessionStorage.getItem(TABLE_SESSION_STORAGE_KEYS.accessToken)).toBe('customer-jwt')
    expect(sessionStorage.getItem(TABLE_SESSION_STORAGE_KEYS.sessionId)).toBe('session-123')

    const menuCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'GET')
    expect(menuCall).toBeDefined()
    expect(new Headers(menuCall?.[1]?.headers).get('Authorization')).toBe('Bearer customer-jwt')
  })

  it('clears an expired token before it can be used', () => {
    saveTableSession({ ...tableSession, expiresAt: '2026-08-22T00:00:00.000Z' })

    expect(getValidTableSession(Date.parse('2026-08-23T00:00:00.000Z'))).toBeNull()
    expect(sessionStorage.getItem(TABLE_SESSION_STORAGE_KEYS.accessToken)).toBeNull()
    expect(sessionStorage.getItem(TABLE_SESSION_STORAGE_KEYS.table)).toBeNull()
  })

  it.each(['TOKEN_INVALID', 'SESSION_INACTIVE'])('clears the session when the menu returns %s', async (code) => {
    saveTableSession(tableSession)
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({
      error: { code, message: 'Sensitive backend detail' },
    }, 401))))

    renderMenu()

    expect(await screen.findByRole('heading', { name: 'Scan your table QR' })).toBeInTheDocument()
    expect(sessionStorage.getItem(TABLE_SESSION_STORAGE_KEYS.accessToken)).toBeNull()
    expect(screen.queryByText('Sensitive backend detail')).not.toBeInTheDocument()
  })
})

describe('customer menu presentation', () => {
  it('groups all items and filters a selected category', async () => {
    saveTableSession(tableSession)
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(menu))))
    const user = userEvent.setup()

    renderMenu()
    expect(await screen.findByText('Pork Value Set')).toBeInTheDocument()
    expect(screen.getByText('Garlic Prawns')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Seafood' }))

    expect(screen.queryByText('Pork Value Set')).not.toBeInTheDocument()
    expect(screen.getByText('Garlic Prawns')).toBeInTheDocument()
  })

  it('formats prices as whole Thai baht currency', () => {
    expect(formatMenuPrice(299)).toBe(new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(299))
    expect(formatMenuPrice(299)).toContain('299')
  })

  it('keeps uncategorized API items visible in All', () => {
    const sections = getMenuSections({
      categories: ['Grill Sets'],
      items: [...menu.items, { ...menu.items[0], id: 'drink', category: 'Drinks' }],
    }, 'all')

    expect(sections.map((section) => section.category)).toEqual(['Grill Sets', 'Seafood', 'Drinks'])
  })

  it('shows a loading skeleton while the menu request is pending', () => {
    saveTableSession(tableSession)
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)))

    renderMenu()

    expect(screen.getByRole('status', { name: 'Loading menu' })).toBeInTheDocument()
  })

  it('shows an actionable empty state', async () => {
    saveTableSession(tableSession)
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({ categories: [], items: [] }))))

    renderMenu()

    expect(await screen.findByRole('heading', { name: 'No dishes available' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /refresh menu/i })).toBeInTheDocument()
  })

  it('shows a friendly retry state without exposing the backend error', async () => {
    saveTableSession(tableSession)
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({
      error: { code: 'VALIDATION_ERROR', message: 'Internal validation details' },
    }, 400))))

    renderMenu()

    expect(await screen.findByRole('heading', { name: 'Menu unavailable' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.queryByText('Internal validation details')).not.toBeInTheDocument()
  })

  it('uses image fallback when a menu photo fails', async () => {
    saveTableSession(tableSession)
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(menu))))

    renderMenu()
    await screen.findByText('Pork Value Set')
    const image = document.querySelector<HTMLImageElement>('img[src$="pork.jpg"]')
    expect(image).not.toBeNull()
    fireEvent.error(image!)

    expect(screen.getByRole('img', { name: 'No image available for Pork Value Set' })).toBeInTheDocument()
  })

  it('uses the designed fallback instead of a generic placeholder image', async () => {
    saveTableSession(tableSession)
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({
      ...menu,
      items: [{ ...menu.items[0], imageUrl: 'https://placehold.co/400x400?text=Pork' }],
    }))))

    renderMenu()

    expect(await screen.findByRole('img', { name: 'No image available for Pork Value Set' })).toBeInTheDocument()
    expect(document.querySelector('img[src*="placehold.co"]')).not.toBeInTheDocument()
  })
})
