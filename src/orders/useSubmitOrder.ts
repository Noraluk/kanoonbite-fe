import { useCallback, useEffect, useRef, useState } from 'react'
import { submitOrder } from '../api/order.api'
import { clearTableSession } from '../auth/table-session.storage'
import { ApiError } from '../types/api'
import type { CartItem } from '../types/cart'
import type { Order } from '../types/order'
import {
  clearPendingOrderKey,
  getOrCreateIdempotencyKey,
  saveLastOrderId,
} from './order-idempotency'

export type SubmitErrorKind = 'validation' | 'unavailable' | 'rate-limited' | 'network' | 'generic'

export interface SubmitError {
  kind: SubmitErrorKind
  message: string
}

interface UseSubmitOrderOptions {
  accessToken: string | null
  onSuccess: (order: Order) => void
  onUnauthorized: () => void
}

function getSubmitError(error: unknown): SubmitError {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return { kind: 'validation', message: 'Please check your order items and kitchen note, then try again.' }
      case 'PRODUCT_UNAVAILABLE':
        return { kind: 'unavailable', message: 'Some dishes are no longer available. Return to your cart and update your order.' }
      case 'ORDER_RATE_LIMITED':
      case 'RATE_LIMITED':
        return { kind: 'rate-limited', message: 'Too many order attempts. Please wait a moment, then retry.' }
      default:
        return { kind: 'generic', message: 'We could not place your order right now. Please try again.' }
    }
  }

  return { kind: 'network', message: 'The connection was interrupted. Your cart is safe—retry when you are ready.' }
}

export function useSubmitOrder({ accessToken, onSuccess, onUnauthorized }: UseSubmitOrderOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<SubmitError | null>(null)
  const submittingRef = useRef(false)
  const requestController = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      requestController.current?.abort()
    }
  }, [])

  const submit = useCallback(async (cart: CartItem[], note: string) => {
    if (!accessToken || cart.length === 0 || submittingRef.current) return

    submittingRef.current = true
    setIsSubmitting(true)
    setError(null)
    const idempotencyKey = getOrCreateIdempotencyKey()
    const controller = new AbortController()
    requestController.current = controller
    const timeout = setTimeout(() => controller.abort(), 15_000)

    try {
      const response = await submitOrder(accessToken, cart, note, idempotencyKey, controller.signal)
      clearPendingOrderKey()
      saveLastOrderId(response.data.id)
      if (mountedRef.current) onSuccess(response.data)
    } catch (submitError: unknown) {
      if (!mountedRef.current) return
      if (submitError instanceof ApiError && submitError.status === 401) {
        clearTableSession()
        onUnauthorized()
        return
      }
      setError(getSubmitError(submitError))
    } finally {
      clearTimeout(timeout)
      submittingRef.current = false
      requestController.current = null
      if (mountedRef.current) setIsSubmitting(false)
    }
  }, [accessToken, onSuccess, onUnauthorized])

  return { submit, isSubmitting, error }
}
