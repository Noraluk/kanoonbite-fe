import { useCallback, useEffect, useState } from 'react'
import { exchangeTableSession } from '../api/table-session.api'
import { clearConsumedQrCode, consumeQrCodeForExchange } from '../auth/qr-fragment'
import { clearTableSession, getValidTableSession, saveTableSession } from '../auth/table-session.storage'
import { ApiError } from '../types/api'
import type { TableSession } from '../types/table-session'

type TableSessionState =
  | { status: 'exchanging'; session: null; qrCode: string; message: null }
  | { status: 'authenticated'; session: TableSession; qrCode: null; message: null }
  | { status: 'scan-required'; session: null; qrCode: null; message: string }

const DEFAULT_SCAN_MESSAGE = 'Scan the QR code on your table to view the menu.'

function getExchangeErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return 'We could not connect to the restaurant. Please scan the QR code again.'

  switch (error.code) {
    case 'VALIDATION_ERROR':
      return 'That QR code could not be read. Please scan the code on your table again.'
    case 'QR_INVALID':
      return 'This table QR code is no longer valid. Please ask a team member or scan the latest code.'
    case 'QR_EXCHANGE_RATE_LIMITED':
      return 'Too many scan attempts. Please wait a moment, then scan the QR code again.'
    default:
      return 'We could not open the menu right now. Please scan the QR code again in a moment.'
  }
}

function getInitialState(): TableSessionState {
  const qrCode = consumeQrCodeForExchange()
  if (qrCode) {
    clearTableSession()
    return { status: 'exchanging', session: null, qrCode, message: null }
  }

  const session = getValidTableSession()
  if (session) return { status: 'authenticated', session, qrCode: null, message: null }
  return { status: 'scan-required', session: null, qrCode: null, message: DEFAULT_SCAN_MESSAGE }
}

export function useTableSession() {
  const [state, setState] = useState<TableSessionState>(getInitialState)

  useEffect(() => {
    if (state.status !== 'exchanging') return

    const controller = new AbortController()
    const { qrCode } = state

    void exchangeTableSession(qrCode, controller.signal).then(
      (session) => {
        saveTableSession(session)
        clearConsumedQrCode(qrCode)
        setState({ status: 'authenticated', session, qrCode: null, message: null })
      },
      (error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        clearTableSession()
        clearConsumedQrCode(qrCode)
        setState({
          status: 'scan-required',
          session: null,
          qrCode: null,
          message: getExchangeErrorMessage(error),
        })
      },
    )

    return () => controller.abort()
  }, [state])

  const requireNewScan = useCallback((message = DEFAULT_SCAN_MESSAGE) => {
    clearTableSession()
    clearConsumedQrCode()
    setState({ status: 'scan-required', session: null, qrCode: null, message })
  }, [])

  return { ...state, requireNewScan }
}
