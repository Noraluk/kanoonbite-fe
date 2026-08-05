import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import QRCode from 'qrcode'

const args = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...valueParts] = argument.replace(/^--/, '').split('=')
    return [key, valueParts.join('=')]
  }),
)

const tableNumber = args.table
const baseUrl = args['base-url']

if (!tableNumber || !/^[1-9]\d{0,2}$/.test(tableNumber)) {
  throw new Error('กรุณาระบุหมายเลขโต๊ะ 1-999 เช่น --table=12')
}

if (!baseUrl) {
  throw new Error('กรุณาระบุ URL ของเว็บ เช่น --base-url=https://order.example.com')
}

const orderUrl = new URL(baseUrl)
orderUrl.searchParams.set('table', tableNumber)

const outputDirectory = resolve('public/qrcodes')
const outputPath = resolve(outputDirectory, `table-${tableNumber}.png`)

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

console.log(`สร้าง QR โต๊ะ ${tableNumber}: ${outputPath}`)
console.log(`URL: ${orderUrl}`)
