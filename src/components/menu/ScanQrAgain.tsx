import { QrCode } from 'lucide-react'

interface ScanQrAgainProps {
  message: string
}

export function ScanQrAgain({ message }: ScanQrAgainProps) {
  return (
    <section className="scan-required" aria-labelledby="scan-heading" role="alert">
      <div className="scan-required__icon" aria-hidden="true"><QrCode size={42} /></div>
      <h1 id="scan-heading">Scan your table QR</h1>
      <p>{message}</p>
      <p className="scan-required__help">The code is usually on the table. Ask our team if you need help.</p>
    </section>
  )
}
