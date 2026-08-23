import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import QRCode from 'qrcode'

const args = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...valueParts] = argument.replace(/^--/, '').split('=')
    return [key, valueParts.join('=')]
  }),
)

const tableLabel = args.label
const qrCode = args['qr-code']
const baseUrl = args['base-url']

if (!tableLabel || !/^[a-zA-Z0-9_-]+$/.test(tableLabel)) {
  throw new Error('กรุณาระบุชื่อโต๊ะ เช่น --label=A01')
}

if (!qrCode || !/^kbq_[^.]+\..+$/.test(qrCode)) {
  throw new Error('กรุณาระบุ QR code ที่ Backend ออกให้ผ่าน --qr-code')
}

if (!baseUrl) {
  throw new Error('กรุณาระบุ URL ของเว็บ เช่น --base-url=https://order.example.com')
}

const orderUrl = new URL('/menu', baseUrl)
orderUrl.hash = new URLSearchParams({ qr: qrCode }).toString()

const outputDirectory = resolve('public/qrcodes')
const outputPath = resolve(outputDirectory, `table-${tableLabel}.png`)

await mkdir(outputDirectory, { recursive: true })
await QRCode.toFile(outputPath, orderUrl.toString(), {
  width: 1024,
  margin: 4,
  errorCorrectionLevel: 'H',
  color: {
    dark: '#1c1917',
    light: '#ffffff',
  },
})

console.log(`สร้าง QR โต๊ะ ${tableLabel}: ${outputPath}`)
