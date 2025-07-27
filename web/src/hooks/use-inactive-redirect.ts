"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLocalStorage } from "./use-local-storage"
import { EPages } from "@/lib/pages.enum"

const INACTIVITY_LIMIT_MS = 1000 * 60 * 60 * 5 // 5 horas
const CHECK_INTERVAL_MS = 1000 * 60 * 10 // 10 minutos

export function useInactivityRedirect() {
  const router = useRouter()
  const {
    storedValue: lastActivity,
    setValue: setLastActivity,
    removeValue: removeLastActivity
  } = useLocalStorage("lastActivity", Date.now().toString())

  useEffect(() => {
    const updateActivity = () => {
      const now = Date.now()
      const last = parseInt(lastActivity, 10)

      if (now - last > INACTIVITY_LIMIT_MS) {
        removeLastActivity()
        router.push(EPages.LOGIN)
      } else {
        setLastActivity(now.toString())
      }
    }

    const checkInactivity = () => {
      const now = Date.now()
      const last = parseInt(lastActivity, 10)

      if (now - last > INACTIVITY_LIMIT_MS) {
        removeLastActivity()
        router.push(EPages.LOGIN)
      }
    }

    // Listener de toque
    window.addEventListener("touchstart", updateActivity)

    // Verificação automática a cada 1 minuto
    const interval = setInterval(checkInactivity, CHECK_INTERVAL_MS)

    return () => {
      window.removeEventListener("touchstart", updateActivity)
      clearInterval(interval)
    }
  }, [router, lastActivity, setLastActivity, removeLastActivity])
}
