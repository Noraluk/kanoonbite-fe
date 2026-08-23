import { apiRequest } from './client'
import type { TableSession, TableSessionResponse } from '../types/table-session'

interface PendingExchange {
  controller: AbortController
  promise: Promise<TableSession>
  subscribers: number
  settled: boolean
  abortTimer: ReturnType<typeof setTimeout> | null
}

const pendingExchanges = new Map<string, PendingExchange>()

function createExchange(qrCode: string): PendingExchange {
  const controller = new AbortController()
  const promise = apiRequest<TableSessionResponse>('/api/v1/customer/table-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrCode }),
    signal: controller.signal,
  }).then((response) => response.data)
  const entry: PendingExchange = {
    controller,
    promise,
    subscribers: 0,
    settled: false,
    abortTimer: null,
  }

  const finalize = () => {
    entry.settled = true
    if (entry.abortTimer) clearTimeout(entry.abortTimer)
    if (pendingExchanges.get(qrCode) === entry) pendingExchanges.delete(qrCode)
  }
  void entry.promise.then(finalize, finalize)
  pendingExchanges.set(qrCode, entry)
  return entry
}

export function exchangeTableSession(qrCode: string, signal?: AbortSignal): Promise<TableSession> {
  const entry = pendingExchanges.get(qrCode) ?? createExchange(qrCode)
  if (entry.abortTimer) {
    clearTimeout(entry.abortTimer)
    entry.abortTimer = null
  }
  entry.subscribers += 1

  return new Promise((resolve, reject) => {
    let active = true

    const release = () => {
      if (!active) return
      active = false
      entry.subscribers = Math.max(0, entry.subscribers - 1)
      if (entry.subscribers === 0 && !entry.settled) {
        entry.abortTimer = setTimeout(() => {
          if (entry.subscribers === 0 && !entry.settled) entry.controller.abort()
        }, 0)
      }
    }

    const handleAbort = () => {
      release()
      reject(new DOMException('The operation was aborted', 'AbortError'))
    }

    if (signal?.aborted) {
      handleAbort()
      return
    }

    signal?.addEventListener('abort', handleAbort, { once: true })
    void entry.promise.then(
      (session) => {
        if (active) resolve(session)
      },
      (error: unknown) => {
        if (active) reject(error)
      },
    ).finally(() => {
      signal?.removeEventListener('abort', handleAbort)
      release()
    })
  })
}

export function resetTableSessionExchangeCache() {
  for (const entry of pendingExchanges.values()) entry.controller.abort()
  pendingExchanges.clear()
}
