import { useProducts } from '@/hooks/useProducts'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard/ProductCard'
import styles from './Products.module.css'

export default function Products() {
  const { data: products = [], isLoading } = useProducts()

  return (
    <div>
      <Navbar />
      <section className={styles.page}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: 48 }}>
            <span className="tag">Catálogo Completo</span>
            <h1 className="section-title" style={{ marginTop: 16 }}>Nuestros Productos</h1>
            <p className="section-sub">Pañales premium pensados para la piel más sensible, con la comodidad y protección que merecen.</p>
          </div>

          {isLoading ? (
            <div className={styles.grid}>
              {Array(6).fill(0).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              {products.length === 0 ? (
                <div className={styles.empty}>
                  <p>No hay productos disponibles en este momento. Por favor, volvé a intentar más tarde.</p>
                </div>
              ) : (
                <div className={styles.grid}>
                  {products.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}
