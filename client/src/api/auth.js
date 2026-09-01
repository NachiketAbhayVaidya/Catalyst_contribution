import { apiClient } from "./client"

// Auth always hits the real backend now, regardless of VITE_USE_MOCK — every
// other domain module (student.js, admin.js, gamification.js, ...) still
// respects the mock flag until their backend endpoints exist.

export async function register({ name, email, password, role, adminCode }) {
  return apiClient.post("/auth/register", { name, email, password, role, adminCode })
}

export async function login({ email, password }) {
  return apiClient.post("/auth/login", { email, password })
}

export async function refresh({ refreshToken }) {
  return apiClient.post("/auth/refresh", { refreshToken })
}

export async function getMe() {
  return apiClient.get("/auth/me")
}

// `credential` is the Google-issued ID token JWT from GoogleSignInButton.
// Backend verifies it and creates/looks up the matching account.
export async function loginWithGoogle({ credential }) {
  return apiClient.post("/auth/google", { credential })
}
