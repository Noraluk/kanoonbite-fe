import { Link } from 'react-router-dom'

export function NotFoundScreen() {
  return (
    <section aria-labelledby="not-found-heading">
      <p className="mb-2 font-semibold text-brand-600">404</p>
      <h1 id="not-found-heading" className="text-3xl font-bold text-slate-900">
        ไม่พบหน้าที่ต้องการ
      </h1>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-brand-600 px-4 font-medium text-white transition-colors hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 motion-reduce:transition-none"
      >
        กลับไปหน้าเมนู
      </Link>
    </section>
  )
}
