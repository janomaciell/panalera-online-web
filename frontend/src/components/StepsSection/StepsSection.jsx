import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FiShoppingCart, FiCreditCard, FiPackage, FiTruck } from 'react-icons/fi'
import styles from './StepsSection.module.css'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  { num: '01', icon: <FiShoppingCart />, title: 'Elegís tu pack', desc: 'Seleccionás talle y cantidad. Sin cuentas obligatorias, sin pasos innecesarios.' },
  { num: '02', icon: <FiCreditCard />, title: 'Pagás con MercadoPago', desc: 'Tarjeta, transferencia o dinero en cuenta. Confirmación inmediata por email.' },
  { num: '03', icon: <FiPackage />, title: 'Preparamos tu pedido', desc: 'El 1° o el 15 de cada mes sale el envío. Te avisamos en cada etapa.' },
  { num: '04', icon: <FiTruck />, title: 'Llega a tu puerta', desc: 'Entrega directa en tu domicilio de la costa. Sin sorpresas ni demoras.' },
]

export default function StepsSection() {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.step-card', { opacity: 0, y: 48 }, {
        opacity: 1, y: 0, stagger: 0.1, duration: 1.0, ease: 'power2.out',
        scrollTrigger: { trigger: '.steps-grid', start: 'top 85%', once: true }
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className={styles.section} ref={ref}>
      <div className="container">
        <div className="section-header">
          <span className="tag" style={{ background: 'rgba(220,238,255,0.12)', color: 'rgba(220,238,255,0.8)' }}>
            Cómo funciona
          </span>
          <h2 className="section-title" style={{ color: 'white', marginTop: 16 }}>Tres pasos, sin vueltas</h2>
          <p className="section-sub" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Comprás, nosotros preparamos, y el pedido llega a tu puerta en la costa.
          </p>
        </div>
        <div className={`${styles.grid} steps-grid`}>
          {STEPS.map((s) => (
            <div key={s.num} className={`${styles.card} step-card`}>
              <div className={styles.num}>{s.num}</div>
              <div className={styles.icon}>{s.icon}</div>
              <h3 className={styles.title}>{s.title}</h3>
              <p className={styles.desc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
