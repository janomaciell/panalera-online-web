import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function revealFadeUp(elements, options = {}) {
  if (!elements) return
  const els = typeof elements === 'string' ? document.querySelectorAll(elements) : elements
  if (!els.length && !els.nodeType) return

  gsap.fromTo(
    els,
    { opacity: 0, y: 40 },
    {
      opacity: 1,
      y: 0,
      duration: options.duration || 1.1,
      stagger: options.stagger || 0,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: options.trigger || (els.length ? els[0] : els),
        start: options.start || 'top 88%',
        once: true,
      },
      delay: options.delay || 0,
      ...options,
    }
  )
}

export function revealHero(tl) {
  return tl
    .fromTo('.hero-badge', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
    .fromTo('.hero-heading .line', { opacity: 0, y: 50 }, { opacity: 1, y: 0, stagger: 0.12, duration: 1.0, ease: 'power3.out' }, '-=0.5')
    .fromTo('.hero-sub', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.5')
    .fromTo('.hero-actions', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
    .fromTo('.hero-trust', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
}
