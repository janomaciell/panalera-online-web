import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { authService } from '@/services/authService'
import Navbar from '@/components/Navbar/Navbar'
import styles from './Login.module.css'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const setAuth = useAuthStore(s => s.setAuth)
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true); setError('')
    try {
      if (mode === 'login') {
        const res = await authService.login(data.email, data.password)
        setAuth(res.data.user, res.data.access, res.data.refresh)
        navigate(res.data.user.is_staff ? '/dashboard' : '/')
      } else {
        await authService.register(data)
        const res = await authService.login(data.email, data.password)
        setAuth(res.data.user, res.data.access, res.data.refresh)
        navigate('/')
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Datos incorrectos. Intentá de nuevo.')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.card}>
          <Link to="/" className={styles.logo}>Pañalera<span>.</span></Link>
          <h1>{mode === 'login' ? 'Ingresá a tu cuenta' : 'Crear cuenta'}</h1>
          <p>{mode === 'login' ? 'Para ver tu historial de pedidos' : 'Guardá tus datos para futuras compras'}</p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Nombre completo *</label>
                <input className={`form-input ${errors.name ? 'error' : ''}`}
                  {...register('name', { required: 'Requerido' })} placeholder="Tu nombre" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className={`form-input ${errors.email ? 'error' : ''}`} type="email"
                {...register('email', { required: 'Requerido' })} placeholder="tu@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña *</label>
              <input className={`form-input ${errors.password ? 'error' : ''}`} type="password"
                {...register('password', { required: 'Requerido' })} placeholder="••••••••" />
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>
            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          <div className={styles.toggle}>
            {mode === 'login' ? (
              <span>¿No tenés cuenta? <button onClick={() => setMode('register')}>Registrate</button></span>
            ) : (
              <span>¿Ya tenés cuenta? <button onClick={() => setMode('login')}>Ingresá</button></span>
            )}
          </div>

          <div className={styles.guestNote}>
            También podés comprar <Link to="/#productos">sin crear cuenta</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
