import { apiRequest } from './client'
import { ApiError } from '../types/api'
import type { MenuResponse } from '../types/menu'

function waitBeforeRetry(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const handleAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('The operation was aborted', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort)
      resolve()
    }, 350)
    signal?.addEventListener('abort', handleAbort, { once: true })
  })
}

function canRetry(error: unknown) {
  return error instanceof TypeError
    || (error instanceof ApiError && (error.status >= 500 || error.status === 429))
}

export async function getCustomerMenu(accessToken: string, signal?: AbortSignal) {
  let lastError: unknown

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await apiRequest<MenuResponse>('/api/v1/customer/menu', {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        signal,
      })
    } catch (error: unknown) {
      lastError = error
      if (attempt === 1 || !canRetry(error)) throw error
      await waitBeforeRetry(signal)
    }
  }

  throw lastError
}
