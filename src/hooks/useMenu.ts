import { useCallback, useEffect, useRef, useState } from 'react'
import { getCustomerMenu } from '../api/menu.api'
import { clearTableSession } from '../auth/table-session.storage'
import { ApiError } from '../types/api'
import type { MenuResponse } from '../types/menu'

type MenuState =
  | { status: 'idle' | 'loading'; menu: null; message: null }
  | { status: 'ready'; menu: MenuResponse; message: null }
  | { status: 'error'; menu: null; message: string }

function getMenuErrorMessage(error: unknown) {
  if (error instanceof ApiError && ['MENU_RATE_LIMITED', 'RATE_LIMITED'].includes(error.code)) {
    return 'The menu is receiving a lot of requests. Please wait a moment and try again.'
  }
  return 'We could not load the menu right now. Please try again.'
}

export function useMenu(accessToken: string | null, onUnauthorized: () => void) {
  const [state, setState] = useState<MenuState>({ status: 'idle', menu: null, message: null })
  const requestController = useRef<AbortController | null>(null)

  const loadMenu = useCallback(() => {
    requestController.current?.abort()
    if (!accessToken) {
      setState({ status: 'idle', menu: null, message: null })
      return
    }

    const controller = new AbortController()
    requestController.current = controller
    setState({ status: 'loading', menu: null, message: null })

    void getCustomerMenu(accessToken, controller.signal).then(
      (menu) => setState({ status: 'ready', menu, message: null }),
      (error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (error instanceof ApiError && error.status === 401) {
          clearTableSession()
          onUnauthorized()
          return
        }
        setState({ status: 'error', menu: null, message: getMenuErrorMessage(error) })
      },
    )
  }, [accessToken, onUnauthorized])

  useEffect(() => {
    loadMenu()
    return () => requestController.current?.abort()
  }, [loadMenu])

  return { ...state, retry: loadMenu }
}
