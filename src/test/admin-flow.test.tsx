import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { useAdminAuthStore } from '../admin/adminAuthStore'
import { AppRouter } from '../routes/AppRouter'
import type { Order, OrderStatus } from '../types/order'

const admin = { id: 'admin-1', email: 'admin@example.com', venueId: 'venue-1', role: 'admin' }

function createOrder(status: OrderStatus = 'received'): Order {
  return {
    id: 'order-1',
    orderNumber: 3,
    table: { id: 'table-1', label: '1' },
    items: [
      { productId: 'pork', name: 'Pork Value Set', quantity: 1, unitPrice: 299, lineTotal: 299 },
      { productId: 'tea-1', name: 'Thai Iced Tea', quantity: 1, unitPrice: 50, lineTotal: 50 },
      { productId: 'tea-2', name: 'Thai Iced Tea', quantity: 1, unitPrice: 50, lineTotal: 50 },
    ],
    note: 'Kitchen note',
    total: 399,
    currency: 'THB',
    status,
    createdAt: new Date(Date.now() - 60_000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function loginResponse() {
  return jsonResponse({ data: { accessToken: 'admin-jwt', tokenType: 'Bearer', expiresIn: 900, admin } })
}

function ordersResponse(status: OrderStatus = 'received') {
  return jsonResponse({ data: { orders: [createOrder(status)] } })
}

function emptyOrdersResponse() {
  return jsonResponse({ data: { orders: [] } })
}

class MockWebSocket extends EventTarget {
  static instances: MockWebSocket[] = []

  readonly url: string
  readonly close = vi.fn()

  constructor(url: string | URL) {
    super()
    this.url = String(url)
    MockWebSocket.instances.push(this)
  }

  open() {
    this.dispatchEvent(new Event('open'))
  }

  receive(data: unknown) {
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(data) }))
  }
}

function authenticate() {
  useAdminAuthStore.getState().setSession('admin-jwt', 900, admin)
}

function renderAt(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><AppRouter /></MemoryRouter>)
}

describe('admin backoffice', () => {
  it('keeps protected admin pages behind the separate admin login', () => {
    renderAt('/admin/orders')
    expect(screen.getByRole('heading', { name: 'Kanoonbite Admin' })).toBeInTheDocument()
    expect(document.querySelector('.app-shell')).not.toBeInTheDocument()
  })

  it('logs in with the Admin API, loads live orders, and advances an order through the API', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(loginResponse())
      .mockResolvedValueOnce(ordersResponse('received'))
      .mockResolvedValueOnce(emptyOrdersResponse())
      .mockResolvedValueOnce(jsonResponse({ data: createOrder('preparing') }))
      .mockResolvedValueOnce(ordersResponse('preparing'))
      .mockResolvedValueOnce(emptyOrdersResponse())
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderAt('/admin/login')

    await user.type(screen.getByLabelText('Email'), 'admin@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('heading', { name: 'Live orders' })).toBeInTheDocument()
    expect(await screen.findByText('1x Pork Value Set, 2x Thai Iced Tea')).toBeInTheDocument()
    expect(screen.getAllByText('Not available')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Start grilling' }))
    expect(await screen.findByText('Cooking')).toBeInTheDocument()

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:3001/api/v1/admin/auth/login', expect.objectContaining({ method: 'POST' }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://localhost:3001/api/v1/kitchen/orders', expect.objectContaining({
      headers: { Authorization: 'Bearer admin-jwt' },
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(3, 'http://localhost:3001/api/v1/kitchen/orders?status=completed', expect.objectContaining({
      headers: { Authorization: 'Bearer admin-jwt' },
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(4, 'http://localhost:3001/api/v1/kitchen/orders/order-1/status', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ status: 'preparing' }),
    }))
    expect(sessionStorage.getItem('kanoonbite.adminSession')).not.toContain('secret')
  })

  it('clears an expired or invalid JWT and returns to login on 401', async () => {
    authenticate()
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({
      error: { code: 'TOKEN_EXPIRED', message: 'Expired' },
    }, 401))))
    renderAt('/admin/orders')

    expect(await screen.findByRole('heading', { name: 'Kanoonbite Admin' })).toBeInTheDocument()
    expect(useAdminAuthStore.getState().accessToken).toBeNull()
  })

  it('refetches instead of guessing state when status update conflicts', async () => {
    authenticate()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(ordersResponse('received'))
      .mockResolvedValueOnce(emptyOrdersResponse())
      .mockResolvedValueOnce(jsonResponse({
        error: { code: 'ORDER_STATUS_CONFLICT', message: 'Conflict' },
      }, 409))
      .mockResolvedValueOnce(ordersResponse('preparing'))
      .mockResolvedValueOnce(emptyOrdersResponse())
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderAt('/admin/orders')

    await user.click(await screen.findByRole('button', { name: 'Start grilling' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('already updated')
    expect(await screen.findByText('Cooking')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(5)
  })

  it('keeps an order visible after it is completed and after the immediate refetch', async () => {
    authenticate()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(ordersResponse('ready'))
      .mockResolvedValueOnce(emptyOrdersResponse())
      .mockResolvedValueOnce(jsonResponse({ data: createOrder('completed') }))
      .mockResolvedValueOnce(emptyOrdersResponse())
      .mockResolvedValueOnce(ordersResponse('completed'))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderAt('/admin/orders')

    await user.click(await screen.findByRole('button', { name: 'Complete order' }))
    expect(await screen.findByText('Served')).toBeInTheDocument()
    expect(screen.getByText('#3')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenNthCalledWith(5, 'http://localhost:3001/api/v1/kitchen/orders?status=completed', expect.any(Object))
  })

  it('adds and toggles a menu item in demo state', async () => {
    authenticate()
    const user = userEvent.setup()
    renderAt('/admin/menu')

    await user.click(screen.getByRole('button', { name: 'Add item' }))
    await user.type(screen.getByLabelText('Dish name'), 'Charcoal Pork')
    fireEvent.change(screen.getByLabelText('Price ฿'), { target: { value: '189' } })
    await user.click(screen.getByRole('button', { name: 'Add to menu' }))

    const menuRow = screen.getByText('Charcoal Pork').closest('article')
    expect(menuRow).not.toBeNull()
    const row = within(menuRow as HTMLElement)
    await user.click(row.getByRole('button', { name: 'In stock' }))
    expect(row.getByRole('button', { name: 'Sold out' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('leaves customer routes inside the customer shell', () => {
    renderAt('/menu')
    expect(document.querySelector('.app-shell')).toBeInTheDocument()
    expect(screen.queryByText('Kanoonbite Admin')).not.toBeInTheDocument()
  })

  it('does not issue overlapping polling requests', async () => {
    vi.useFakeTimers()
    authenticate()
    let resolveRequest: ((response: Response) => void) | undefined
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { resolveRequest = resolve }))
    vi.stubGlobal('fetch', fetchMock)
    const view = renderAt('/admin/orders')

    try {
      expect(fetchMock).toHaveBeenCalledTimes(1)
      await act(async () => { await vi.advanceTimersByTimeAsync(12_000) })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      await act(async () => { resolveRequest?.(ordersResponse()) })
    } finally {
      view.unmount()
      vi.useRealTimers()
    }
  })

  it('loads orders immediately on page entry before the first polling interval', async () => {
    vi.useFakeTimers()
    authenticate()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(ordersResponse('received'))
      .mockResolvedValueOnce(emptyOrdersResponse())
    vi.stubGlobal('fetch', fetchMock)
    const view = renderAt('/admin/orders')

    try {
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(screen.getByText('#3')).toBeInTheDocument()
      expect(vi.getTimerCount()).toBeGreaterThan(0)
    } finally {
      view.unmount()
      vi.useRealTimers()
    }
  })

  it('uses the four-second fallback while realtime is unavailable', async () => {
    vi.useFakeTimers()
    authenticate()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(ordersResponse('received'))
      .mockResolvedValueOnce(emptyOrdersResponse())
      .mockResolvedValueOnce(ordersResponse('received'))
      .mockResolvedValueOnce(emptyOrdersResponse())
    vi.stubGlobal('fetch', fetchMock)
    const view = renderAt('/admin/orders')

    try {
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(screen.getByRole('status')).toHaveTextContent('refreshing every 4 seconds')

      await act(async () => { await vi.advanceTimersByTimeAsync(3_999) })
      expect(fetchMock).toHaveBeenCalledTimes(2)
      await act(async () => { await vi.advanceTimersByTimeAsync(1) })
      expect(fetchMock).toHaveBeenCalledTimes(4)
    } finally {
      view.unmount()
      vi.useRealTimers()
    }
  })

  it('restarts the immediate request when development Strict Mode aborts the first mount', async () => {
    authenticate()
    let requestNumber = 0
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      requestNumber += 1
      if (requestNumber === 1) {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          }, { once: true })
        })
      }
      if (requestNumber === 2) return Promise.resolve(ordersResponse('received'))
      return Promise.resolve(emptyOrdersResponse())
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/admin/orders']}><AppRouter /></MemoryRouter>
      </StrictMode>,
    )

    expect(await screen.findByText('#3')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('refetches immediately when a realtime order event arrives', async () => {
    authenticate()
    MockWebSocket.instances = []
    vi.stubGlobal('WebSocket', MockWebSocket)
    const newOrder = { ...createOrder('received'), id: 'order-2', orderNumber: 4 }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(ordersResponse('received'))
      .mockResolvedValueOnce(emptyOrdersResponse())
      .mockResolvedValueOnce(jsonResponse({
        data: {
          ticket: 'single-use-ticket',
          expiresAt: new Date(Date.now() + 30_000).toISOString(),
          websocketUrl: 'wss://api.example.com/api/v1/kitchen/events',
        },
      }))
      .mockResolvedValueOnce(ordersResponse('received'))
      .mockResolvedValueOnce(emptyOrdersResponse())
      .mockResolvedValueOnce(jsonResponse({ data: { orders: [createOrder('received'), newOrder] } }))
      .mockResolvedValueOnce(emptyOrdersResponse())
    vi.stubGlobal('fetch', fetchMock)
    const view = renderAt('/admin/orders')

    await vi.waitFor(() => expect(MockWebSocket.instances).toHaveLength(1))
    const socket = MockWebSocket.instances[0]
    expect(socket.url).toContain('ticket=single-use-ticket')
    expect(socket.url).not.toContain('admin-jwt')

    act(() => socket.open())
    expect(await screen.findByRole('status')).toHaveTextContent('Live')
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5))

    act(() => socket.receive({
      type: 'order.created',
      eventId: 'event-1',
      venueId: 'venue-1',
      orderId: 'order-2',
      occurredAt: new Date().toISOString(),
    }))

    expect(await screen.findByText('#4')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('New order #4')
    expect(screen.getByRole('alert')).toHaveTextContent('Table 1 just placed an order.')
    expect(fetchMock).toHaveBeenCalledTimes(7)
    view.unmount()
    expect(socket.close).toHaveBeenCalled()
  })
})
