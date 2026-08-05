import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import { menuItems } from '../data/menuItems'
import { useCartStore } from '../store/cartStore'

interface LayoutContext {
  tableNumber: number | null
}

export function CartScreen() {
  const { tableNumber } = useOutletContext<LayoutContext>()
  const cartItems = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const decreaseItem = useCartStore((state) => state.decreaseItem)
  const clearCart = useCartStore((state) => state.clearCart)
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const menuUrl = tableNumber ? `/?table=${tableNumber}` : '/'

  return (
    <section className="min-h-[calc(100vh-3.5rem)] px-4 pb-32 pt-5" aria-labelledby="cart-heading">
      <div className="flex items-center gap-3">
        <Link
          to={menuUrl}
          aria-label="กลับไปหน้าเมนู"
          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
        >
          <ArrowLeft aria-hidden="true" size={22} />
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
            {tableNumber ? `Table ${tableNumber}` : 'No table'}
          </p>
          <h1 id="cart-heading" className="text-2xl font-bold text-stone-900">
            Your order
          </h1>
        </div>
        {cartItems.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            aria-label="ล้างตะกร้า"
            className="ml-auto inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-stone-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            <Trash2 aria-hidden="true" size={20} />
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-semibold text-stone-700">ยังไม่มีรายการอาหาร</p>
          <Link to={menuUrl} className="mt-3 inline-block min-h-11 py-2 font-semibold text-orange-600">
            เลือกเมนูอาหาร
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {cartItems.map((cartItem) => {
            const menuItem = menuItems.find((item) => item.id === cartItem.id)
            if (!menuItem) return null

            return (
              <article key={cartItem.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{cartItem.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-orange-600">
                      {(cartItem.price * cartItem.quantity).toLocaleString('th-TH')} ฿
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => decreaseItem(cartItem.id)}
                      aria-label={`ลดจำนวน ${cartItem.name}`}
                      className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-stone-200 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                    >
                      <Minus aria-hidden="true" size={18} />
                    </button>
                    <span className="min-w-8 text-center font-bold">{cartItem.quantity}</span>
                    <button
                      type="button"
                      onClick={() => addItem(menuItem)}
                      aria-label={`เพิ่มจำนวน ${cartItem.name}`}
                      className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                    >
                      <Plus aria-hidden="true" size={18} />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-stone-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            disabled
            title="ต้องเชื่อมต่อ Order API ก่อนเปิดรับออเดอร์จริง"
            className="flex min-h-14 w-full cursor-not-allowed items-center justify-between rounded-2xl bg-stone-300 px-5 font-bold text-white"
          >
            <span>รอเชื่อมต่อระบบรับออเดอร์</span>
            <span>{total.toLocaleString('th-TH')} ฿</span>
          </button>
        </div>
      )}
    </section>
  )
}
