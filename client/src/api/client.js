// Centralized API client. Every domain module (student.js, courses.js, ...) goes
// through this file instead of calling fetch() directly, per the API contract §63-64.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"

// While the backend isn't wired up yet, every domain module resolves against
// api/mockData.js instead. Flip to "false" in .env.local once the real API is live —
// no page or component needs to change, since responses keep the same {success,data} shape.
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false"

const ACCESS_TOKEN_KEY = "catalyst_access_token"
const REFRESH_TOKEN_KEY = "catalyst_refresh_token"

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(code, message, status, details) {
    super(message || "Something went wrong")
    this.code = code || "UNKNOWN_ERROR"
    this.status = status
    this.details = details
  }
}

let refreshPromise = null

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) return false
      setTokens({ accessToken: json.data.accessToken, refreshToken })
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

async function request(path, { method = "GET", body, params, isForm = false, retry = true } = {}) {
  const url = new URL(API_BASE_URL.replace(/\/$/, "") + path)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value)
    })
  }

  const headers = {}
  if (!isForm) headers["Content-Type"] = "application/json"
  const token = getAccessToken()
  if (token) headers["Authorization"] = `Bearer ${token}`

  let res
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError("NETWORK_ERROR", "Unable to reach the server. Check your connection and try again.", 0)
  }

  if (res.status === 401 && retry && getRefreshToken()) {
    const refreshed = await refreshAccessToken()
    if (refreshed) return request(path, { method, body, params, isForm, retry: false })
    clearTokens()
    if (typeof window !== "undefined") window.location.href = "/login"
    throw new ApiError("UNAUTHENTICATED", "Your session has expired. Please log in again.", 401)
  }

  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    const err = json?.error
    throw new ApiError(err?.code, err?.message, res.status, err?.details)
  }
  return json
}

// CSV/report exports come back as a file, not the {success,data} envelope, so
// they bypass request() — but they still need the same auth header and the
// same one-shot refresh-and-retry on a 401.
async function download(path, { params, retry = true } = {}) {
  const url = new URL(API_BASE_URL.replace(/\/$/, "") + path)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value)
    })
  }

  const headers = {}
  const token = getAccessToken()
  if (token) headers["Authorization"] = `Bearer ${token}`

  let res
  try {
    res = await fetch(url.toString(), { method: "GET", headers })
  } catch {
    throw new ApiError("NETWORK_ERROR", "Unable to reach the server. Check your connection and try again.", 0)
  }

  if (res.status === 401 && retry && getRefreshToken()) {
    const refreshed = await refreshAccessToken()
    if (refreshed) return download(path, { params, retry: false })
    clearTokens()
    if (typeof window !== "undefined") window.location.href = "/login"
    throw new ApiError("UNAUTHENTICATED", "Your session has expired. Please log in again.", 401)
  }

  // A failed export still answers with the JSON error envelope.
  if (!res.ok) {
    const json = await res.json().catch(() => null)
    const err = json?.error
    throw new ApiError(err?.code, err?.message, res.status, err?.details)
  }

  const disposition = res.headers.get("Content-Disposition") || ""
  const match = /filename="?([^";]+)"?/i.exec(disposition)
  return {
    blob: await res.blob(),
    filename: match ? match[1] : "download",
    // Set by the backend when the export hit its row cap.
    truncatedAt: res.headers.get("X-Report-Truncated"),
  }
}

// Hands the file to the browser. Revoking on the next tick — rather than
// immediately — keeps Safari from cancelling the download mid-flight.
export function saveBlob(blob, filename) {
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = href
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(href), 0)
}

export const apiClient = {
  get: (path, params) => request(path, { method: "GET", params }),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
  upload: (path, formData) => request(path, { method: "POST", body: formData, isForm: true }),
  download,
}

// ---- Mock helpers, used by domain modules when USE_MOCK is true ----

export function mockDelay(data, ms = 350) {
  return new Promise((resolve) => setTimeout(() => resolve({ success: true, data }), ms))
}

export function mockError(code, message, status = 400, ms = 350) {
  return new Promise((_, reject) => setTimeout(() => reject(new ApiError(code, message, status)), ms))
}

export function paginate(list, { page = 1, limit = 20 } = {}) {
  const p = Number(page) || 1
  const l = Math.min(Number(limit) || 20, 100)
  const start = (p - 1) * l
  const items = list.slice(start, start + l)
  return {
    items,
    pagination: {
      page: p,
      limit: l,
      total: list.length,
      totalPages: Math.max(1, Math.ceil(list.length / l)),
    },
  }
}

export function mockPaginated(list, params, ms = 350) {
  const { items, pagination } = paginate(list, params)
  return new Promise((resolve) => setTimeout(() => resolve({ success: true, data: items, pagination }), ms))
}
