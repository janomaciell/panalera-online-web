import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Smoothly scroll to a hash target on the page.
 * If we're already on '/', scroll directly.
 * If on another page, navigate to '/' first — the useScrollToHash hook picks it up.
 */
export function scrollToId(id) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

/**
 * Handle a click on a hash link like "#productos".
 * Works from any page — navigates to "/" first if needed.
 */
export function useHashNavigate() {
  const navigate = useNavigate()
  const location = useLocation()

  return (hash, e) => {
    if (e) e.preventDefault()
    const id = hash.replace('#', '')

    if (location.pathname === '/') {
      // Already on home — just scroll
      setTimeout(() => scrollToId(id), 50)
    } else {
      // Navigate to home with hash
      navigate('/' + hash)
    }
  }
}

/**
 * Hook: on mount (or location change), scroll to the hash in the URL.
 * Place this in the Home component.
 */
export function useScrollToHash() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      // Small delay to let the DOM render
      const timer = setTimeout(() => scrollToId(id), 150)
      return () => clearTimeout(timer)
    } else {
      // No hash — scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location.hash])
}
