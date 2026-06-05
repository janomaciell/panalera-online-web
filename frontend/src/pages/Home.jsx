import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import Navbar from '@/components/Navbar/Navbar'
import Hero from '@/components/Hero/Hero'
import CutoffBanner from '@/components/CutoffBanner/CutoffBanner'
import StepsSection from '@/components/StepsSection/StepsSection'
import Testimonials from '@/components/Testimonials/Testimonials'
import Footer from '@/components/Footer/Footer'
import styles from './Home.module.css'

export default function Home() {
  const pageRef = useRef(null)

  useEffect(() => {
    // Reset view to top
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return (
    <div ref={pageRef}>
      <Navbar />
      <Hero />
      <CutoffBanner />
      
      {/* Steps and Why we are the best benefits */}
      <StepsSection />
      <Testimonials />

      {/* CTA card pointing to separate Pages */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaCard}>
            <div className={styles.ctaGlow}></div>
            <h2>Tu pedido, listo para<br />el próximo envío</h2>
            <p>Cerramos pedidos el día antes de cada salida. Hacé tu pedido hoy y lo recibís en el próximo lote.</p>
            <div className={styles.ctaActions}>
              <Link to="/productos" className={styles.ctaBtnPrimary}>
                Hacer mi pedido
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link to="/orientacion" className={styles.ctaBtnGhost}>
                🎯 Ayudame a elegir
              </Link>
              <Link to="/envios" className={styles.ctaBtnGhost}>Ver zonas de envío</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
