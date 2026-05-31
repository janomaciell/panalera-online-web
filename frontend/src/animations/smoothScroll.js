import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initSmoothScroll() {
  // We disable Lenis smooth scroll completely to restore 100% native browser scrolling.
  // This resolves all latency/delay issues, makes scrolling feel instant,
  // and eliminates any lag caused by scroll event interception.
  return null
}

export function destroySmoothScroll() {
  // No-op
}
