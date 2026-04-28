import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_LOCATION,
  GEOLOCATION_MAX_AGE_MS,
  GEOLOCATION_TIMEOUT_MS,
} from '../../constants/location'

// Cache vị trí ở module scope để mọi component mount chung session không hỏi lại permission.
let cachedLocation = null
let inflightPromise = null

const toFallbackState = (reason) => ({
  lat: DEFAULT_LOCATION.lat,
  lon: DEFAULT_LOCATION.lon,
  isDefault: true,
  isLoading: false,
  error: reason || null,
})

const resolveLocation = () => {
  if (cachedLocation) return Promise.resolve(cachedLocation)
  if (inflightPromise) return inflightPromise

  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    cachedLocation = toFallbackState('unsupported')
    return Promise.resolve(cachedLocation)
  }

  inflightPromise = new Promise((resolve) => {
    let done = false

    const timer = setTimeout(() => {
      if (done) return
      done = true
      cachedLocation = toFallbackState('timeout')
      inflightPromise = null
      resolve(cachedLocation)
    }, GEOLOCATION_TIMEOUT_MS)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (done) return
        done = true
        clearTimeout(timer)
        cachedLocation = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          isDefault: false,
          isLoading: false,
          error: null,
        }
        inflightPromise = null
        resolve(cachedLocation)
      },
      (err) => {
        if (done) return
        done = true
        clearTimeout(timer)
        cachedLocation = toFallbackState(err?.code === 1 ? 'denied' : 'error')
        inflightPromise = null
        resolve(cachedLocation)
      },
      {
        timeout: GEOLOCATION_TIMEOUT_MS - 500,
        maximumAge: GEOLOCATION_MAX_AGE_MS,
        // Bật high accuracy để dùng GPS/WiFi triangulation thay vì IP-based geolocation
        // (IP-based trả về vị trí ISP/datacenter, lệch hàng chục–trăm km so với vị trí thật).
        enableHighAccuracy: true,
      },
    )
  })

  return inflightPromise
}

export const useUserLocation = () => {
  const [state, setState] = useState(
    () =>
      cachedLocation || {
        lat: null,
        lon: null,
        isDefault: false,
        isLoading: true,
        error: null,
      },
  )
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    // Nếu đã có cache thì useState initializer đã dùng giá trị đó — không cần setState lại.
    if (!cachedLocation) {
      resolveLocation().then((next) => {
        if (!mountedRef.current) return
        setState(next)
      })
    }

    return () => {
      mountedRef.current = false
    }
  }, [])

  const retry = useCallback(() => {
    cachedLocation = null
    inflightPromise = null
    setState({
      lat: null,
      lon: null,
      isDefault: false,
      isLoading: true,
      error: null,
    })
    resolveLocation().then((next) => {
      if (!mountedRef.current) return
      setState(next)
    })
  }, [])

  return { ...state, retry }
}

export default useUserLocation
