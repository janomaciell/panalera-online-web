import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar/Navbar'
import CheckoutSteps from '@/components/CheckoutSteps/CheckoutSteps'
import ShippingSelector from '@/components/ShippingSelector/ShippingSelector'
import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCreateOrder } from '@/hooks/useOrders'
import { useNextCycle } from '@/hooks/useShipping'
import { crmService } from '@/services/crmService'
import { shippingService } from '@/services/shippingService'
import { formatCurrency, formatShortDate } from '@/utils/formatCurrency'
import {
  FiShoppingCart, FiPackage, FiCreditCard, FiBriefcase,
  FiDollarSign, FiTag, FiCheck, FiX, FiAlertTriangle,
} from 'react-icons/fi'
import styles from './Checkout.module.css'

const RECIPIENT_TYPES = [
  { value: 'particular',  label: 'Particular',            icon: '🏠' },
  { value: 'residencia',  label: 'Residencia geriátrica', icon: '🏥' },
  { value: 'institucion', label: 'Institución / Clínica',  icon: '🏢' },
]

export default function Checkout() {
  const [step, setStep] = useState(1)
  const [shipping, setShipping] = useState(null)
  const [recipientType, setRecipientType] = useState('particular')

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponState, setCouponState] = useState(null) // { valid, discount_amount, description, error }
  const [couponLoading, setCouponLoading] = useState(false)

  const { items, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const createOrder = useCreateOrder()
  const { data: cycle } = useNextCycle()
  const navigate = useNavigate()

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const discount = couponState?.valid ? Number(couponState.discount_amount || 0) : 0
  const shippingCost = Number(shipping?.shipping_price || 0)
  const total = subtotal - discount + shippingCost

  const isShippingValid =
    shipping &&
    (shipping.method === 'pickup' ||
     shipping.method === 'delivery' ||
     (shipping.method === 'andreani' && shipping.shipping_price > 0 && !quoteLoading))

  const { register, handleSubmit, getValues, watch, setValue, trigger, formState: { errors } } = useForm({
    defaultValues: {
      name:  user?.name  || '',
      email: user?.email || '',
      phone: user?.phone || '',
      // pre-fill saved address
      street:       user?.saved_address?.split(' ').slice(0, -1).join(' ') || '',
      postal_code:  user?.saved_postal  || '',
    },
  })

  const postalCode = watch('postal_code')
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState(null)

  useEffect(() => {
    if (shipping?.method !== 'andreani') {
      setQuoteError(null)
      return
    }

    if (!postalCode || postalCode.length !== 4) {
      if (shipping.shipping_price !== 0) {
        setShipping(prev => ({ ...prev, shipping_price: 0, needs_quote: true }))
      }
      return
    }

    const fetchQuote = async () => {
      setQuoteLoading(true)
      setQuoteError(null)
      try {
        const totalWeightG = items.reduce((sum, item) => sum + (item.weight_g || 500) * item.quantity, 0)
        const quote = await shippingService.andreaniQuote({
          postalCode,
          weightG: totalWeightG,
          value: subtotal,
        })
        if (quote.available === false && quote.cost === 0) {
          setQuoteError('El servicio de Andreani no está disponible temporalmente o no llega a este código postal.')
          setShipping(prev => ({ ...prev, shipping_price: 0, needs_quote: true }))
        } else {
          setShipping(prev => ({
            ...prev,
            shipping_price: Number(quote.cost),
            postal_code: postalCode,
            estimated_days: quote.estimated_days,
            service: quote.service,
            needs_quote: false,
          }))
        }
      } catch (err) {
        setQuoteError('Error al calcular el costo de envío con Andreani. Intentá de nuevo.')
        setShipping(prev => ({ ...prev, shipping_price: 0, needs_quote: true }))
      } finally {
        setQuoteLoading(false)
      }
    }

    fetchQuote()
  }, [shipping?.method, postalCode, items, subtotal])

  const onStep1 = () => setStep(2)
  const onStep2 = () => {
    if (!shipping) { alert('Seleccioná un método de entrega'); return }
    setStep(3)
  }

  const handleCouponValidate = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      const res = await crmService.validateCoupon(couponCode.trim().toUpperCase(), subtotal)
      setCouponState({ valid: true, ...res.data })
    } catch (err) {
      setCouponState({ valid: false, error: err.response?.data?.error || 'Cupón inválido.' })
    } finally {
      setCouponLoading(false)
    }
  }

  const handleCouponRemove = () => {
    setCouponCode('')
    setCouponState(null)
  }

  const onPay = async () => {
    const formData = getValues()
    const isPickup = shipping?.method === 'pickup'

    const orderData = {
      items: items.map(i => ({ product: i.id, quantity: i.quantity })),
      shipping_name:    formData.name,
      shipping_address: isPickup ? '' : `${formData.street} ${formData.street_number || ''}`.trim(),
      shipping_floor:   isPickup ? '' : (formData.floor || ''),
      shipping_city:    isPickup ? 'Chascomús' : (shipping.city || formData.city || ''),
      shipping_province: formData.province || '',
      shipping_postal:  formData.postal_code || '',
      guest_email:      formData.email,
      guest_phone:      formData.phone,
      shipping_phone:   formData.phone,
      shipping_price:   shipping.shipping_price,
      is_pickup:        isPickup,
      notes:            formData.notes || '',
      recipient_type:   recipientType,
      institution_name: formData.institution_name || '',
      room_number:      formData.room_number || '',
      preferred_slot:   formData.preferred_slot || '',
      coupon_code:      couponState?.valid ? couponCode.trim().toUpperCase() : '',
    }

    try {
      const order = await createOrder.mutateAsync(orderData)

      // El backend ya resuelve la URL correcta según sandbox/producción
      if (order.mp_init_point) {
        clearCart()
        window.location.href = order.mp_init_point
        return
      }
      if (order.mp_error === 'mp_not_configured') {
        clearCart()
        navigate('/checkout/exito')
        return
      }
      if (order.mp_error) {
        alert(`Error al conectar con MercadoPago: ${order.mp_error}\nContactate con la tienda para completar el pago.`)
        return
      }
      clearCart()
      navigate('/checkout/exito')
    } catch {
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
                <FiPackage style={{ marginRight: '6px' }} />
                Tu pedido sale el <strong>{cycle.ship_date_display || formatShortDate(cycle.ship_date)}</strong>
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
                        {...register('name', { required: 'Campo requerido' })}
                        placeholder="Ej: María González" />
                      {errors.name && <span className="form-error">{errors.name.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input className={`form-input ${errors.email ? 'error' : ''}`} type="email"
                        {...register('email', {
                          required: 'Campo requerido',
                          pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' },
                        })}
                        placeholder="tu@email.com" />
                      {errors.email && <span className="form-error">{errors.email.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teléfono / WhatsApp *</label>
                      <input className={`form-input ${errors.phone ? 'error' : ''}`}
                        {...register('phone', { required: 'Campo requerido' })}
                        placeholder="Ej: 2241 555-888" />
                      {errors.phone && <span className="form-error">{errors.phone.message}</span>}
                    </div>
                  </div>

                  {/* Recipient type */}
                  <div style={{ marginTop: 20 }}>
                    <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>
                      Tipo de destinatario
                    </label>
                    <div className={styles.recipientGrid}>
                      {RECIPIENT_TYPES.map(rt => (
                        <button
                          key={rt.value}
                          type="button"
                          className={`${styles.recipientBtn} ${recipientType === rt.value ? styles.recipientBtnActive : ''}`}
                          onClick={() => setRecipientType(rt.value)}
                        >
                          <span>{rt.icon}</span>
                          <span>{rt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Institution extras */}
                  {(recipientType === 'residencia' || recipientType === 'institucion') && (
                    <div className={styles.formGrid} style={{ marginTop: 16 }}>
                      <div className="form-group" style={{ gridColumn: '1/-1' }}>
                        <label className="form-label">Nombre de la institución *</label>
                        <input className="form-input"
                          {...register('institution_name', { required: 'Campo requerido para institución' })}
                          placeholder="Ej: Hogar San José" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">N° de habitación / internado</label>
                        <input className="form-input"
                          {...register('room_number')}
                          placeholder="Ej: 204" />
                      </div>
                    </div>
                  )}

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

                  {(shipping?.method === 'delivery' || shipping?.method === 'andreani') && (
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
                          <input className="form-input" {...register('floor')} placeholder="Ej: 3° B" />
                        </div>
                        {shipping?.method === 'andreani' && (
                          <div className="form-group" style={{ gridColumn: '1/-1' }}>
                            <label className="form-label">Localidad / Ciudad *</label>
                            <input
                              className={`form-input ${errors.city ? 'error' : ''}`}
                              {...register('city', { required: shipping?.method === 'andreani' ? 'Requerido' : false })}
                              placeholder="Ej: La Plata" />
                            {errors.city && <span className="form-error">{errors.city.message}</span>}
                          </div>
                        )}
                        <div className="form-group">
                          <label className="form-label">
                            Provincia {shipping?.method === 'andreani' ? '*' : <span style={{ fontWeight: 400, color: 'var(--gray-text)' }}>(opcional)</span>}
                          </label>
                          <input
                            className={`form-input ${errors.province ? 'error' : ''}`}
                            {...register('province', { required: shipping?.method === 'andreani' ? 'Requerido' : false })}
                            placeholder="Ej: Buenos Aires" />
                          {errors.province && <span className="form-error">{errors.province.message}</span>}
                        </div>
                        <div className="form-group">
                          <label className="form-label">
                            Código postal {shipping?.method === 'andreani' ? '*' : <span style={{ fontWeight: 400, color: 'var(--gray-text)' }}>(opcional)</span>}
                          </label>
                          <input className={`form-input ${errors.postal_code ? 'error' : ''}`}
                            {...register('postal_code', {
                              required: shipping?.method === 'andreani' ? 'Requerido' : false,
                              pattern: { value: /^\d{4}$/, message: 'Ingresá 4 dígitos' },
                            })}
                            placeholder="Ej: 7167" maxLength={4} />
                          {errors.postal_code && <span className="form-error">{errors.postal_code.message}</span>}
                        </div>
                        {shipping?.method === 'delivery' && (
                          <div className="form-group">
                            <label className="form-label">Franja horaria preferida</label>
                            <select className="form-input" {...register('preferred_slot')}>
                              <option value="">Sin preferencia</option>
                              <option value="manana">Mañana (8–12 hs)</option>
                              <option value="tarde">Tarde (12–18 hs)</option>
                            </select>
                          </div>
                        )}
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                          <label className="form-label">
                            Indicaciones adicionales <span style={{ fontWeight: 400, color: 'var(--gray-text)' }}>(opcional)</span>
                          </label>
                          <textarea className="form-input" {...register('notes')} rows={2}
                            placeholder="Ej: Timbre 5, casa de rejas verdes..." style={{ resize: 'vertical' }} />
                        </div>

                        {quoteLoading && (
                          <div className={styles.quoteStatus}>
                            <span>🔄</span> Cotizando envío con Andreani...
                          </div>
                        )}
                        {quoteError && (
                          <div className={styles.quoteError}>
                            ⚠️ {quoteError}
                          </div>
                        )}
                        {shipping?.method === 'andreani' && shipping?.shipping_price > 0 && !quoteLoading && (
                          <div className={styles.quoteSuccess}>
                            🚚 Envío cotizado con Andreani: <strong>{formatCurrency(shipping.shipping_price)}</strong> (Llega en aprox. {shipping.estimated_days} días hábiles)
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className={styles.stepNav}>
                    <button type="button" className="btn-ghost" onClick={() => setStep(1)}>← Atrás</button>
                    <button type="submit" className="btn-primary" disabled={!isShippingValid}>
                      {quoteLoading ? 'Cotizando...' : 'Continuar al pago →'}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3 — Pago */}
              {step === 3 && (
                <div className={styles.formCard}>
                  <h2 className={styles.stepTitle}>Pago</h2>

                  {/* Banner sandbox */}
                  {import.meta.env.VITE_MP_SANDBOX_MODE === 'true' && (
                    <div className={styles.sandboxBanner}>
                      <FiAlertTriangle size={16} />
                      <strong>Modo Sandbox (prueba)</strong> — Usá tarjetas de prueba de MercadoPago. No se realizá ningún cobro real.
                    </div>
                  )}

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

                  {/* Coupon field */}
                  <div className={styles.couponSection}>
                    <div className={styles.couponLabel}>
                      <FiTag size={14} /> Cupón de descuento
                    </div>
                    {couponState?.valid ? (
                      <div className={styles.couponApplied}>
                        <FiCheck size={16} style={{ color: 'var(--success, #2D7A4F)' }} />
                        <span>
                          <strong>{couponCode.toUpperCase()}</strong> — {couponState.description || `Descuento aplicado`}
                          {' '}(-{formatCurrency(discount)})
                        </span>
                        <button type="button" className={styles.couponRemove} onClick={handleCouponRemove}>
                          <FiX size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className={styles.couponRow}>
                        <input
                          className={`form-input ${couponState?.valid === false ? 'error' : ''}`}
                          placeholder="Ingresá tu código"
                          value={couponCode}
                          onChange={e => { setCouponCode(e.target.value); setCouponState(null) }}
                          onKeyDown={e => e.key === 'Enter' && handleCouponValidate()}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={handleCouponValidate}
                          disabled={couponLoading || !couponCode.trim()}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {couponLoading ? '…' : 'Aplicar'}
                        </button>
                      </div>
                    )}
                    {couponState?.valid === false && (
                      <p className="form-error" style={{ marginTop: 4 }}>{couponState.error}</p>
                    )}
                  </div>

                  <div className={styles.secureNote}>🔒 Pago 100% seguro procesado por MercadoPago</div>
                  <div className={styles.stepNav}>
                    <button type="button" className="btn-ghost" onClick={() => setStep(2)}>← Atrás</button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={onPay}
                      disabled={createOrder.isPending}
                    >
                      {createOrder.isPending ? 'Procesando...' : `Pagar ${formatCurrency(total)}`}
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
                <div className={styles.summaryDivider} />
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className={styles.summaryRow} style={{ color: 'var(--success, #2D7A4F)' }}>
                    <span>Descuento ({couponCode.toUpperCase()})</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className={styles.summaryRow}>
                  <span>Envío</span>
                  <span>
                    {shipping === null ? '—' :
                      shippingCost === 0
                        ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>Sin costo</span>
                        : formatCurrency(shippingCost)}
                  </span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
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
