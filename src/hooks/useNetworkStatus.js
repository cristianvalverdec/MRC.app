import { useState, useEffect } from 'react'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [justReconnected, setJustReconnected] = useState(false)

  useEffect(() => {
    let reconnectTimer

    const handleOnline = () => {
      setIsOnline(true)
      setJustReconnected(true)
      reconnectTimer = setTimeout(() => setJustReconnected(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setJustReconnected(false)
      clearTimeout(reconnectTimer)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearTimeout(reconnectTimer)
    }
  }, [])

  return { isOnline, justReconnected }
}
