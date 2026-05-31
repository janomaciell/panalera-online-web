import { Link } from 'react-router-dom'
import { FiCreditCard, FiLock, FiHeart } from 'react-icons/fi'
import { useHashNavigate } from '@/utils/scrollToHash'
import styles from './Footer.module.css'

export default function Footer() {
  const hashNavigate = useHashNavigate()

  const handleLinkClick = (hash, e) => {
    hashNavigate(hash, e)
  }

  return (
    <footer className={styles.footer} id="contacto">
      <div className="container">
        <div className={styles.grid}>
          <div>
            <div className={styles.logo}>Pañalera Online</div>
            <p className={styles.desc}>
              Pañales premium sin fragancias ni cloro, entregados directamente a tu domicilio en la Costa Atlántica dos veces por mes.
            </p>
            <div className={styles.badges}>
              <span className={styles.badge}><FiCreditCard style={{ marginRight: 6 }} /> MercadoPago</span>
              <span className={styles.badge}><FiLock style={{ marginRight: 6 }} /> Pago seguro</span>
            </div>
          </div>
          <div>
            <div className={styles.heading}>Productos</div>
            <ul className={styles.links}>
              {['Talle RN', 'Talle P', 'Talle M', 'Talle G', 'Talle XG'].map(t => (
                <li key={t}>
                  <a href="#productos" onClick={(e) => handleLinkClick('#productos', e)}>{t}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className={styles.heading}>Envíos</div>
            <ul className={styles.links}>
              <li><a href="#envios" onClick={(e) => handleLinkClick('#envios', e)}>Zonas de envío</a></li>
              <li><a href="#">Retiro en Chascomús</a></li>
              <li><a href="#">Fechas de salida</a></li>
              <li><a href="#">Seguimiento</a></li>
            </ul>
          </div>
          <div>
            <div className={styles.heading}>Ayuda</div>
            <ul className={styles.links}>
              <li><a href="#">Preguntas frecuentes</a></li>
              <li><a href="#">Cambios y devoluciones</a></li>
              <li><a href="https://wa.me/5491100000000" target="_blank" rel="noreferrer">WhatsApp</a></li>
              <li><a href="mailto:hola@panalera.com">hola@panalera.com</a></li>
            </ul>
          </div>
        </div>
        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} Pañalera Online. Todos los derechos reservados.</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
            Hecho con <FiHeart style={{ color: 'var(--error)', fill: 'var(--error)' }} /> por <a href="https://clyra-studio.vercel.app/" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Clyra Studio</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
