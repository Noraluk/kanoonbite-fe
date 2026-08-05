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

ตรวจสอบ production build และ lint:

```bash
npm run build
npm run lint
```

## โครงสร้าง `src/`

```text
src/
├── components/
│   └── layout/          # Layout และ navigation ที่ใช้ร่วมกัน
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

- `/?table=12` — MenuScreen สำหรับโต๊ะ 12 (URL ที่ใส่ใน QR Code)
- `/cart?table=12` — CartScreen สำหรับโต๊ะ 12
- `*` — NotFoundScreen

## สร้าง QR Code ประจำโต๊ะ

QR Code ของแต่ละโต๊ะต้องชี้มาที่ production URL และมี query parameter
`table` ตัวอย่างสำหรับโต๊ะ 12:

```text
https://order.example.com/?table=12
```

สร้างไฟล์ PNG ด้วยคำสั่ง:

```bash
npm run qr -- --table=12 --base-url=https://order.example.com
```

ไฟล์จะถูกสร้างที่ `public/qrcodes/table-12.png` เมื่อลูกค้าสแกน แอปจะอ่าน
หมายเลขโต๊ะจาก URL และเก็บไว้ใน `sessionStorage` ตลอดการสั่งอาหารในแท็บนั้น

สำหรับ production ควรตรวจสอบหมายเลขโต๊ะกับ API ของร้านก่อนรับออเดอร์ และหากต้องการ
ป้องกันการแก้เลขโต๊ะใน URL ควรเปลี่ยนจากเลขโต๊ะตรง ๆ เป็น signed table token ที่ backend ออกให้

## CI/CD — Cloudflare Workers

โปรเจกต์ deploy เป็น Cloudflare Workers Static Assets โดยใช้ `wrangler.jsonc`
และตั้งค่า SPA fallback เพื่อให้ route เช่น `/cart?table=12` เปิดโดยตรงได้

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
5. Push commit เข้า `main` แล้วตรวจผลที่แท็บ **Actions**

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
