import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FiStar } from 'react-icons/fi'
import styles from './Testimonials.module.css'

gsap.registerPlugin(ScrollTrigger)

const TESTIMONIALS = [
  { stars: 5, text: 'Para mí la comodidad y discreción son fundamentales. Desde que descubrí Pañalera Online no tengo que ir más a la farmacia. Calidad excelente, son súper absorbentes y sin químicos raros.', name: 'Nora B.', location: 'Pinamar', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80', bg: '#E8F5EE' },
  { stars: 5, text: 'Mi piel es súper sensible y con estos pañales para adultos no tuve más problemas. El pedido llegó puntual el 15, como dijeron. Lo recomendé a todos mis conocidos en Mar de Ajó.', name: 'Roberto M.', location: 'Mar de Ajó', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80', bg: '#DCEEFF' },
  { stars: 5, text: 'Compro para mi padre mayor y la atención es de primera. Nos envían directo a Cariló y llega perfecto. La web es clarísima, podemos hacer el pedido súper fácil. Lo usamos todos los meses.', name: 'Graciela F.', location: 'Cariló', avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=120&h=120&q=80', bg: '#F5EFE7' },
]

export default function Testimonials() {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.testimonial-card', { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, stagger: 0.12, duration: 1.0, ease: 'power2.out',
        scrollTrigger: { trigger: '.testimonials-grid', start: 'top 85%', once: true }
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className={styles.section} ref={ref}>
      <div className="container">
        <div className="section-header">
          <span className="tag">Clientes que confían</span>
          <h2 className="section-title" style={{ marginTop: 16 }}>Lo que dicen nuestros clientes</h2>
        </div>
        <div className={`${styles.grid} testimonials-grid`}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className={`${styles.card} testimonial-card`}>
              <div className={styles.stars}>
                {[...Array(t.stars)].map((_, i) => (
                  <FiStar key={i} className={styles.starIcon} />
                ))}
              </div>
              <p className={styles.text}>"{t.text}"</p>
              <div className={styles.author}>
                <div className={styles.avatarWrapper}>
                  <img src={t.avatar} alt={t.name} className={styles.avatarImg} />
                </div>
                <div>
                  <div className={styles.name}>{t.name}</div>
                  <div className={styles.location}>{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
