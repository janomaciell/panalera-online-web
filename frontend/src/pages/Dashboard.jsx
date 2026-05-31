import { useState } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import OrdersBoard from '@/dashboard/OrdersBoard/OrdersBoard'
import ProductManager from '@/dashboard/ProductManager/ProductManager'
import ShippingManager from '@/dashboard/ShippingManager/ShippingManager'
import { FiPackage, FiShoppingBag, FiMap } from 'react-icons/fi'
import styles from './Dashboard.module.css'

const NAV = [
  { to: '/dashboard', label: 'Pedidos', icon: <FiPackage />, end: true },
  { to: '/dashboard/productos', label: 'Productos', icon: <FiShoppingBag /> },
  { to: '/dashboard/envios', label: 'Zonas de envío', icon: <FiMap /> },
]

export default function Dashboard() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { clearAuth(); navigate('/') }

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.sidebarLogo}>Pañalera<span>.</span></div>
          <div className={styles.sidebarLabel}>Dashboard</div>
        </div>
        <nav className={styles.nav}>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}
            >
              <span className={styles.navIcon}>{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{user?.name?.[0] || 'A'}</div>
            <div>
              <div className={styles.userName}>{user?.name}</div>
              <div className={styles.userRole}>Administrador</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>Salir</button>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        <Routes>
          <Route index element={<OrdersBoard />} />
          <Route path="productos" element={<ProductManager />} />
          <Route path="envios" element={<ShippingManager />} />
        </Routes>
      </main>
    </div>
  )
}
