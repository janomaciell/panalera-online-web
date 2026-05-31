import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function staggerReveal(selector, trigger) {
  const elements = typeof selector === 'string' ? document.querySelectorAll(selector) : selector
  if (!elements?.length) return

  gsap.fromTo(
    elements,
    { opacity: 0, y: 60 },
    {
      opacity: 1,
      y: 0,
      stagger: 0.12,
      duration: 1.0,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: trigger || elements[0],
        start: 'top 85%',
        once: true,
      },
    }
  )
}
