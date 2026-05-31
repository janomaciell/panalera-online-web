import { useState, useEffect } from 'react'
import { useShippingZones, useCalculateShipping } from '@/hooks/useShipping'
import { formatCurrency } from '@/utils/formatCurrency'
import { FiTruck, FiHome, FiAlertTriangle, FiMapPin } from 'react-icons/fi'
import styles from './ShippingSelector.module.css'

export default function ShippingSelector({ onSelect }) {
  const [method, setMethod] = useState('delivery') // 'delivery' | 'pickup'
  const [selectedCity, setSelectedCity] = useState('')
  const { data: zones = [], isLoading } = useShippingZones()
  const calculate = useCalculateShipping()

  const handleMethodChange = (m) => {
    setMethod(m)
    if (m === 'pickup') {
      onSelect({ method: 'pickup', shipping_price: 0, city: 'Chascomús', zone: null })
    } else {
      onSelect(null)
      setSelectedCity('')
    }
  }

  const handleCityChange = (e) => {
    const city = e.target.value
    setSelectedCity(city)
    if (!city) { onSelect(null); return }
    const zone = zones.find(z => z.city_name === city)
    if (zone) {
      onSelect({ method: 'delivery', shipping_price: zone.shipping_price, city, zone })
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.methods}>
        <button
          type="button"
          className={`${styles.methodBtn} ${method === 'delivery' ? styles.active : ''}`}
          onClick={() => handleMethodChange('delivery')}
        >
          <div className={styles.methodIcon}><FiTruck /></div>
          <div>
            <div className={styles.methodTitle}>Envío a domicilio</div>
            <div className={styles.methodSub}>El 1° o el 15 de cada mes</div>
          </div>
          <div className={styles.radio}>{method === 'delivery' && <div className={styles.radioDot}></div>}</div>
        </button>

        <button
          type="button"
          className={`${styles.methodBtn} ${method === 'pickup' ? styles.active : ''}`}
          onClick={() => handleMethodChange('pickup')}
        >
          <div className={styles.methodIcon}><FiHome /></div>
          <div>
            <div className={styles.methodTitle}>Retiro en Chascomús</div>
            <div className={styles.methodSub}>Coordinás día y horario — Sin costo</div>
          </div>
          <div className={styles.radio}>{method === 'pickup' && <div className={styles.radioDot}></div>}</div>
        </button>
      </div>

      {method === 'delivery' && (
        <div className={styles.citySelector}>
          <label className={styles.label} htmlFor="city-select">Seleccioná tu ciudad</label>
          {isLoading ? (
            <div className={`skeleton ${styles.skeleton}`}></div>
          ) : (
            <select
              id="city-select"
              className={styles.select}
              value={selectedCity}
              onChange={handleCityChange}
            >
              <option value="">-- Elegí tu ciudad --</option>
              {zones.map(z => (
                <option key={z.id} value={z.city_name}>
                  {z.city_name} — {formatCurrency(z.shipping_price)}
                </option>
              ))}
            </select>
          )}
          {!isLoading && zones.length === 0 && (
            <p className={styles.noZones}><FiAlertTriangle style={{ marginRight: '6px' }} /> No hay zonas de envío disponibles en este momento.</p>
          )}
        </div>
      )}

      {method === 'pickup' && (
        <div className={styles.pickupInfo}>
          <span className={styles.pickupIcon}><FiMapPin /></span>
          <div>
            <div className={styles.pickupTitle}>Tu pedido estará listo para retirar en Chascomús</div>
            <div className={styles.pickupSub}>Te avisamos por email cuando esté disponible</div>
          </div>
        </div>
      )}
    </div>
  )
}
