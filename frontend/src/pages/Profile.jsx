import { useMyOrders } from '@/hooks/useOrders'
import { useAuthStore } from '@/store/useAuthStore'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import { formatCurrency, formatDate } from '@/utils/formatCurrency'
import { FiTruck, FiCheckCircle, FiPackage, FiUser } from 'react-icons/fi'
import styles from './Profile.module.css'

const STATUS_LABELS = {
  pending: { label: 'Nuevo pedido', color: '#F59E0B' },
  preparing: { label: 'Preparando', color: '#3B82F6' },
  shipping: { label: <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Sale hoy <FiTruck /></span>, color: '#8B5CF6' },
  in_transit: { label: 'En camino', color: '#6366F1' },
  delivered: { label: <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Entregado <FiCheckCircle /></span>, color: '#2D7A4F' },
  cancelled: { label: 'Cancelado', color: '#EF4444' },
}

export default function Profile() {
  const { user } = useAuthStore()
  const { data: orders = [], isLoading } = useMyOrders()

  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <div className="container">
          <div className={styles.header}>
            <div className={styles.avatar}>{user?.name?.[0] || <FiUser />}</div>
            <div>
              <h1>{user?.name}</h1>
              <p>{user?.email}</p>
            </div>
          </div>

          <h2 className={styles.ordersTitle}>Mis pedidos</h2>

          {isLoading && <div className={styles.loading}>Cargando pedidos...</div>}
          {!isLoading && orders.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><FiPackage /></div>
              <p>Todavía no realizaste ningún pedido.</p>
              <a href="/#productos" className="btn-primary" style={{ marginTop: 16 }}>Ver productos</a>
            </div>
          )}

          <div className={styles.ordersList}>
            {orders.map(order => {
              const s = STATUS_LABELS[order.status] || {}
              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderTop}>
                    <div>
                      <div className={styles.orderId}>Pedido #{order.id.slice(0, 8).toUpperCase()}</div>
                      <div className={styles.orderDate}>{formatDate(order.created_at)}</div>
                    </div>
                    <div className={styles.orderStatus} style={{ color: s.color, background: `${s.color}15` }}>
                      {s.label}
                    </div>
                  </div>
                  <div className={styles.orderItems}>
                    {order.items?.map(i => (
                      <div key={i.id} className={styles.orderItem}>
                        <span>{i.product_title || 'Producto'}</span>
                        <span>x{i.quantity}</span>
                        <span>{formatCurrency(i.price * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.orderTotal}>
                    Total: <strong>{formatCurrency(order.total)}</strong>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
