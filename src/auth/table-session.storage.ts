import type { CustomerTable, TableSession } from '../types/table-session'

export const TABLE_SESSION_STORAGE_KEYS = {
  accessToken: 'kanoonbite.tableAccessToken',
  expiresAt: 'kanoonbite.tableTokenExpiresAt',
  sessionId: 'kanoonbite.tableSession',
  table: 'kanoonbite.table',
} as const

function getStorage() {
  return window.sessionStorage
}

export function clearTableSession() {
  const storage = getStorage()
  Object.values(TABLE_SESSION_STORAGE_KEYS).forEach((key) => storage.removeItem(key))
}

export function saveTableSession(session: TableSession) {
  const storage = getStorage()
  storage.setItem(TABLE_SESSION_STORAGE_KEYS.accessToken, session.accessToken)
  storage.setItem(TABLE_SESSION_STORAGE_KEYS.expiresAt, session.expiresAt)
  storage.setItem(TABLE_SESSION_STORAGE_KEYS.sessionId, session.sessionId)
  storage.setItem(TABLE_SESSION_STORAGE_KEYS.table, JSON.stringify(session.table))
}

function parseTable(value: string): CustomerTable | null {
  try {
    const table: unknown = JSON.parse(value)
    if (
      typeof table === 'object'
      && table !== null
      && 'id' in table
      && 'label' in table
      && typeof table.id === 'string'
      && typeof table.label === 'string'
    ) {
      return { id: table.id, label: table.label }
    }
  } catch {
    return null
  }
  return null
}

export function getValidTableSession(now = Date.now()): TableSession | null {
  const storage = getStorage()
  const accessToken = storage.getItem(TABLE_SESSION_STORAGE_KEYS.accessToken)
  const expiresAt = storage.getItem(TABLE_SESSION_STORAGE_KEYS.expiresAt)
  const sessionId = storage.getItem(TABLE_SESSION_STORAGE_KEYS.sessionId)
  const serializedTable = storage.getItem(TABLE_SESSION_STORAGE_KEYS.table)
  const expirationTime = expiresAt ? Date.parse(expiresAt) : Number.NaN
  const table = serializedTable ? parseTable(serializedTable) : null

  if (!accessToken || !expiresAt || !sessionId || !table || !Number.isFinite(expirationTime) || expirationTime <= now) {
    clearTableSession()
    return null
  }

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresAt,
    expiresIn: Math.max(0, Math.floor((expirationTime - now) / 1000)),
    sessionId,
    table,
  }
}
