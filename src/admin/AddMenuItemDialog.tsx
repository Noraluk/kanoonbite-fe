import { ImagePlus, X } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import type { NewAdminMenuItem } from './types'

interface AddMenuItemDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (item: NewAdminMenuItem) => void
}

const categories = ['Grill Sets', 'Meat', 'Seafood', 'Sides', 'Drinks']

export function AddMenuItemDialog({ isOpen, onClose, onAdd }: AddMenuItemDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
      nameInputRef.current?.focus()
    } else if (!isOpen && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [isOpen])

  const resetForm = () => {
    setName('')
    setCategory(categories[0])
    setPrice('')
    setImageUrl('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const numericPrice = Number(price)
    if (!name.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0) return
    onAdd({ name: name.trim(), category, price: numericPrice, imageUrl: imageUrl.trim() })
    handleClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="admin-dialog"
      onCancel={(event) => { event.preventDefault(); handleClose() }}
      onClose={() => isOpen && onClose()}
    >
      <form onSubmit={handleSubmit} className="admin-dialog-form">
        <button type="button" className="admin-dialog-close" onClick={handleClose} aria-label="Close add menu item dialog">
          <X aria-hidden="true" />
        </button>
        <ImagePlus aria-hidden="true" className="admin-dialog-icon" size={30} />
        <h2>Add a menu item</h2>
        <p>It appears in this admin demo immediately.</p>

        <label htmlFor="admin-dish-name">Dish name</label>
        <input
          ref={nameInputRef}
          id="admin-dish-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Grilled Pork Neck"
          required
        />

        <div className="admin-dialog-grid">
          <div>
            <label htmlFor="admin-category">Category</label>
            <select id="admin-category" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="admin-price">Price ฿</label>
            <input
              id="admin-price"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
            />
          </div>
        </div>

        <label htmlFor="admin-image-url">Image URL</label>
        <input
          id="admin-image-url"
          type="url"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://…/dish.jpg"
        />
        <small>Paste a public image link, or leave blank to use the category icon.</small>

        <div className="admin-dialog-actions">
          <button type="button" className="admin-secondary-button" onClick={handleClose}>Cancel</button>
          <button type="submit" className="admin-primary-button">Add to menu</button>
        </div>
      </form>
    </dialog>
  )
}
