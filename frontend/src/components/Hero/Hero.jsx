import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { FiFeather, FiShield, FiTruck } from 'react-icons/fi'
import styles from './Hero.module.css'

export default function Hero() {
  const containerRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.15 })
      tl.fromTo('.hero-badge', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' })
        .fromTo('.hero-line', { opacity: 0, y: 48 }, { opacity: 1, y: 0, stagger: 0.11, duration: 1.0, ease: 'power3.out' }, '-=0.5')
        .fromTo('.hero-sub', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.5')
        .fromTo('.hero-actions', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
        .fromTo('.hero-trust', { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.3')
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section className={styles.hero} ref={containerRef}>
      <div className={styles.heroOverlay}></div>
      <div className="container">
        <div className={styles.layout}>
          {/* Content */}
          <div className={styles.content}>
            <div className={`${styles.badge} hero-badge`}>
              <div className={styles.badgeDot}></div>
              <span>Envíos a la Costa Atlántica</span>
            </div>

            <h1 className={styles.heading}>
              <span className={`${styles.line} hero-line`}>Pañales</span>
              <span className={`${styles.line} ${styles.accent} hero-line`}>premium,</span>
              <span className={`${styles.line} hero-line`}>para adultos</span>
            </h1>

            <p className={`${styles.sub} hero-sub`}>
              Hipoalergénicos, ultra absorbentes y súper suaves. Diseñados para la comodidad y el cuidado de los que más querés. Entregas en toda la Costa.
            </p>

            <div className={`${styles.actions} hero-actions`}>
              <Link to="/productos" className="btn-primary">
                Ver productos
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link to="/envios" className="btn-secondary">Zonas de envío</Link>
            </div>

            <div className={`${styles.trust} hero-trust`}>
              {[
                { icon: <FiFeather />, label: 'Sin fragancias' },
                { icon: <FiShield />, label: 'Hipoalergénico' },
                { icon: <FiTruck />, label: 'Envío 2×/mes' },
              ].map(item => (
                <div key={item.label} className={styles.trustItem}>
                  <div className={styles.trustIcon}>{item.icon}</div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
