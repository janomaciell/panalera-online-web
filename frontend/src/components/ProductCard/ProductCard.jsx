import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus, FiCheck, FiAlertTriangle } from 'react-icons/fi'
import { useCartStore } from '@/store/useCartStore'
import { formatCurrency } from '@/utils/formatCurrency'
import styles from './ProductCard.module.css'

export default function ProductCard({ product, index = 0 }) {
  const addItem = useCartStore(s => s.addItem)
  const [added, setAdded] = useState(false)

  const handleAdd = (e) => {
    e.preventDefault()
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  // Soft premium placeholder diaper image
  const imageUrl = product.image || "https://images.unsplash.com/photo-1622445262465-2481c8573226?auto=format&fit=crop&w=400&q=80"

  return (
    <Link to={`/productos/${product.slug}`} className={styles.card}>
      {product.compare_price && (
        <div className={styles.badge}>Oferta</div>
      )}
      {index === 0 && <div className={`${styles.badge} ${styles.badgeBlue}`}>Más vendido</div>}

      <div className={styles.imgWrapper}>
        <img
          src={imageUrl}
          alt={product.title}
          className={styles.img}
        />
      </div>

      <div className={styles.body}>
        <div className={styles.size}>Talle {product.size}</div>
        <div className={styles.name}>{product.title}</div>
        <div className={styles.qty}>{product.quantity} unidades</div>

        <div className={styles.footer}>
          <div className={styles.priceRow}>
            <span className={styles.price}>{formatCurrency(product.price)}</span>
            {product.compare_price && (
              <span className={styles.priceOld}>{formatCurrency(product.compare_price)}</span>
            )}
          </div>
          <button
            className={`${styles.addBtn} ${added ? styles.addBtnSuccess : ''}`}
            onClick={handleAdd}
            aria-label={`Agregar ${product.title} al carrito`}
          >
            {added ? <FiCheck size={18} /> : <FiPlus size={18} />}
          </button>
        </div>

        {product.stock < 10 && product.stock > 0 && (
          <div className={styles.stockWarn}>
            <FiAlertTriangle style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }} />
            Últimas {product.stock} unidades
          </div>
        )}
        {product.stock === 0 && (
          <div className={styles.stockOut}>Sin stock</div>
        )}
      </div>
    </Link>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className={styles.card} style={{ pointerEvents: 'none' }}>
      <div className={`${styles.imgWrapper} skeleton`} style={{ fontSize: 0 }}></div>
      <div className={styles.body}>
        <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 8, borderRadius: 4 }}></div>
        <div className="skeleton" style={{ height: 20, width: '70%', marginBottom: 6, borderRadius: 4 }}></div>
        <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 20, borderRadius: 4 }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ height: 28, width: '35%', borderRadius: 4 }}></div>
          <div className="skeleton" style={{ height: 40, width: 40, borderRadius: '50%' }}></div>
        </div>
      </div>
    </div>
  )
}
