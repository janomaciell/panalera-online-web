import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiShoppingCart, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { token, user, clearAuth } = useAuthStore()
  const count = useCartStore(s => s.items.reduce((acc, i) => acc + i.quantity, 0))
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleLogout = () => {
    clearAuth()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className="container">
        <div className={styles.inner}>
          <Link to="/" className={styles.logo} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Pañalera Online<span>.</span>
          </Link>

          {/* Links & Mobile Actions Wrapper */}
          <div className={`${styles.menuWrapper} ${menuOpen ? styles.open : ''}`}>
            <ul className={styles.links}>
              <li><Link to="/productos" onClick={() => setMenuOpen(false)}>Productos</Link></li>
              <li><Link to="/materiales" onClick={() => setMenuOpen(false)}>Materiales</Link></li>
              <li><Link to="/envios" onClick={() => setMenuOpen(false)}>Envíos</Link></li>
              {user?.is_staff && <li><Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link></li>}
            </ul>
            
            {/* Auth actions inside mobile menu */}
            <div className={styles.mobileActions}>
              {token ? (
                <>
                  <Link to="/perfil" className={styles.profileBtnMobile} onClick={() => setMenuOpen(false)}>
                    <FiUser /> {user?.name || 'Mi cuenta'}
                  </Link>
                  <button className={styles.logoutBtnMobile} onClick={handleLogout}>
                    <FiLogOut /> Salir
                  </button>
                </>
              ) : (
                <Link to="/login" className={`btn-primary ${styles.loginBtnMobile}`} onClick={() => setMenuOpen(false)}>Ingresar</Link>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <Link to="/checkout" className={styles.cartBtn} aria-label={`Carrito, ${count} productos`}>
              <FiShoppingCart size={20} />
              {count > 0 && <span className={styles.cartBadge}>{count}</span>}
            </Link>

            <div className={styles.desktopAuth}>
              {token ? (
                <div className={styles.userMenu}>
                  <Link to="/perfil" className={styles.profileBtn}>
                    <FiUser style={{ marginRight: 6 }} />
                    {user?.name?.split(' ')[0] || 'Mi cuenta'}
                  </Link>
                  <button className={styles.logoutBtn} onClick={handleLogout}>
                    <FiLogOut size={16} />
                  </button>
                </div>
              ) : (
                <Link to="/login" className={`btn-primary ${styles.loginBtn}`}>Ingresar</Link>
              )}
            </div>

            <button
              className={styles.hamburger}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
