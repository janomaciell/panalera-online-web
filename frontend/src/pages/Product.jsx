import { useParams, Link } from 'react-router-dom'
import { FiCheck, FiAlertTriangle, FiArrowLeft } from 'react-icons/fi'
import { useProduct } from '@/hooks/useProducts'
import { useCartStore } from '@/store/useCartStore'
import { formatCurrency } from '@/utils/formatCurrency'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import styles from './Product.module.css'

export default function Product() {
  const { slug } = useParams()
  const { data: product, isLoading, error } = useProduct(slug)
  const addItem = useCartStore(s => s.addItem)

  if (isLoading) {
    return (
      <div>
        <Navbar />
        <div className={styles.loadingContainer}>
          <div className="skeleton" style={{ height: 400, width: '100%', borderRadius: 16 }}></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div>
        <Navbar />
        <div className={styles.loading}>
          Producto no encontrado. <Link to="/productos" className="btn-primary" style={{ marginTop: 16 }}>Ver catálogo</Link>
        </div>
        <Footer />
      </div>
    )
  }

  const imageUrl = product.image || "https://images.unsplash.com/photo-1622445262465-2481c8573226?auto=format&fit=crop&w=600&q=80"

  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <div className="container">
          <Link to="/productos" className={styles.back}>
            <FiArrowLeft style={{ marginRight: 6 }} /> Volver al catálogo
          </Link>
          <div className={styles.layout}>
            <div className={styles.imgCol}>
              <div className={styles.imgWrapper}>
                <img src={imageUrl} alt={product.title} className={styles.img} />
              </div>
            </div>
            <div className={styles.infoCol}>
              <div className={styles.sizeTag}>Talle {product.size}</div>
              <h1 className={styles.title}>{product.title}</h1>
              <div className={styles.qty}>{product.quantity} unidades por pack</div>
              <div className={styles.priceRow}>
                <span className={styles.price}>{formatCurrency(product.price)}</span>
                {product.compare_price && (
                  <span className={styles.priceOld}>{formatCurrency(product.compare_price)}</span>
                )}
              </div>
              <p className={styles.desc}>{product.description || 'Pañales premium ultra absorbentes e hipoalergénicos diseñados para ofrecer máximo confort, frescura y protección a la piel más sensible. Fabricados sin cloro ni químicos irritantes.'}</p>
              
              <div className={styles.badges}>
                {['Sin fragancias', 'Sin cloro', 'Hipoalergénico', 'Materiales vegetales'].map(b => (
                  <span key={b} className={styles.badge}>
                    <FiCheck className={styles.badgeIcon} /> {b}
                  </span>
                ))}
              </div>
              
              <button
                className={`btn-primary ${styles.addBtn}`}
                onClick={() => addItem(product)}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
              </button>
              
              {product.stock < 10 && product.stock > 0 && (
                <div className={styles.stockWarn}>
                  <FiAlertTriangle style={{ marginRight: 6 }} /> Últimas {product.stock} unidades disponibles
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
