import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './OrientationWizard.module.css'

const STEPS = [
  {
    id: 'user_type',
    title: '¿Para quién es el producto?',
    emoji: '👤',
    options: [
      { value: 'adult_mama', label: 'Adulto mayor (mamá)', icon: '👵' },
      { value: 'adult_papa', label: 'Adulto mayor (papá)', icon: '👴' },
      { value: 'child',      label: 'Niño / Juvenil', icon: '👦' },
      { value: 'post_partum', label: 'Post-parto', icon: '🤱' },
      { value: 'couple',     label: 'Pareja', icon: '👩‍❤️‍👨' },
      { value: 'other',      label: 'Otro', icon: '👤' },
      { value: 'nose',       label: 'No sé', icon: '🤷' },
    ],
  },
  {
    id: 'product_type',
    title: '¿Qué tipo de producto necesitás?',
    emoji: '📦',
    options: [
      { value: 'panal',        label: 'Pañal', icon: '🩲' },
      { value: 'aposito',      label: 'Apósito / Refuerzo', icon: '🩹' },
      { value: 'ropa_interior', label: 'Ropa interior especial', icon: '👕' },
      { value: 'accesorio',    label: 'Accesorio (zalea, cubre-colchón…)', icon: '🛏️' },
      { value: 'nose',         label: 'No sé', icon: '🤷' },
    ],
  },
  {
    id: 'incontinence_level',
    title: '¿Cuál es el nivel de incontinencia?',
    emoji: '💧',
    options: [
      { value: 'bajo',     label: 'Bajo', icon: '💧' },
      { value: 'moderado', label: 'Moderado', icon: '💦' },
      { value: 'alto',     label: 'Alto', icon: '🌊' },
      { value: 'extremo',  label: 'Extremo', icon: '⚡' },
      { value: 'nose',     label: 'No sé', icon: '🤷' },
    ],
  },
  {
    id: 'size',
    title: '¿Cuál es el peso aproximado?',
    emoji: '⚖️',
    options: [
      { value: 'CH',        label: 'Menos de 50 kg', icon: '🔵', size_hint: 'Talle CH/Juvenil' },
      { value: 'GDE',       label: '50 – 80 kg', icon: '🟢', size_hint: 'Talle G' },
      { value: 'EX_GDE',   label: '80 – 110 kg', icon: '🟡', size_hint: 'Talle EG' },
      { value: 'EX_EX_GDE', label: 'Más de 110 kg', icon: '🔴', size_hint: 'Talle EEG' },
      { value: 'nose',       label: 'No sé', icon: '🤷' },
    ],
  },
  {
    id: 'daily_units',
    title: '¿Cuántas unidades usás por día?',
    emoji: '📊',
    options: [
      { value: '1-5',  label: '1 a 5 unidades', icon: '1️⃣' },
      { value: '5-10', label: '5 a 10 unidades', icon: '5️⃣' },
      { value: 'mas',  label: 'Más de 10 unidades', icon: '➕' },
      { value: 'nose',  label: 'No sé', icon: '🤷' },
    ],
  },
]

export default function OrientationWizard({ onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [otherText, setOtherText] = useState('')
  const [showOtherInput, setShowOtherInput] = useState(false)
  const [showChildWarning, setShowChildWarning] = useState(false)
  const navigate = useNavigate()

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const handleSelect = (value) => {
    if (value === 'child') {
      setShowChildWarning(true)
      return
    }
    if (value === 'other') {
      setShowOtherInput(true)
      return
    }

    proceed(value)
  }

  const proceed = (value) => {
    const newAnswers = { ...answers, [current.id]: value }
    setAnswers(newAnswers)

    if (isLast) {
      // Build query params from answers
      const params = new URLSearchParams()
      if (newAnswers.size && newAnswers.size !== 'nose') {
        params.set('size', newAnswers.size)
      }
      if (newAnswers.product_type && newAnswers.product_type !== 'nose') {
        const catMap = {
          panal: newAnswers.user_type === 'post_partum' ? 'donna_fem' : 'panal_clasico',
          aposito: 'aposito_incontinencia',
          ropa_interior: 'ropa_interior',
          accesorio: 'accesorios',
        }
        params.set('category', catMap[newAnswers.product_type] || '')
      }
      if (newAnswers.user_type === 'post_partum') {
        params.set('category', 'donna_fem')
      }
      if (newAnswers.daily_units && newAnswers.daily_units !== 'nose') {
        params.set('daily_units', newAnswers.daily_units)
      }
      if (newAnswers.incontinence_level && newAnswers.incontinence_level !== 'nose') {
        params.set('incontinence_level', newAnswers.incontinence_level)
      }

      onComplete?.(newAnswers)
      navigate(`/productos?${params.toString()}&from=wizard`)
    } else {
      setStep(s => s + 1)
    }
  }

  const handleConfirmOther = () => {
    if (!otherText.trim()) return
    setShowOtherInput(false)
    proceed(otherText.trim())
  }

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const handleSkip = () => {
    navigate('/productos')
  }

  if (showChildWarning) {
    return (
      <div className={styles.wizard}>
        <div className={styles.card}>
          <div className={styles.emoji}>⚠️</div>
          <h2 className={styles.question}>Aviso Importante</h2>
          <p className={styles.warningDesc}>
            Por el momento no disponemos de pañales o accesorios infantiles. Nuestro catálogo está enfocado exclusivamente en pañales y productos de incontinencia para adultos.
          </p>
          <div className={styles.warningActions}>
            <button
              className={styles.catalogBtn}
              onClick={() => navigate('/productos')}
            >
              Ver catálogo de adultos
            </button>
            <button
              className={styles.backBtn}
              onClick={() => setShowChildWarning(false)}
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showOtherInput) {
    return (
      <div className={styles.wizard}>
        <div className={styles.card}>
          <div className={styles.emoji}>👤</div>
          <h2 className={styles.question}>¿Para quién es el producto?</h2>
          
          <div className={styles.inputContainer}>
            <input
              type="text"
              className={styles.textInput}
              placeholder="Escribí para quién es (ej. Mi abuela, un vecino...)"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.otherActions}>
            <button
              className={styles.confirmBtn}
              onClick={handleConfirmOther}
              disabled={!otherText.trim()}
            >
              Confirmar y continuar
            </button>
            <button
              className={styles.backBtn}
              onClick={() => {
                setShowOtherInput(false)
                setOtherText('')
              }}
            >
              ← Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wizard}>
      {/* Progress bar */}
      <div className={styles.progress}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`${styles.dot} ${i <= step ? styles.dotActive : ''}`}
          />
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.emoji}>{current.emoji}</div>
        <h2 className={styles.question}>{current.title}</h2>

        <div className={styles.options}>
          {current.options.map(opt => (
            <button
              key={opt.value}
              className={styles.option}
              onClick={() => handleSelect(opt.value)}
            >
              <span className={styles.optionIcon}>{opt.icon}</span>
              <span className={styles.optionLabel}>{opt.label}</span>
              {opt.size_hint && (
                <span className={styles.optionHint}>{opt.size_hint}</span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.nav}>
          {step > 0 && (
            <button className={styles.backBtn} onClick={handleBack}>
              ← Anterior
            </button>
          )}
          <button className={styles.skipBtn} onClick={handleSkip}>
            Saltar →
          </button>
        </div>
      </div>

      <p className={styles.stepCounter}>
        Pregunta {step + 1} de {STEPS.length}
      </p>
    </div>
  )
}
