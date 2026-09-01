import { useCallback, useEffect, useRef, useState } from "react"

// Drives the loading / success / empty / error states every list-backed page
// needs (contract §62), from a single async fetcher function.
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(undefined)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const run = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcherRef
      .current()
      .then((res) => {
        if (cancelled) return
        setData(res)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const cancel = run()
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, error, loading, refetch: run }
}
