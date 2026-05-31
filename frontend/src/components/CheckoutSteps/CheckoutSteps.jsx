import styles from './CheckoutSteps.module.css'

const STEPS = [
  { num: 1, label: 'Tus datos' },
  { num: 2, label: 'Entrega' },
  { num: 3, label: 'Pago' },
  { num: 4, label: 'Confirmación' },
]

export default function CheckoutSteps({ current }) {
  return (
    <div className={styles.wrapper}>
      {STEPS.map((s, i) => (
        <div key={s.num} className={styles.stepRow}>
          <div className={`${styles.step} ${current === s.num ? styles.active : ''} ${current > s.num ? styles.done : ''}`}>
            <div className={styles.circle}>
              {current > s.num ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : s.num}
            </div>
            <span className={styles.label}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`${styles.line} ${current > s.num ? styles.lineDone : ''}`}></div>
          )}
        </div>
      ))}
    </div>
  )
}
