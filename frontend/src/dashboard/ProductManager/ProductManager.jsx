import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { productService } from '@/services/productService'
import { formatCurrency } from '@/utils/formatCurrency'
import styles from './ProductManager.module.css'

const CATEGORIES = [
  { value: 'aposito_incontinencia', label: 'Apósito Incontinencia' },
  { value: 'panal_recto', label: 'Pañal Recto' },
  { value: 'panal_elastizado', label: 'Pañal Elastizado' },
  { value: 'ropa_interior', label: 'Ropa Interior' },
  { value: 'accesorios', label: 'Accesorios' },
  { value: 'algodon', label: 'Algodón' },
  { value: 'otros', label: 'Otros' }
]

const SIZES = ['CH', 'MED', 'GDE', 'EX_GDE', 'EX_EX_GDE', 'P/M', 'G/EG', 'UNICO', 'T1', 'T2', 'T3', 'T4', '1_PLAZA', '2_PLAZAS']

export default function ProductManager() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const qc = useQueryClient()
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['dashboard-products'],
    queryFn: () => productService.dashboardList().then(r => r.data.results !== undefined ? r.data.results : r.data),
  })
  const createMut = useMutation({ mutationFn: productService.create, onSuccess: () => { qc.invalidateQueries(['dashboard-products']); setShowForm(false) } })
  const updateMut = useMutation({ mutationFn: ({ id, data }) => productService.update(id, data), onSuccess: () => { qc.invalidateQueries(['dashboard-products']); setEditing(null) } })
  const deleteMut = useMutation({ mutationFn: productService.delete, onSuccess: () => qc.invalidateQueries(['dashboard-products']) })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const onSubmit = (data) => {
    const formData = new FormData()
    if (data.sku) formData.append('sku', data.sku)
    formData.append('title', data.title)
    formData.append('slug', data.slug)
    formData.append('category', data.category || 'otros')
    formData.append('size', data.size)
    formData.append('price', parseFloat(data.price))
    if (data.compare_price) formData.append('compare_price', parseFloat(data.compare_price))
    formData.append('stock', parseInt(data.stock))
    formData.append('quantity', parseInt(data.quantity))
    if (data.units_per_box) formData.append('units_per_box', parseInt(data.units_per_box))
    if (data.weight_g) formData.append('weight_g', parseInt(data.weight_g))
    if (data.height_cm) formData.append('height_cm', parseFloat(data.height_cm))
    if (data.length_cm) formData.append('length_cm', parseFloat(data.length_cm))
    if (data.width_cm) formData.append('width_cm', parseFloat(data.width_cm))
    
    if (data.description) formData.append('description', data.description)
    if (data.image && data.image.length > 0) {
      formData.append('image', data.image[0])
    }

    if (editing) { updateMut.mutate({ id: editing.id, data: formData }) }
    else { createMut.mutate(formData) }
  }
  const startEdit = (p) => { 
    setEditing(p)
    const { image, ...rest } = p
    reset(rest)
    setShowForm(true) 
  }
  const cancelForm = () => { setShowForm(false); setEditing(null); reset({}) }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Productos</h1>
          <p className={styles.subtitle}>{products.length} productos configurados</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditing(null); reset({}) }}>
          + Nuevo producto
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.formGrid}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Nombre *</label>
                <input className={`form-input ${errors.title ? 'error' : ''}`} {...register('title', { required: true })} placeholder="Ej: Pack Mensual Talle M" />
              </div>
              <div className="form-group">
                <label className="form-label">SKU</label>
                <input className="form-input" {...register('sku')} placeholder="Código interno" />
              </div>
              <div className="form-group">
                <label className="form-label">Slug *</label>
                <input className="form-input" {...register('slug', { required: true })} placeholder="pack-mensual-m" />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría *</label>
                <select className="form-input" {...register('category', { required: true })}>
                  <option value="">Seleccionar</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Talle *</label>
                <select className="form-input" {...register('size', { required: true })}>
                  <option value="">Seleccionar</option>
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Precio *</label>
                <input className="form-input" type="number" step="0.01" {...register('price', { required: true })} placeholder="8900" />
              </div>
              <div className="form-group">
                <label className="form-label">Precio anterior</label>
                <input className="form-input" type="number" step="0.01" {...register('compare_price')} placeholder="10200" />
              </div>
              <div className="form-group">
                <label className="form-label">Stock *</label>
                <input className="form-input" type="number" {...register('stock', { required: true })} placeholder="100" />
              </div>
              <div className="form-group">
                <label className="form-label">Unidades por pack *</label>
                <input className="form-input" type="number" {...register('quantity', { required: true })} placeholder="60" />
              </div>
              <div className="form-group">
                <label className="form-label">Unidades por bulto</label>
                <input className="form-input" type="number" {...register('units_per_box')} placeholder="12" />
              </div>
              <div className="form-group">
                <label className="form-label">Peso (g)</label>
                <input className="form-input" type="number" {...register('weight_g')} placeholder="500" />
              </div>
              <div className="form-group">
                <label className="form-label">Alto (cm)</label>
                <input className="form-input" type="number" step="0.1" {...register('height_cm')} placeholder="25" />
              </div>
              <div className="form-group">
                <label className="form-label">Largo (cm)</label>
                <input className="form-input" type="number" step="0.1" {...register('length_cm')} placeholder="10" />
              </div>
              <div className="form-group">
                <label className="form-label">Ancho (cm)</label>
                <input className="form-input" type="number" step="0.1" {...register('width_cm')} placeholder="15" />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Imagen de portada</label>
                <input type="file" className="form-input" {...register('image')} accept="image/*" />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Descripción</label>
                <textarea className="form-input" {...register('description')} rows={3} placeholder="Describe el producto..." style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className="btn-ghost" onClick={cancelForm}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={createMut.isPending || updateMut.isPending}>
                {editing ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading && <div className={styles.loading}>Cargando...</div>}

      <div className={styles.table}>
        {products.map(p => (
          <div key={p.id} className={styles.row}>
            <div className={styles.rowImg}>🍃</div>
            <div className={styles.rowInfo}>
              <div className={styles.rowName}>{p.title}</div>
              <div className={styles.rowMeta}>Talle {p.size} · {p.quantity} unidades · Stock: {p.stock}</div>
            </div>
            <div className={styles.rowPrice}>{formatCurrency(p.price)}</div>
            <div className={styles.rowActive}>
              <div className={`${styles.badge} ${p.is_active ? styles.badgeOn : styles.badgeOff}`}>
                {p.is_active ? 'Activo' : 'Inactivo'}
              </div>
            </div>
            <div className={styles.rowActions}>
              <button className="btn-ghost" onClick={() => startEdit(p)}>Editar</button>
              <button className={styles.deleteBtn} onClick={() => { if (window.confirm('¿Desactivar este producto?')) deleteMut.mutate(p.id) }}>Desactivar</button>
            </div>
          </div>
        ))}
        {!isLoading && products.length === 0 && (
          <div className={styles.empty}>No hay productos. Creá el primero.</div>
        )}
      </div>
    </div>
  )
}
