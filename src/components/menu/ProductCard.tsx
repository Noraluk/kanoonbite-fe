import { Minus, Plus } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import type { MenuItem } from '../../types/menu'

interface ProductCardProps {
  item: MenuItem
}

export function ProductCard({ item }: ProductCardProps) {
  const quantity = useCartStore(
    (state) => state.items.find((cartItem) => cartItem.id === item.id)?.quantity ?? 0,
  )
  const addItem = useCartStore((state) => state.addItem)
  const decreaseItem = useCartStore((state) => state.decreaseItem)

  return (
    <article className="flex min-h-20 items-center gap-3 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
      <img
        src={item.imageUrl}
        alt=""
        width="64"
        height="64"
        loading="lazy"
        className="h-16 w-16 shrink-0 rounded-xl bg-orange-100 object-cover"
      />

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-stone-900">{item.name}</h3>
        <p className={item.popular ? 'text-sm font-semibold text-orange-600' : 'text-sm text-stone-500'}>
          {item.price.toLocaleString('th-TH')} ฿
        </p>
      </div>

      {quantity === 0 ? (
        <button
          type="button"
          onClick={() => addItem(item)}
          aria-label={`เพิ่ม ${item.name} ลงตะกร้า`}
          className={[
            'inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-colors motion-reduce:transition-none',
            item.popular
              ? 'border-orange-100 bg-orange-50 text-orange-600 hover:bg-orange-100'
              : 'border-stone-200 text-stone-800 hover:bg-stone-50',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600',
          ].join(' ')}
        >
          <Plus aria-hidden="true" size={20} strokeWidth={2} />
        </button>
      ) : (
        <div className="flex items-center gap-1" aria-label={`จำนวน ${quantity}`}>
          <button
            type="button"
            onClick={() => decreaseItem(item.id)}
            aria-label={`ลดจำนวน ${item.name}`}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            <Minus aria-hidden="true" size={18} />
          </button>
          <span className="min-w-5 text-center text-sm font-bold text-stone-900">{quantity}</span>
          <button
            type="button"
            onClick={() => addItem(item)}
            aria-label={`เพิ่มจำนวน ${item.name}`}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            <Plus aria-hidden="true" size={18} />
          </button>
        </div>
      )}
    </article>
  )
}
