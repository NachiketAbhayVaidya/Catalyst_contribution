import { createContext, useContext, useEffect, useState, useCallback } from "react"
import * as authApi from "@/api/auth"
import { getAccessToken, setTokens, clearTokens } from "@/api/client"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setInitializing(false)
      return
    }
    authApi
      .getMe(token)
      .then((res) => setUser(res.data))
      .catch(() => clearTokens())
      .finally(() => setInitializing(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password })
    setTokens({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken })
    setUser(res.data.user)
    return res.data.user
  }, [])

  const register = useCallback(async (name, email, password, options = {}) => {
    const res = await authApi.register({ name, email, password, role: options.role, adminCode: options.adminCode })
    setTokens({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken })
    setUser(res.data.user)
    return res.data.user
  }, [])

  const loginWithGoogle = useCallback(async (credential) => {
    const res = await authApi.loginWithGoogle({ credential })
    setTokens({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken })
    setUser(res.data.user)
    return res.data.user
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, initializing, login, register, loginWithGoogle, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
