import { useMyOrders } from '@/hooks/useOrders'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import { formatCurrency, formatDate } from '@/utils/formatCurrency'
import { crmService } from '@/services/crmService'
import { FiTruck, FiCheckCircle, FiPackage, FiUser, FiRefreshCw, FiShoppingCart } from 'react-icons/fi'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Profile.module.css'

const STATUS_LABELS = {
  pending:    { label: 'Nuevo pedido',  color: '#F59E0B' },
  preparing:  { label: 'Preparando',   color: '#3B82F6' },
  shipping:   { label: <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>Sale hoy <FiTruck /></span>, color: '#8B5CF6' },
  in_transit: { label: 'En camino',    color: '#6366F1' },
  delivered:  { label: <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>Entregado <FiCheckCircle /></span>, color: '#2D7A4F' },
  cancelled:  { label: 'Cancelado',    color: '#EF4444' },
}

export default function Profile() {
  const { user } = useAuthStore()
  const { data: orders = [], isLoading } = useMyOrders()
  const { addItem, clearCart } = useCartStore()
  const navigate = useNavigate()
  const [reorderingId, setReorderingId] = useState(null)

  const handleReorder = async (orderId) => {
    setReorderingId(orderId)
    try {
      const data = await crmService.getReorderItems(orderId)
      if (!data.items || data.items.length === 0) {
        alert('No hay productos disponibles para reordenar.')
        return
      }
      clearCart()
      data.items.forEach(item => {
        if (item.stock > 0) {
          addItem({
            id:       item.id,
            title:    item.title,
            slug:     item.slug,
            price:    Number(item.price),
            image:    item.image,
            size:     item.size,
            category: item.category,
          }, item.quantity)
        }
      })
      navigate('/checkout')
    } catch {
      alert('No se pudo cargar el pedido. Intentá de nuevo.')
    } finally {
      setReorderingId(null)
    }
  }

  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <div className="container">
          <div className={styles.header}>
            <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase() || <FiUser />}</div>
            <div>
              <h1>{user?.name}</h1>
              <p>{user?.email}</p>
              {user?.recipient_type && user.recipient_type !== 'particular' && (
                <span className={styles.recipientBadge}>
                  {user.recipient_type === 'residencia' ? '🏥 Residencia' : '🏢 Institución'}
                  {user.institution_name ? ` — ${user.institution_name}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* CRM stats */}
          {user?.purchase_count > 0 && (
            <div className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.statValue}>{user.purchase_count}</div>
                <div className={styles.statLabel}>Pedidos</div>
              </div>
              {user.avg_ticket && (
                <div className={styles.stat}>
                  <div className={styles.statValue}>{formatCurrency(user.avg_ticket)}</div>
                  <div className={styles.statLabel}>Ticket promedio</div>
                </div>
              )}
            </div>
          )}

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
              const isReordering = reorderingId === order.id
              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderTop}>
                    <div>
                      <div className={styles.orderId}>Pedido #{order.id.slice(0, 8).toUpperCase()}</div>
                      <div className={styles.orderDate}>{formatDate(order.created_at)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={styles.orderStatus} style={{ color: s.color, background: `${s.color}15` }}>
                        {s.label}
                      </div>
                      {/* Buy again button — only for delivered/approved orders */}
                      {order.payment_status === 'approved' && (
                        <button
                          className={styles.reorderBtn}
                          onClick={() => handleReorder(order.id)}
                          disabled={isReordering}
                          title="Comprar nuevamente"
                        >
                          {isReordering
                            ? <span className={styles.spinner} />
                            : <><FiRefreshCw size={13} /> Volver a pedir</>
                          }
                        </button>
                      )}
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

                  <div className={styles.orderFooter}>
                    <div className={styles.orderTotal}>
                      Total: <strong>{formatCurrency(order.total)}</strong>
                    </div>
                    {order.coupon_code && (
                      <span className={styles.couponBadge}>🏷 {order.coupon_code}</span>
                    )}
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
