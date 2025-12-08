"use client"

import { useEffect, useRef } from "react"

export function useAutoScroll<T extends HTMLElement>(
  dependencies: any[] = [],
  options: {
    behavior?: ScrollBehavior
    delay?: number
  } = {}
) {
  const ref = useRef<T>(null)
  const { behavior = "smooth", delay = 100 } = options

  useEffect(() => {
    if (!ref.current) return

    const timer = setTimeout(() => {
      const element = ref.current
      if (element) {
        element.scrollTo({
          top: element.scrollHeight,
          behavior
        })
      }
    }, delay)

    return () => clearTimeout(timer)
  }, dependencies)

  return ref
}