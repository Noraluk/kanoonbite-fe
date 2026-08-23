import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AdminIdentity } from '../api/admin.api'

interface AdminAuthState {
  accessToken: string | null
  expiresAt: number | null
  admin: AdminIdentity | null
  setSession: (accessToken: string, expiresIn: number, admin: AdminIdentity) => void
  signOut: () => void
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      expiresAt: null,
      admin: null,
      setSession: (accessToken, expiresIn, admin) => set({
        accessToken,
        expiresAt: Date.now() + expiresIn * 1_000,
        admin,
      }),
      signOut: () => set({ accessToken: null, expiresAt: null, admin: null }),
    }),
    {
      name: 'kanoonbite.adminSession',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
