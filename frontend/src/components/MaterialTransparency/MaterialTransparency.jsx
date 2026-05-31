import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  FiFeather, FiDroplet, FiShield, FiWind, FiHeart, FiAward,
  FiAlertCircle, FiSmile, FiCheck
} from 'react-icons/fi'
import styles from './MaterialTransparency.module.css'

gsap.registerPlugin(ScrollTrigger)

const YES_ITEMS = [
  { icon: <FiFeather />, bg: 'green', title: 'Materiales vegetales', desc: 'Fibras naturales certificadas, ultra suaves al tacto.' },
  { icon: <FiDroplet />, bg: 'blue', title: 'Capa súper absorbente', desc: 'Polímero sin tóxicos. Seco al instante, sin irritación.' },
  { icon: <FiShield />, bg: 'beige', title: 'Hipoalergénico', desc: 'Dermatológicamente probado. Apto para piel sensible.' },
  { icon: <FiWind />, bg: 'green', title: 'Transpirable', desc: 'Circulación de aire constante para prevenir rozaduras.' },
  { icon: <FiHeart />, bg: 'blue', title: 'Sin colorantes', desc: 'Superficie interior blanca natural. Sin tintas ni blanqueadores.' },
  { icon: <FiAward />, bg: 'beige', title: 'Certificado ECO', desc: 'Proceso de producción responsable, empaques reciclables.' },
]

const NO_LIST = ['Fragancias', 'Cloro', 'Parabenos', 'Ftalatos', 'Colorantes artificiales', 'Látex', 'BPA', 'Formaldehído']

export default function MaterialTransparency() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.transp-header', { opacity: 0, y: 32 }, {
        opacity: 1, y: 0, duration: 1.0, ease: 'power3.out',
        scrollTrigger: { trigger: '.transp-header', start: 'top 85%', once: true }
      })
      gsap.fromTo('.transp-item', { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, stagger: 0.08, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: '.transp-grid', start: 'top 85%', once: true }
      })
      gsap.fromTo('.transp-no', { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: '.transp-no', start: 'top 88%', once: true }
      })
      gsap.fromTo('.transp-visual', { opacity: 0, x: 40 }, {
        opacity: 1, x: 0, duration: 1.0, ease: 'power3.out',
        scrollTrigger: { trigger: '.transp-visual', start: 'top 85%', once: true }
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section className={styles.section} id="materiales" ref={sectionRef}>
      <div className="container">
        <div className={styles.layout}>
          {/* Left */}
          <div>
            <div className="transp-header">
              <span className="tag">Transparencia de materiales</span>
              <h2 className={`${styles.title} section-title`}>
                Sabés exactamente<br />lo que ponés en tu piel
              </h2>
              <p className={styles.sub}>
                Sin ingredientes escondidos. Sin química innecesaria. Solo lo que la piel sensible necesita para estar cómoda y protegida.
              </p>
            </div>

            <div className={`${styles.grid} transp-grid`}>
              {YES_ITEMS.map((item) => (
                <div key={item.title} className={`${styles.item} transp-item`}>
                  <div className={`${styles.itemIcon} ${styles[`icon_${item.bg}`]}`}>{item.icon}</div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>

            <div className={`${styles.noBox} transp-no`}>
              <h4 className={styles.noTitle}>Lo que NO usamos</h4>
              <div className={styles.noList}>
                {NO_LIST.map(n => (
                  <span key={n} className={styles.noTag}>✕ {n}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right visual - Happy mature smile */}
          <div className={`${styles.visual} transp-visual`}>
            <div className={styles.visualCard}>
              <div className={styles.visualImgWrapper}>
                <img
                  src="https://images.unsplash.com/photo-1507206130118-b5907f817163?auto=format&fit=crop&w=600&q=80"
                  alt="Abuela mayor feliz y saludable"
                  className={styles.visualImg}
                />
              </div>
              <h3>Hechos con intención</h3>
              <p>Cada material fue elegido pensando en el máximo confort. Sin compromisos, sin atajos.</p>
            </div>
            <div className={styles.visualBadges}>
              {[
                { icon: <FiAlertCircle />, label: 'Sin cloro' },
                { icon: <FiSmile />, label: 'Sin fragancias' },
                { icon: <FiCheck />, label: 'Dermatología' },
                { icon: <FiAward />, label: 'Eco friendly' },
              ].map(b => (
                <div key={b.label} className={styles.visualBadge}>
                  <span className={styles.badgeIcon}>{b.icon}</span>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
            <div className={styles.certCard}>
              <div className={styles.certIcon}><FiAward size={28} /></div>
              <div>
                <div className={styles.certTitle}>Certificado dermatológico</div>
                <div className={styles.certSub}>Testado clínicamente en pieles sensibles y atópicas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
