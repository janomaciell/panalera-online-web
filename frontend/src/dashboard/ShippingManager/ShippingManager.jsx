import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { shippingService } from '@/services/shippingService'
import { formatCurrency } from '@/utils/formatCurrency'
import styles from './ShippingManager.module.css'

export default function ShippingManager() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const qc = useQueryClient()

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['all-zones'],
    queryFn: () => shippingService.allZones().then(r => r.data.results !== undefined ? r.data.results : r.data),
  })
  const createMut = useMutation({
    mutationFn: shippingService.createZone,
    onSuccess: () => { qc.invalidateQueries(['all-zones']); cancelForm() },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => shippingService.updateZone(id, data),
    onSuccess: () => { qc.invalidateQueries(['all-zones']); cancelForm() },
  })
  const deleteMut = useMutation({
    mutationFn: shippingService.deleteZone,
    onSuccess: () => qc.invalidateQueries(['all-zones']),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const onSubmit = (data) => {
    const payload = {
      ...data,
      shipping_price: parseFloat(data.shipping_price),
      estimated_days: parseInt(data.estimated_days),
      postal_codes: data.postal_codes
        ? data.postal_codes.split(',').map(s => s.trim()).filter(Boolean)
        : [],
    }
    if (editing) updateMut.mutate({ id: editing.id, data: payload })
    else createMut.mutate(payload)
  }

  const startEdit = (z) => {
    setEditing(z)
    reset({ ...z, postal_codes: z.postal_codes?.join(', ') || '' })
    setShowForm(true)
  }

  const cancelForm = () => { setShowForm(false); setEditing(null); reset({}) }

  const toggleActive = (z) => {
    updateMut.mutate({ id: z.id, data: { is_active: !z.is_active } })
  }

  const ZONE_GROUPS = [
    { label: 'Zona 1 — $4.000', cities: ['Santa Teresita', 'Mar de Ajó', 'San Bernardo', 'La Lucila del Mar', 'Costa Azul', 'Aguas Verdes'] },
    { label: 'Zona 2 — $5.000', cities: ['Pinamar', 'Ostende', 'Valeria del Mar'] },
    { label: 'Zona 3 — $6.000', cities: ['Cariló'] },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Zonas de envío</h1>
          <p className={styles.subtitle}>{zones.length} zonas configuradas</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditing(null); reset({}) }}>
          + Nueva zona
        </button>
      </div>

      {/* Reference card */}
      <div className={styles.refCard}>
        <div className={styles.refTitle}>📋 Estructura de zonas actual</div>
        <div className={styles.refGrid}>
          {ZONE_GROUPS.map(g => (
            <div key={g.label} className={styles.refGroup}>
              <div className={styles.refGroupLabel}>{g.label}</div>
              <div className={styles.refCities}>{g.cities.join(' · ')}</div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>{editing ? 'Editar zona' : 'Nueva zona de envío'}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label">Ciudad *</label>
                <input
                  className={`form-input ${errors.city_name ? 'error' : ''}`}
                  {...register('city_name', { required: 'Requerido' })}
                  placeholder="Ej: Pinamar"
                />
                {errors.city_name && <span className="form-error">{errors.city_name.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Precio de envío (ARS) *</label>
                <input
                  className={`form-input ${errors.shipping_price ? 'error' : ''}`}
                  type="number" step="100"
                  {...register('shipping_price', { required: 'Requerido', min: 0 })}
                  placeholder="5000"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Días estimados de entrega</label>
                <input
                  className="form-input"
                  type="number"
                  {...register('estimated_days')}
                  placeholder="15"
                  defaultValue={15}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Códigos postales</label>
                <input
                  className="form-input"
                  {...register('postal_codes')}
                  placeholder="7167, 7168 (separados por coma)"
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className="btn-ghost" onClick={cancelForm}>Cancelar</button>
              <button
                type="submit"
                className="btn-primary"
                disabled={createMut.isPending || updateMut.isPending}
              >
                {editing ? 'Guardar cambios' : 'Crear zona'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading && <div className={styles.loading}>Cargando zonas...</div>}

      <div className={styles.table}>
        {zones.map(z => (
          <div key={z.id} className={`${styles.row} ${!z.is_active ? styles.rowInactive : ''}`}>
            <div className={styles.rowInfo}>
              <div className={styles.rowCity}>{z.city_name}</div>
              <div className={styles.rowMeta}>
                {z.postal_codes?.length > 0 && `CP: ${z.postal_codes.join(', ')} · `}
                {z.estimated_days} días estimados
              </div>
            </div>
            <div className={styles.rowPrice}>{formatCurrency(z.shipping_price)}</div>
            <div>
              <button
                className={`${styles.toggleBtn} ${z.is_active ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => toggleActive(z)}
                disabled={updateMut.isPending}
              >
                {z.is_active ? '● Activa' : '○ Inactiva'}
              </button>
            </div>
            <div className={styles.rowActions}>
              <button className="btn-ghost" onClick={() => startEdit(z)}>Editar</button>
              <button
                className={styles.deleteBtn}
                onClick={() => { if (window.confirm(`¿Eliminar ${z.city_name}?`)) deleteMut.mutate(z.id) }}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {!isLoading && zones.length === 0 && (
          <div className={styles.empty}>
            No hay zonas configuradas. Creá la primera zona de envío.
          </div>
        )}
      </div>
    </div>
  )
}
