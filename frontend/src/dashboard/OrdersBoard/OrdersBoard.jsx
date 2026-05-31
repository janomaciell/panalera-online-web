import { useState } from 'react'
import { useDashboardOrders, useUpdateOrderStatus } from '@/hooks/useOrders'
import { useQueryClient } from '@tanstack/react-query'
import { formatCurrency, formatDate } from '@/utils/formatCurrency'
import { FiPlusCircle, FiTool, FiTruck, FiMapPin, FiCheckCircle, FiHome, FiMap, FiMessageSquare, FiPhone, FiPackage } from 'react-icons/fi'
import styles from './OrdersBoard.module.css'

// Sólo los estados relevantes para el repartidor, en orden
const STAGES = [
  { status: 'pending',    label: 'Nuevos',     color: '#F59E0B', bg: '#FEF3C7', icon: <FiPlusCircle /> },
  { status: 'preparing',  label: 'Preparando', color: '#3B82F6', bg: '#DBEAFE', icon: <FiTool /> },
  { status: 'shipping',   label: 'Sale hoy',   color: '#7C3AED', bg: '#EDE9FE', icon: <FiTruck /> },
  { status: 'in_transit', label: 'En camino',  color: '#059669', bg: '#D1FAE5', icon: <FiMapPin /> },
  { status: 'delivered',  label: 'Entregado',  color: '#6B7280', bg: '#F3F4F6', icon: <FiCheckCircle /> },
]

const NEXT_STATUS = {
  pending: 'preparing',
  preparing: 'shipping',
  shipping: 'in_transit',
  in_transit: 'delivered',
}
const ACTION_LABEL = {
  pending:    '→ Preparar',
  preparing:  '→ Sale hoy',
  shipping:   '→ En camino',
  in_transit: '→ Entregado',
}

function OrderCard({ order, onAdvance, advancing }) {
  const [open, setOpen] = useState(false)
  const hasAddress = !order.is_pickup && order.shipping_address
  const addressLine = [
    order.shipping_address,
    order.shipping_floor,
    order.shipping_city,
  ].filter(Boolean).join(', ')

  return (
    <div className={`${styles.card} ${open ? styles.cardOpen : ''}`} onClick={() => setOpen(o => !o)}>
      {/* Top row */}
      <div className={styles.cardTop}>
        <div className={styles.cardId}>#{order.id.slice(0,8).toUpperCase()}</div>
        <div className={styles.cardDate}>{formatDate(order.created_at)}</div>
      </div>

      {/* Client name */}
      <div className={styles.cardName}>{order.shipping_name}</div>

      {/* Delivery type pill */}
      <div className={`${styles.deliveryBadge} ${order.is_pickup ? styles.pickup : styles.delivery}`}>
        {order.is_pickup 
          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FiHome /> Retiro Chascomús</span> 
          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FiTruck /> {order.shipping_city}</span>}
      </div>

      {/* Items summary */}
      <div className={styles.cardItems}>
        {order.items?.slice(0, 2).map(i => (
          <div key={i.id} className={styles.cardItem}>
            <span>{i.product_title || 'Producto'}</span>
            <span>×{i.quantity}</span>
          </div>
        ))}
        {order.items?.length > 2 && (
          <div className={styles.cardItemMore}>+{order.items.length - 2} más</div>
        )}
      </div>

      {/* Expanded detail */}
      {open && (
        <div className={styles.cardDetail} onClick={e => e.stopPropagation()}>
          {hasAddress && (
            <div className={styles.detailBlock}>
              <div className={styles.detailLabel}><FiMapPin /> Dirección de entrega</div>
              <div className={styles.detailAddress}>{addressLine}</div>
              {order.notes && (
                <div className={styles.detailNotes}><FiMessageSquare /> {order.notes}</div>
              )}
              <a
                className={styles.mapsBtn}
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}`}
                target="_blank"
                rel="noreferrer"
              >
                Abrir en Maps <FiMap />
              </a>
            </div>
          )}
          <div className={styles.detailBlock}>
            <div className={styles.detailLabel}><FiPhone /> Contacto</div>
            <a
              href={`https://wa.me/${order.shipping_phone?.replace(/\D/g,'')}`}
              target="_blank"
              rel="noreferrer"
              className={styles.waBtn}
            >
              WhatsApp — {order.shipping_phone}
            </a>
            <div className={styles.detailSub}>{order.guest_email || order.user_email}</div>
          </div>

          <div className={styles.detailBlock}>
            <div className={styles.detailLabel}><FiPackage /> Productos</div>
            {order.items?.map(i => (
              <div key={i.id} className={styles.detailItem}>
                <span>{i.product_title} <span className={styles.size}>Talle {i.product_size}</span></span>
                <span>×{i.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={styles.cardFooter} onClick={e => e.stopPropagation()}>
        <div className={styles.cardTotal}>{formatCurrency(order.total)}</div>
        {NEXT_STATUS[order.status] && (
          <button
            className={styles.advanceBtn}
            onClick={() => onAdvance(order)}
            disabled={advancing}
          >
            {ACTION_LABEL[order.status]}
          </button>
        )}
      </div>
    </div>
  )
}

export default function OrdersBoard() {
  const { data: orders = [], isLoading } = useDashboardOrders()
  const updateStatus = useUpdateOrderStatus()
  const queryClient = useQueryClient()
  const [activeStage, setActiveStage] = useState('pending')

  const handleAdvance = async (order) => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    await updateStatus.mutateAsync({ id: order.id, status: next })
    queryClient.invalidateQueries(['dashboard-orders'])
  }

  const byStatus = (status) => orders.filter(o => o.status === status)
  const visibleOrders = byStatus(activeStage)

  // Counts for tab badges
  const counts = Object.fromEntries(STAGES.map(s => [s.status, byStatus(s.status).length]))
  const activeStageObj = STAGES.find(s => s.status === activeStage)

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pedidos</h1>
          <p className={styles.subtitle}>{orders.length} activos · Tocá un pedido para ver el detalle</p>
        </div>
        <div className={styles.totalBadge}>{orders.length} total</div>
      </div>

      {/* Stage tabs — scrollable horizontally on mobile */}
      <div className={styles.tabs}>
        {STAGES.map(s => (
          <button
            key={s.status}
            className={`${styles.tab} ${activeStage === s.status ? styles.tabActive : ''}`}
            style={activeStage === s.status ? { background: s.color, color: '#fff', borderColor: s.color } : {}}
            onClick={() => setActiveStage(s.status)}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
            {counts[s.status] > 0 && (
              <span
                className={styles.tabCount}
                style={activeStage === s.status ? { background: 'rgba(255,255,255,0.25)', color: '#fff' } : { background: s.bg, color: s.color }}
              >
                {counts[s.status]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className={styles.loading}>Cargando pedidos...</div>
      ) : visibleOrders.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>{activeStageObj?.icon}</div>
          <div>Sin pedidos en "{activeStageObj?.label}"</div>
        </div>
      ) : (
        <div className={styles.list}>
          {visibleOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onAdvance={handleAdvance}
              advancing={updateStatus.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
