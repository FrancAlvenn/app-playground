import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const baseUrl = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000'
  const api = `${baseUrl}/api`
  const getAccessToken = () => localStorage.getItem('access_token') || ''
  const setAccessToken = (t) => localStorage.setItem('access_token', t)
  const clearAccessToken = () => localStorage.removeItem('access_token')

  async function getCsrf() {
    const res = await fetch(`${api}/csrf`, { credentials: 'include' })
    const data = await res.json()
    return data.csrfToken
  }

  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoading(true)
      try {
        const at = getAccessToken()
        if (at) {
          const res = await fetch(`${api}/me`, { headers: { Authorization: `Bearer ${at}` }, credentials: 'include' })
          if (res.ok) {
            const data = await res.json()
            if (!cancelled) setUser(data.user)
            return
          }
        }
        async function refreshAccessTokenLocal() {
          try {
            const token = await getCsrf()
            const res = await fetch(`${api}/refresh`, {
              method: 'POST',
              headers: { 'x-xsrf-token': token, 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({}),
            })
            if (!res.ok) return null
            const data = await res.json()
            if (data.accessToken) setAccessToken(data.accessToken)
            return data.accessToken
          } catch {
            return null
          }
        }
        const newAt = await refreshAccessTokenLocal()
        if (newAt) {
          const res2 = await fetch(`${api}/me`, { headers: { Authorization: `Bearer ${newAt}` }, credentials: 'include' })
          if (res2.ok) {
            const data2 = await res2.json()
            if (!cancelled) setUser(data2.user)
          } else if (!cancelled) {
            setUser(null)
          }
        } else if (!cancelled) {
          setUser(null)
        }
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [api])

  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const token = await getCsrf()
      const res = await fetch(`${api}/login`, {
        method: 'POST',
        headers: { 'x-xsrf-token': token, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Login failed')
      }
      const data = await res.json()
      setAccessToken(data.accessToken)
      setUser(data.user)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, displayName) => {
    setLoading(true)
    try {
      const token = await getCsrf()
      const res = await fetch(`${api}/signup`, {
        method: 'POST',
        headers: { 'x-xsrf-token': token, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, displayName }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Sign up failed')
      }
    } finally {
      setLoading(false)
    }
  }


  const logout = async () => {
    setLoading(true)
    try {
      const token = await getCsrf()
      await fetch(`${api}/logout`, {
        method: 'POST',
        headers: { 'x-xsrf-token': token },
        credentials: 'include',
      })
    } finally {
      clearAccessToken()
      setUser(null)
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
