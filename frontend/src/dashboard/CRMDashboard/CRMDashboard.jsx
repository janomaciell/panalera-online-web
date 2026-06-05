import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { formatCurrency } from '@/utils/formatCurrency'
import { FiUsers, FiRepeat, FiTag, FiTrendingUp, FiLoader } from 'react-icons/fi'
import styles from './CRMDashboard.module.css'

function useSegments() {
  return useQuery({
    queryKey: ['crm-segments'],
    queryFn: () => api.get('/dashboard/crm/segments/').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })
}

function useReminders() {
  return useQuery({
    queryKey: ['crm-reminders'],
    queryFn: () => api.get('/dashboard/crm/reminders/', { params: { status: 'pending' } }).then(r => r.data),
    staleTime: 1000 * 60 * 2,
  })
}

const SEGMENT_LABELS = {
  vip:        { label: 'VIP (5+ pedidos)',   icon: '⭐', color: '#F59E0B' },
  recurrente: { label: 'Recurrentes (2-4)',   icon: '🔄', color: '#3B82F6' },
  nuevo:      { label: 'Nuevos (1 pedido)',   icon: '🆕', color: '#10B981' },
  inactivo:   { label: 'Inactivos (+60 días)',icon: '💤', color: '#6B7280' },
  sin_compra: { label: 'Sin compras',         icon: '👤', color: '#9CA3AF' },
  institucion: { label: 'Instituciones',      icon: '🏥', color: '#8B5CF6' },
}

export default function CRMDashboard() {
  const { data: segments, isLoading: segmentsLoading } = useSegments()
  const { data: reminders = [], isLoading: remindersLoading } = useReminders()

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>CRM & Predicción de Recompra</h1>

      {/* Segments */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Segmentación de clientes</h2>
        {segmentsLoading ? (
          <div className={styles.loading}><FiLoader className={styles.spin} /> Cargando...</div>
        ) : segments ? (
          <div className={styles.segments}>
            {Object.entries(SEGMENT_LABELS).map(([key, cfg]) => (
              <div key={key} className={styles.segCard}>
                <div className={styles.segIcon}>{cfg.icon}</div>
                <div className={styles.segValue} style={{ color: cfg.color }}>
                  {segments[key] ?? '—'}
                </div>
                <div className={styles.segLabel}>{cfg.label}</div>
              </div>
            ))}
            <div className={styles.segCard} style={{ gridColumn: '1/-1', background: '#f9fafb' }}>
              <div className={styles.segIcon}>👥</div>
              <div className={styles.segValue}>{segments.total ?? '—'}</div>
              <div className={styles.segLabel}>Total de usuarios</div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Pending reminders */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Recordatorios pendientes
          {reminders.length > 0 && (
            <span className={styles.badge}>{reminders.length}</span>
          )}
        </h2>
        {remindersLoading ? (
          <div className={styles.loading}><FiLoader className={styles.spin} /> Cargando...</div>
        ) : reminders.length === 0 ? (
          <div className={styles.empty}>✅ No hay recordatorios pendientes.</div>
        ) : (
          <div className={styles.reminderTable}>
            <div className={styles.reminderHeader}>
              <span>Usuario</span>
              <span>Producto</span>
              <span>Tipo</span>
              <span>Fecha programada</span>
              <span>Estado</span>
            </div>
            {reminders.map(r => (
              <div key={r.id} className={styles.reminderRow}>
                <span>{r.user}</span>
                <span>{r.product_title}</span>
                <span className={styles.reminderType}>{r.type}</span>
                <span>{new Date(r.scheduled_for).toLocaleDateString('es-AR')}</span>
                <span className={`${styles.statusPill} ${styles[r.status]}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
