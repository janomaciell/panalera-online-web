import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar/Navbar'
import styles from './NotFound.module.css'
export default function NotFound() {
  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.num}>404</div>
        <h1>Página no encontrada</h1>
        <p>La página que buscás no existe o fue movida.</p>
        <Link to="/" className="btn-primary" style={{ marginTop: 24 }}>Volver al inicio</Link>
      </div>
    </div>
  )
}
