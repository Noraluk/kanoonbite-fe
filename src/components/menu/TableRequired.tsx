import { QrCode } from 'lucide-react'

interface TableRequiredProps {
  invalidTable?: boolean
}

export function TableRequired({ invalidTable = false }: TableRequiredProps) {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
        <QrCode aria-hidden="true" size={32} />
      </div>
      <h1 className="text-2xl font-bold text-stone-900">
        {invalidTable ? 'QR Code ไม่ถูกต้อง' : 'กรุณาสแกน QR Code ที่โต๊ะ'}
      </h1>
      <p className="mt-3 leading-7 text-stone-600">
        {invalidTable
          ? 'ไม่พบหมายเลขโต๊ะ กรุณาสแกน QR Code บนโต๊ะอีกครั้ง'
          : 'สแกนด้วยกล้องโทรศัพท์เพื่อระบุหมายเลขโต๊ะและเริ่มสั่งอาหาร'}
      </p>
    </section>
  )
}
