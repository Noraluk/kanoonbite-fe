# Kanoon Bite

Starter project สำหรับแอปพลิเคชันสั่งอาหาร สร้างด้วย React, Vite, TypeScript,
React Router, Tailwind CSS และ Zustand

## คำสั่งสร้างโปรเจกต์ตั้งแต่ต้น

```bash
npm create vite@latest kanoonbite-fe -- --template react-ts
cd kanoonbite-fe
npm install
npm install react-router-dom zustand
npm install -D tailwindcss @tailwindcss/vite
```

Tailwind CSS v4 ใช้ Vite plugin ใน `vite.config.ts` และ import ด้วย
`@import 'tailwindcss';` ใน `src/index.css` จึงไม่ต้องมี `tailwind.config.js`
สำหรับการตั้งค่าพื้นฐาน

## เริ่มพัฒนา

```bash
npm run dev
```

คัดลอก environment file และตั้ง Backend URL สำหรับ development:

```bash
cp .env.example .env.local
```

ตรวจสอบ lint, typecheck, tests และ production build:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## โครงสร้าง `src/`

```text
src/
├── api/                 # API client และ customer endpoints
├── auth/                # QR fragment และ sessionStorage helpers
├── components/          # Layout และ menu UI components
├── hooks/               # Table session และ menu data hooks
├── pages/               # หน้าจอระดับ route
├── routes/              # Route configuration
├── store/               # Zustand global stores
├── types/               # TypeScript types/interfaces กลาง
├── App.tsx              # Root application component
├── index.css            # Tailwind และ global styles
└── main.tsx             # React entry point และ BrowserRouter
```

เมื่อฟีเจอร์ใหญ่ขึ้น สามารถเพิ่ม `features/`, `services/`, `hooks/`, `utils/`
และ `assets/` โดยจัดไฟล์ที่เกี่ยวข้องกับแต่ละ domain ไว้ใกล้กัน

## Routes เริ่มต้น

- `/menu#qr=<QR_CODE>` — แลก QR เป็น Customer JWT แล้วโหลดเมนู
- `/cart` — ตะกร้าของ table session ปัจจุบัน
- `/review` — ตรวจรายการและส่งออเดอร์ด้วย idempotency key
- `/orders/:orderId` — สถานะออเดอร์จาก Backend พร้อม polling ทุก 4 วินาที

การส่งออเดอร์ใช้ `POST /api/v1/customer/orders` และส่งเฉพาะ `productId`,
`quantity` และ kitchen note แบบ string เท่านั้น ราคาจริง หมายเลขโต๊ะ และสถานะออเดอร์
ยึดจาก Backend response โดยทุก customer request ส่ง Table JWT ผ่าน Authorization header
- `*` — NotFoundScreen

## สร้าง QR Code ประจำโต๊ะ

QR Code ของแต่ละโต๊ะต้องชี้มาที่ `/menu` และเก็บ QR secret ใน URL fragment
เพื่อไม่ให้ secret ถูกส่งไปใน server logs หรือ Referer header:

```text
https://order.example.com/menu#qr=kbq_<table-uuid>.<random-secret>
```

สร้างไฟล์ PNG ด้วยคำสั่ง:

```bash
npm run qr -- --label=A01 --qr-code='kbq_<table-uuid>.<random-secret>' --base-url=https://order.example.com
```

ไฟล์จะถูกสร้างที่ `public/qrcodes/table-A01.png` สคริปต์จะไม่พิมพ์ QR secret
ออกทาง console เมื่อสแกนแล้ว Frontend จะลบ fragment ทันที แลกเป็น Customer JWT
ผ่าน Backend และเก็บ token ไว้ใน `sessionStorage` เท่านั้น

Production build ต้องกำหนด `VITE_API_BASE_URL` ใน build environment เป็น URL ของ
KanoonBite Backend โดยไม่ใส่ JWT secret หรือ hardcode production URL ลง source code

## CI/CD — Cloudflare Workers

โปรเจกต์ deploy เป็น Cloudflare Workers Static Assets โดยใช้ `wrangler.jsonc`
และตั้งค่า SPA fallback เพื่อให้ route เช่น `/menu` และ `/cart` เปิดโดยตรงได้

แยก workflow ตามหน้าที่:

- `.github/workflows/ci.yml` — ทุก push และ pull request รัน `npm ci`, lint
  และ production build โดยไม่มีสิทธิ์เข้าถึง Cloudflare secrets
- `.github/workflows/cd.yml` — รอ workflow `CI` ของ branch `main` สำเร็จจาก push
  แล้วจึง checkout commit ที่ผ่านการตรวจและ deploy

### ตั้งค่า Cloudflare

1. ใน Cloudflare Dashboard สร้าง API Token จาก template **Edit Cloudflare Workers**
   และจำกัด resource ให้เหลือเฉพาะ account ที่ต้องการ
2. คัดลอก **Account ID** จาก Cloudflare Dashboard
3. ไปที่ GitHub repository → **Settings → Secrets and variables → Actions**
4. เพิ่ม Repository secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
5. ใน production environment เพิ่ม variable `VITE_API_BASE_URL` เป็น URL ของ Backend
6. Push commit เข้า `main` แล้วตรวจผลที่แท็บ **Actions**

Worker จะใช้ชื่อ `kanoonbite-fe` ตาม `wrangler.jsonc` และหลัง deploy ครั้งแรก
Cloudflare จะแสดง URL รูปแบบ `https://kanoonbite-fe.<subdomain>.workers.dev`

ทดสอบ deployment package โดยไม่ upload:

```bash
npm run deploy:dry-run
```

หาก login Wrangler ไว้แล้ว สามารถ deploy จากเครื่องได้ด้วย:

```bash
npm run deploy
```
