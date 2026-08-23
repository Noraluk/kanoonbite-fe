import { Flame, LoaderCircle, LockKeyhole } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { loginAdmin } from '../api/admin.api'
import { ApiError } from '../types/api'
import { useAdminAuthStore } from './adminAuthStore'

interface LoginLocationState {
  from?: string
}

export function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const accessToken = useAdminAuthStore((state) => state.accessToken)
  const expiresAt = useAdminAuthStore((state) => state.expiresAt)
  const setSession = useAdminAuthStore((state) => state.setSession)
  const navigate = useNavigate()
  const location = useLocation()
  const requestRef = useRef<AbortController | null>(null)
  const destination = (location.state as LoginLocationState | null)?.from ?? '/admin/orders'
  const hasValidSession = Boolean(accessToken && expiresAt && expiresAt > Date.now())

  useEffect(() => () => requestRef.current?.abort(), [])

  if (hasValidSession) return <Navigate to="/admin/orders" replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Enter both email and password.')
      return
    }

    setError('')
    setIsSubmitting(true)
    const controller = new AbortController()
    requestRef.current = controller

    try {
      const response = await loginAdmin(email.trim(), password, controller.signal)
      setSession(response.data.accessToken, response.data.expiresIn, response.data.admin)
      navigate(destination, { replace: true })
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      if (requestError instanceof ApiError && requestError.status === 429) {
        setError('Too many attempts. Please wait and try again.')
      } else if (requestError instanceof ApiError && requestError.status === 401) {
        setError('Email or password is incorrect.')
      } else {
        setError('Unable to sign in. Check the server connection and try again.')
      }
    } finally {
      requestRef.current = null
      setIsSubmitting(false)
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="admin-login-heading">
        <div className="admin-login-brand">
          <span className="admin-login-mark" aria-hidden="true"><Flame size={30} fill="currentColor" /></span>
          <div>
            <h1 id="admin-login-heading">Kanoonbite Admin</h1>
            <p>Staff sign in</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'admin-login-error' : undefined}
            disabled={isSubmitting}
            autoFocus
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'admin-login-error' : undefined}
            disabled={isSubmitting}
          />

          {error && <p id="admin-login-error" className="admin-form-error" role="alert">{error}</p>}

          <button type="submit" className="admin-primary-button" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle aria-hidden="true" className="admin-spin" size={19} />}
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <aside className="admin-demo-notice">
          <LockKeyhole aria-hidden="true" size={18} />
          Admin access only. Your password is sent to the server and is never stored in this browser.
        </aside>
      </section>
    </main>
  )
}
