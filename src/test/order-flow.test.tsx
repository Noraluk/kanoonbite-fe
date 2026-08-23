import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { buildSubmitOrderPayload } from '../api/order.api'
import { saveTableSession, TABLE_SESSION_STORAGE_KEYS } from '../auth/table-session.storage'
import { useOrderStatus } from '../orders/useOrderStatus'
import { PENDING_ORDER_KEY } from '../orders/order-idempotency'
import { OrderStatusScreen } from '../pages/OrderStatusScreen'
import { ReviewScreen } from '../pages/ReviewScreen'
import { useCartStore } from '../store/cartStore'
import type { CartItem } from '../types/cart'
import type { Order, OrderStatus, SubmitOrderResponse } from '../types/order'
import type { TableSession } from '../types/table-session'
import { formatOrderPrice } from '../utils/order'

const tableSession: TableSession = {
  accessToken: 'table-jwt',
  tokenType: 'Bearer',
  expiresIn: 10_800,
  expiresAt: '2099-08-23T03:00:00.000Z',
  sessionId: 'session-123',
  table: { id: 'table-123', label: '1' },
}

const cart: CartItem[] = [
  { productId: 'item-pork', name: 'Pork Value Set', imageUrl: '/pork.jpg', price: 299, quantity: 1 },
  { productId: 'item-beef', name: 'Premium Beef Set', imageUrl: '/beef.jpg', price: 459, quantity: 1 },
]

function createOrder(status: OrderStatus = 'received'): Order {
  return {
    id: 'order-123',
    orderNumber: 1,
    table: { id: 'table-123', label: '1' },
    items: [
      { productId: 'item-pork', name: 'Pork Value Set', quantity: 1, unitPrice: 299, lineTotal: 299 },
      { productId: 'item-beef', name: 'Premium Beef Set', quantity: 1, unitPrice: 459, lineTotal: 459 },
    ],
    note: 'ไม่เผ็ด',
    total: 758,
    currency: 'THB',
    status,
    createdAt: '2026-08-23T00:00:00.000Z',
    updatedAt: '2026-08-23T00:00:00.000Z',
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function orderResponse(status = 201, orderStatus: OrderStatus = 'received') {
  const body: SubmitOrderResponse = {
    data: createOrder(orderStatus),
    meta: { idempotentReplay: status === 200 },
  }
  return jsonResponse(body, status)
}

function prepareReview() {
  saveTableSession(tableSession)
  useCartStore.setState({ items: cart })
}

function renderReview() {
  return render(
    <MemoryRouter initialEntries={['/review']}>
      <Routes>
        <Route path="/review" element={<ReviewScreen />} />
        <Route path="/orders/:orderId" element={<div>Order status route</div>} />
        <Route path="/menu" element={<div>Scan route</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('order submission', () => {
  it('sends only productId and quantity, never table or preview prices, and keeps note a string', () => {
    const payload = buildSubmitOrderPayload(cart, '  ไม่เผ็ด  ', 'idempotency-1')

    expect(payload).toEqual({
      idempotencyKey: 'idempotency-1',
      note: 'ไม่เผ็ด',
      items: [
        { productId: 'item-pork', quantity: 1 },
        { productId: 'item-beef', quantity: 1 },
      ],
    })
    expect(payload).not.toHaveProperty('table')
    expect(payload.items[0]).not.toHaveProperty('price')
    expect(typeof payload.note).toBe('string')
  })

  it('prevents double submit, accepts 201, clears the cart, and navigates to status', async () => {
    prepareReview()
    let resolveRequest: ((response: Response) => void) | undefined
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { resolveRequest = resolve }))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderReview()

    const button = screen.getByRole('button', { name: /place order/i })
    await user.dblClick(button)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(button).toBeDisabled()

    await act(async () => resolveRequest?.(orderResponse(201)))

    expect(await screen.findByText('Order status route')).toBeInTheDocument()
    expect(useCartStore.getState().items).toEqual([])
    expect(sessionStorage.getItem(PENDING_ORDER_KEY)).toBeNull()
  })

  it('treats a 200 idempotent replay as success', async () => {
    prepareReview()
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(orderResponse(200))))
    const user = userEvent.setup()
    renderReview()

    await user.click(screen.getByRole('button', { name: /place order/i }))

    expect(await screen.findByText('Order status route')).toBeInTheDocument()
    expect(useCartStore.getState().items).toEqual([])
  })

  it('reuses the same idempotency key after a network error', async () => {
    prepareReview()
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(orderResponse(201))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderReview()

    await user.click(screen.getByRole('button', { name: /place order/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('cart is safe')
    const firstPayload = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as { idempotencyKey: string }
    expect(sessionStorage.getItem(PENDING_ORDER_KEY)).toBe(firstPayload.idempotencyKey)

    await user.click(screen.getByRole('button', { name: /retry order/i }))
    const secondPayload = JSON.parse(String(fetchMock.mock.calls[1][1]?.body)) as { idempotencyKey: string }

    expect(secondPayload.idempotencyKey).toBe(firstPayload.idempotencyKey)
    expect(await screen.findByText('Order status route')).toBeInTheDocument()
  })

  it('keeps the cart when a product is unavailable', async () => {
    prepareReview()
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({
      error: { code: 'PRODUCT_UNAVAILABLE', message: 'Internal product detail' },
    }, 409))))
    const user = userEvent.setup()
    renderReview()

    await user.click(screen.getByRole('button', { name: /place order/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('no longer available')
    expect(screen.getByRole('link', { name: 'Back to cart' })).toBeInTheDocument()
    expect(useCartStore.getState().items).toEqual(cart)
  })

  it('clears the table session and redirects on TOKEN_INVALID', async () => {
    prepareReview()
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({
      error: { code: 'TOKEN_INVALID', message: 'Internal auth detail' },
    }, 401))))
    const user = userEvent.setup()
    renderReview()

    await user.click(screen.getByRole('button', { name: /place order/i }))

    expect(await screen.findByText('Scan route')).toBeInTheDocument()
    expect(sessionStorage.getItem(TABLE_SESSION_STORAGE_KEYS.accessToken)).toBeNull()
    expect(useCartStore.getState().items).toEqual(cart)
  })
})

describe('order status polling', () => {
  it('renders the backend order summary, table, and authoritative total', async () => {
    saveTableSession(tableSession)
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({ data: createOrder('completed') }))))

    render(
      <MemoryRouter initialEntries={['/orders/order-123']}>
        <Routes>
          <Route path="/orders/:orderId" element={<OrderStatusScreen />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Order completed' })).toBeInTheDocument()
    expect(screen.getByText('Order #1 · Table 1')).toBeInTheDocument()
    expect(screen.getByText('1× Pork Value Set')).toBeInTheDocument()
    expect(screen.getByText(formatOrderPrice(758, 'THB'))).toBeInTheDocument()
  })

  it('polls received → preparing → ready → completed without overlapping requests', async () => {
    const statuses: OrderStatus[] = ['received', 'preparing', 'ready', 'completed']
    let activeRequests = 0
    let maximumActiveRequests = 0
    const fetchMock = vi.fn(async () => {
      activeRequests += 1
      maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests)
      const status = statuses.shift() ?? 'completed'
      await Promise.resolve()
      activeRequests -= 1
      return jsonResponse({ data: createOrder(status) })
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useOrderStatus({
      orderId: 'order-123',
      accessToken: 'table-jwt',
      onUnauthorized: vi.fn(),
      pollDelay: 5,
    }))

    await waitFor(() => expect(result.current.order?.status).toBe('completed'))
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(maximumActiveRequests).toBe(1)
    await new Promise((resolve) => setTimeout(resolve, 15))
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it.each<OrderStatus>(['completed', 'cancelled'])('stops polling when status is %s', async (status) => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ data: createOrder(status) })))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useOrderStatus({
      orderId: 'order-123',
      accessToken: 'table-jwt',
      onUnauthorized: vi.fn(),
      pollDelay: 5,
    }))

    await waitFor(() => expect(result.current.order?.status).toBe(status))
    await new Promise((resolve) => setTimeout(resolve, 15))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('aborts the active status request on unmount', () => {
    const requestSignals: AbortSignal[] = []
    vi.stubGlobal('fetch', vi.fn((_: RequestInfo | URL, init?: RequestInit) => {
      if (init?.signal) requestSignals.push(init.signal)
      return new Promise<Response>(() => undefined)
    }))

    const { unmount } = renderHook(() => useOrderStatus({
      orderId: 'order-123',
      accessToken: 'table-jwt',
      onUnauthorized: vi.fn(),
      pollDelay: 5,
    }))
    unmount()

    expect(requestSignals[0]?.aborted).toBe(true)
  })

  it('formats backend totals using the response currency', () => {
    expect(formatOrderPrice(758, 'THB')).toBe(new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(758))
  })
})
