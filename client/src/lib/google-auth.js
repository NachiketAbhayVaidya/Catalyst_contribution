// Google Identity Services (GSI) helpers. The <script> tag is loaded in
// index.html; this just waits for `window.google` to be ready.

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ""

export function waitForGoogleIdentity(timeoutMs = 8000) {
  if (window.google?.accounts?.id) return Promise.resolve(window.google)
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval)
        resolve(window.google)
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval)
        reject(new Error("Google Sign-In failed to load. Check your connection and try again."))
      }
    }, 100)
  })
}
