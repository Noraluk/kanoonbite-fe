import { ApiError, type ApiErrorResponse } from '../types/api'

const DEVELOPMENT_API_BASE_URL = 'http://localhost:3001'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!isRecord(value) || !isRecord(value.error)) return false
  return typeof value.error.code === 'string' && typeof value.error.message === 'string'
}

function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configuredUrl) return configuredUrl.replace(/\/$/, '')
  if (import.meta.env.DEV) return DEVELOPMENT_API_BASE_URL
  throw new Error('VITE_API_BASE_URL is required in production')
}

export async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, init)
  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const code = isApiErrorResponse(payload) ? payload.error.code : 'UNKNOWN_ERROR'
    const message = isApiErrorResponse(payload) ? payload.error.message : 'Request failed'
    throw new ApiError(response.status, code, message)
  }

  return payload as T
}
