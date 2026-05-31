import { FiPackage, FiMapPin, FiHome, FiCreditCard, FiCalendar } from 'react-icons/fi'
import { useNextCycle } from '@/hooks/useShipping'
import { getNextTwoCycles, formatCycleDate } from '@/utils/shippingCycles'
import styles from './CutoffBanner.module.css'

export default function CutoffBanner() {
  const { data: apiCycle } = useNextCycle()
  const localCycles = getNextTwoCycles()

  return (
    <>
      {/* Info bar */}
      <div className={styles.infoBar}>
        <div className="container">
          <div className={styles.infoInner}>
            {[
              { icon: <FiPackage />, text: <span>Envíos el <strong>1° y 15</strong> de cada mes</span> },
              { icon: <FiMapPin />, text: 'Costa Atlántica Argentina' },
              { icon: <FiHome />, text: <span>Retiro gratis en <strong>Chascomús</strong></span> },
              { icon: <FiCreditCard />, text: 'MercadoPago · Tarjeta · Transferencia' },
            ].map((item, i) => (
              <div key={i} className={styles.infoItem}>
                <span className={styles.infoIcon}>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cutoff banner */}
      <div className={styles.banner}>
        <div className="container">
          <div className={styles.inner}>
            <div className={styles.left}>
              <div className={styles.icon}><FiCalendar size={22} /></div>
              <div>
                <h4>Próximas fechas de envío</h4>
                <p>Los pedidos cierran el día anterior a cada salida</p>
              </div>
            </div>
            <div className={styles.dates}>
              {localCycles.map((c, i) => (
                <div key={i} className={`${styles.pill} ${i === 0 ? styles.pillActive : ''}`}>
                  <div className={styles.pillLabel}>Envío {c.label}</div>
                  <div className={styles.pillDate}>{formatCycleDate(c.ship)}</div>
                  <div className={styles.pillSub}>Cierre: {formatCycleDate(c.cutoff)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
