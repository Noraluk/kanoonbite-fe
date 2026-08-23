interface BrowserUrl {
  location: Pick<Location, 'hash' | 'pathname' | 'search'>
  history: Pick<History, 'replaceState' | 'state'>
}

let pendingQrCode: string | null = null

export function readAndRemoveQrCode({ location, history }: BrowserUrl): string | null {
  const fragment = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash
  const fragmentParams = new URLSearchParams(fragment)
  const qrCode = fragmentParams.get('qr')?.trim() || null

  if (!qrCode) return null

  fragmentParams.delete('qr')
  const remainingFragment = fragmentParams.toString()
  history.replaceState(
    history.state,
    '',
    `${location.pathname}${location.search}${remainingFragment ? `#${remainingFragment}` : ''}`,
  )
  return qrCode
}

export function consumeQrCodeForExchange(): string | null {
  const qrCode = readAndRemoveQrCode(window)
  if (qrCode) pendingQrCode = qrCode
  return pendingQrCode
}

export function clearConsumedQrCode(qrCode?: string) {
  if (!qrCode || pendingQrCode === qrCode) pendingQrCode = null
}
