import { useState } from 'react'
import { FiHome, FiMapPin, FiTruck, FiSearch, FiCalendar } from 'react-icons/fi'
import { useShippingZones } from '@/hooks/useShipping'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import { formatCurrency } from '@/utils/formatCurrency'
import { getNextTwoCycles, formatCycleDateLong } from '@/utils/shippingCycles'
import styles from './Shipping.module.css'

export default function Shipping() {
  const { data: zones = [], isLoading } = useShippingZones()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searched, setSearched] = useState(false)
  const localCycles = getNextTwoCycles()

  const handleSearch = (e) => {
    e.preventDefault()
    setSearched(true)
    if (!searchTerm.trim()) {
      setSearchResult(null)
      return
    }

    const matchedZone = zones.find(z => 
      z.city_name.toLowerCase().includes(searchTerm.toLowerCase().trim())
    )

    if (matchedZone) {
      setSearchResult({
        found: true,
        city: matchedZone.city_name,
        price: matchedZone.shipping_price,
        days: matchedZone.estimated_days || 1,
      })
    } else {
      setSearchResult({
        found: false
      })
    }
  }

  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: 48 }}>
            <span className="tag">Logística a tu puerta</span>
            <h1 className="section-title" style={{ marginTop: 16 }}>Envíos a la Costa</h1>
            <p className="section-sub">Entregamos tus pedidos de manera segura dos veces por mes, directo desde Chascomús.</p>
          </div>

          {/* Calculator Section */}
          <div className={styles.calculatorCard}>
            <div className={styles.calcHeader}>
              <FiSearch size={22} className={styles.calcIcon} />
              <div>
                <h3>Calculador de Envío</h3>
                <p>Verificá si llegamos a tu localidad y conocé el costo de entrega</p>
              </div>
            </div>
            <form onSubmit={handleSearch} className={styles.calcForm}>
              <input
                type="text"
                placeholder="Ej: Pinamar, Mar de Ajó, San Bernardo..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setSearched(false) }}
                className={styles.calcInput}
              />
              <button type="submit" className="btn-primary">Buscar localidad</button>
            </form>

            {searched && searchResult && (
              <div className={styles.calcResult}>
                {searchResult.found ? (
                  <div className={styles.resultSuccess}>
                    <FiTruck size={20} className={styles.resultSuccessIcon} />
                    <div>
                      <strong>¡Sí, realizamos envíos a {searchResult.city}!</strong>
                      <span>Costo de envío: {formatCurrency(searchResult.price)} · Tiempo estimado: {searchResult.days} día(s)</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.resultFail}>
                    <FiMapPin size={20} />
                    <div>
                      <strong>No encontramos envíos a "{searchTerm}"</strong>
                      <span>Si tu localidad está en la costa y no aparece, consultanos por WhatsApp.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.layout}>
            {/* Zones & Pickup */}
            <div>
              <h2 className={styles.subTitle}>Zonas y Localidades de Cobertura</h2>
              <div className={styles.zonesList}>
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16, marginBottom: 12 }}></div>
                  ))
                ) : (
                  <>
                    {zones.map(z => (
                      <div key={z.id} className={styles.zoneCard}>
                        <div className={styles.zoneLeft}>
                          <div className={styles.zoneNum}><FiMapPin /></div>
                          <div>
                            <div className={styles.zoneTitle}>{z.city_name}</div>
                            <div className={styles.zoneCities}>Código Postal: {z.postal_codes?.join(', ') || 'N/A'}</div>
                          </div>
                        </div>
                        <div className={styles.zonePrice}>{formatCurrency(z.shipping_price)}</div>
                      </div>
                    ))}
                    {zones.length === 0 && (
                      <div className={styles.zoneCard}>
                        <div className={styles.zoneLeft}>
                          <div className={styles.zoneNum}><FiMapPin /></div>
                          <div>
                            <div className={styles.zoneTitle}>Zona 1: Pinamar & Zonas Cercanas</div>
                            <div className={styles.zoneCities}>Pinamar · Ostende · Valeria del Mar · Cariló</div>
                          </div>
                        </div>
                        <div className={styles.zonePrice}>{formatCurrency(5000)}</div>
                      </div>
                    )}
                  </>
                )}

                <div className={`${styles.zoneCard} ${styles.zonePickup}`}>
                  <div className={styles.zoneLeft}>
                    <div className={styles.zoneNum} style={{ background: 'var(--blue-text)' }}><FiHome /></div>
                    <div>
                      <div className={styles.zoneTitle}>Retiro en distribuidora</div>
                      <div className={styles.zoneCities}>Chascomús — coordinás día y horario</div>
                    </div>
                  </div>
                  <div className={`${styles.zonePrice} ${styles.zonePriceBlue}`}>Sin costo</div>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className={styles.calendarCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <FiCalendar size={22} className={styles.calendarIcon} />
                <h3 style={{ margin: 0 }}>Calendario de Envíos</h3>
              </div>
              <p style={{ fontSize: 13, color: 'var(--gray-text)', marginBottom: 24 }}>Los pedidos cierran el día antes de cada salida</p>
              <div className={styles.calCycles}>
                {localCycles.map((c, i) => (
                  <div key={i} className={`${styles.calCycle} ${i === 0 ? styles.calCycleActive : ''}`}>
                    <div className={styles.calCycleLabel}>Envío {c.label}</div>
                    <div className={styles.calCycleDate}>{formatCycleDateLong(c.ship)}</div>
                    <div className={styles.calCycleSub}>
                      Cierre: <strong>{formatCycleDateLong(c.cutoff)}</strong>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.calNote}>
                <strong>¿Llegás a tiempo?</strong> Hacé tu pedido antes del cierre y entra en el siguiente envío.
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
