import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar/Navbar'
import CheckoutSteps from '@/components/CheckoutSteps/CheckoutSteps'
import ShippingSelector from '@/components/ShippingSelector/ShippingSelector'
import { useCartStore } from '@/store/useCartStore'
import { useCreateOrder } from '@/hooks/useOrders'
import { useNextCycle } from '@/hooks/useShipping'
import { formatCurrency, formatShortDate } from '@/utils/formatCurrency'
import { FiShoppingCart, FiPackage, FiCreditCard, FiBriefcase, FiDollarSign } from 'react-icons/fi'
import styles from './Checkout.module.css'

export default function Checkout() {
  const [step, setStep] = useState(1)
  const [shipping, setShipping] = useState(null)
  const { items, clearCart } = useCartStore()
  const createOrder = useCreateOrder()
  const { data: cycle } = useNextCycle()
  const navigate = useNavigate()
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  const { register, handleSubmit, getValues, formState: { errors } } = useForm()

  const onStep1 = () => setStep(2)

  const onStep2 = () => {
    if (!shipping) { alert('Seleccioná un método de entrega'); return }
    setStep(3)
  }

  const onPay = async () => {
    const formData = getValues()
    const isPickup = shipping?.method === 'pickup'
    const orderData = {
      items: items.map(i => ({ product: i.id, quantity: i.quantity, price: i.price })),
      shipping_name:    formData.name,
      shipping_address: isPickup ? '' : `${formData.street} ${formData.street_number}`,
      shipping_floor:   isPickup ? '' : (formData.floor || ''),
      shipping_city:    isPickup ? 'Chascomús' : shipping.city,
      shipping_postal:  formData.postal_code || '',
      guest_email:      formData.email,
      guest_phone:      formData.phone,
      shipping_phone:   formData.phone,
      shipping_price:   shipping.shipping_price,
      is_pickup:        isPickup,
      notes:            formData.notes || '',
    }
    try {
      const order = await createOrder.mutateAsync(orderData)

      // MP Checkout Pro — redirect to payment gateway
      if (order.mp_init_point) {
        window.location.href = order.mp_init_point
        return
      }

      // MP sandbox mode
      if (order.mp_sandbox_point && !order.mp_init_point) {
        window.location.href = order.mp_sandbox_point
        return
      }

      // MP not configured (dev mode) — go directly to success
      if (order.mp_error === 'mp_not_configured') {
        clearCart()
        navigate('/checkout/exito')
        return
      }

      // Real MP error
      if (order.mp_error) {
        alert(`Error al conectar con MercadoPago: ${order.mp_error}\nContactate con la tienda para completar el pago.`)
        return
      }

      // Fallback
      clearCart()
      navigate('/checkout/exito')
    } catch (e) {
      alert('Hubo un error al procesar tu pedido. Intentá de nuevo.')
    }
  }

  if (items.length === 0) {
    return (
      <div>
        <Navbar />
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FiShoppingCart /></div>
          <h2>Tu carrito está vacío</h2>
          <p>Agregá algunos productos para continuar</p>
          <a href="/#productos" className="btn-primary" style={{ marginTop: 24 }}>Ver productos</a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>Finalizar compra</h1>
            {cycle && (
              <div className={styles.cycleBadge}>
                <FiPackage style={{ marginRight: '6px' }} /> Tu pedido sale el <strong>{cycle.ship_date_display || formatShortDate(cycle.ship_date)}</strong>
              </div>
            )}
          </div>

          <CheckoutSteps current={step} />

          <div className={styles.layout}>
            {/* Form column */}
            <div className={styles.formCol}>

              {/* STEP 1 — Datos personales */}
              {step === 1 && (
                <form onSubmit={handleSubmit(onStep1)} className={styles.formCard}>
                  <h2 className={styles.stepTitle}>Tus datos</h2>
                  <div className={styles.formGrid}>
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Nombre completo *</label>
                      <input className={`form-input ${errors.name ? 'error' : ''}`}
                        {...register('name', { required: 'Campo requerido' })} placeholder="Ej: María González" />
                      {errors.name && <span className="form-error">{errors.name.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input className={`form-input ${errors.email ? 'error' : ''}`} type="email"
                        {...register('email', { required: 'Campo requerido', pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' } })} placeholder="tu@email.com" />
                      {errors.email && <span className="form-error">{errors.email.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teléfono / WhatsApp *</label>
                      <input className={`form-input ${errors.phone ? 'error' : ''}`}
                        {...register('phone', { required: 'Campo requerido' })} placeholder="Ej: 2241 555-888" />
                      {errors.phone && <span className="form-error">{errors.phone.message}</span>}
                    </div>
                  </div>
                  <button type="submit" className={`btn-primary ${styles.nextBtn}`}>
                    Continuar a entrega
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </form>
              )}

              {/* STEP 2 — Método + dirección */}
              {step === 2 && (
                <form onSubmit={handleSubmit(onStep2)} className={styles.formCard}>
                  <h2 className={styles.stepTitle}>Método de entrega</h2>
                  <ShippingSelector onSelect={setShipping} />

                  {shipping?.method === 'delivery' && (
                    <div className={styles.addressSection}>
                      <div className={styles.addressTitle}>📍 Dirección de entrega</div>
                      <div className={styles.formGrid}>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                          <label className="form-label">Calle *</label>
                          <input
                            className={`form-input ${errors.street ? 'error' : ''}`}
                            {...register('street', { required: 'Requerido' })}
                            placeholder="Ej: Av. Costanera" />
                          {errors.street && <span className="form-error">{errors.street.message}</span>}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Número *</label>
                          <input
                            className={`form-input ${errors.street_number ? 'error' : ''}`}
                            {...register('street_number', { required: 'Requerido' })}
                            placeholder="Ej: 1234" />
                          {errors.street_number && <span className="form-error">{errors.street_number.message}</span>}
                        </div>
                        <div className="form-group">
                          <label className="form-label">
                            Piso / Depto <span style={{ fontWeight: 400, color: 'var(--gray-text)' }}>(opcional)</span>
                          </label>
                          <input className="form-input" {...register('floor')} placeholder="Ej: 3° B / Casa del fondo" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Código postal</label>
                          <input className="form-input" {...register('postal_code')} placeholder="Ej: 7167" />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                          <label className="form-label">
                            Indicaciones adicionales <span style={{ fontWeight: 400, color: 'var(--gray-text)' }}>(opcional)</span>
                          </label>
                          <textarea className="form-input" {...register('notes')} rows={2}
                            placeholder="Ej: Timbre 5, casa de rejas verdes, portón azul..." style={{ resize: 'vertical' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={styles.stepNav}>
                    <button type="button" className="btn-ghost" onClick={() => setStep(1)}>← Atrás</button>
                    <button type="submit" className="btn-primary" disabled={!shipping}>
                      Continuar al pago →
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3 — Pago */}
              {step === 3 && (
                <div className={styles.formCard}>
                  <h2 className={styles.stepTitle}>Pago</h2>
                  <p className={styles.payDesc}>Serás redirigido a MercadoPago para completar el pago de forma segura.</p>
                  <div className={styles.payMethods}>
                    {[
                      { icon: <FiCreditCard />, label: 'Tarjeta de crédito / débito' },
                      { icon: <FiBriefcase />, label: 'Transferencia bancaria' },
                      { icon: <FiDollarSign />, label: 'Dinero en cuenta MercadoPago' },
                    ].map(m => (
                      <div key={m.label} className={styles.payMethod}>
                        <span>{m.icon}</span><span>{m.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.secureNote}>🔒 Pago 100% seguro procesado por MercadoPago</div>
                  <div className={styles.stepNav}>
                    <button type="button" className="btn-ghost" onClick={() => setStep(2)}>← Atrás</button>
                    <button type="button" className="btn-primary" onClick={onPay} disabled={createOrder.isPending}>
                      {createOrder.isPending ? 'Procesando...' : `Pagar ${formatCurrency(subtotal + Number(shipping?.shipping_price || 0))}`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Summary column */}
            <div className={styles.summaryCol}>
              <div className={styles.summaryCard}>
                <h3 className={styles.summaryTitle}>Resumen del pedido</h3>
                <div className={styles.summaryItems}>
                  {items.map(item => (
                    <div key={item.id} className={styles.summaryItem}>
                      <div className={styles.summaryItemInfo}>
                        <div className={styles.summaryItemName}>{item.title}</div>
                        <div className={styles.summaryItemQty}>x{item.quantity}</div>
                      </div>
                      <div className={styles.summaryItemPrice}>{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
                <div className={styles.summaryDivider}></div>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Envío</span>
                  <span>
                    {shipping === null ? '—' :
                      Number(shipping.shipping_price) === 0
                        ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>Sin costo</span>
                        : formatCurrency(shipping.shipping_price)}
                  </span>
                </div>
                <div className={styles.summaryDivider}></div>
                <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                  <span>Total</span>
                  <span>{formatCurrency(subtotal + Number(shipping?.shipping_price || 0))}</span>
                </div>
                {cycle && (
                  <div className={styles.cycleInfo}>
                    <span><FiPackage /></span>
                    <span>Salida estimada: <strong>{cycle.ship_date_display || formatShortDate(cycle.ship_date)}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
