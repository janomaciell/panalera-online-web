import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import Navbar from '@/components/Navbar/Navbar'
import { FiCheckCircle, FiPackage, FiTruck, FiMail, FiHome } from 'react-icons/fi'
import styles from './CheckoutSuccess.module.css'

export default function CheckoutSuccess() {
  useEffect(() => {
    gsap.fromTo('.success-content', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', delay: 0.2 })
  }, [])

  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <div className={`${styles.card} success-content`}>
          <div className={styles.icon}><FiCheckCircle /></div>
          <h1>¡Pedido confirmado!</h1>
          <p>Recibiste un email con los detalles de tu compra. Te vamos a avisar cuando tu pedido salga hacia la costa.</p>
          <div className={styles.steps}>
            {[
              { icon: <FiMail />, text: 'Revisá tu email — te enviamos la confirmación' },
              { icon: <FiPackage />, text: 'Tu pedido se prepara para el próximo envío' },
              { icon: <FiTruck />, text: 'Sale el 1° o el 15 desde Chascomús' },
              { icon: <FiHome />, text: 'Llega directo a tu puerta en la costa' },
            ].map(s => (
              <div key={s.text} className={styles.step}>
                <span>{s.icon}</span>
                <span>{s.text}</span>
              </div>
            ))}
          </div>
          <Link to="/" className="btn-primary" style={{ marginTop: 8 }}>Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
