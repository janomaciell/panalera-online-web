import { useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useProducts } from '@/hooks/useProducts'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard/ProductCard'
import styles from './Products.module.css'

const CATEGORY_LABELS = {
  panal_basico:          'Pañal Básico',
  panal_clasico:         'Pañal Clásico',
  panal_elastizado:      'Pañal Elastizado',
  panal_juvenil:         'Pañal Juvenil',
  aposito_incontinencia: 'Apósito',
  ropa_interior:         'Ropa Interior',
  donna_fem:             'Donna Fem',
  accesorios:            'Accesorios',
  algodon:               'Algodón',
  otros:                 'Otros',
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')

  // Read filters from query params (set by wizard or manual)
  const sizeFilter     = searchParams.get('size')     || ''
  const categoryFilter = searchParams.get('category') || ''
  const fromWizard     = searchParams.get('from') === 'wizard'

  const { data: allProducts = [], isLoading } = useProducts()

  // Client-side filter (products already come filtered by size from API if needed)
  const products = useMemo(() => {
    let list = allProducts
    if (sizeFilter)     list = list.filter(p => p.size === sizeFilter)
    if (categoryFilter) list = list.filter(p => p.category === categoryFilter)
    if (search.trim())  list = list.filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
    )
    return list
  }, [allProducts, sizeFilter, categoryFilter, search])

  const categories = useMemo(() => {
    const cats = [...new Set(allProducts.map(p => p.category).filter(Boolean))]
    return cats
  }, [allProducts])

  const clearFilters = () => {
    setSearchParams({})
    setSearch('')
  }

  const hasActiveFilters = sizeFilter || categoryFilter || search

  return (
    <div>
      <Navbar />
      <section className={styles.page}>
        <div className="container">

          {/* Header */}
          <div className="section-header" style={{ marginBottom: 32 }}>
            <span className="tag">Catálogo Completo</span>
            <h1 className="section-title" style={{ marginTop: 16 }}>Nuestros Productos</h1>
            {fromWizard && categoryFilter ? (
              <p className="section-sub">
                Mostrando resultados para: <strong>{CATEGORY_LABELS[categoryFilter] || categoryFilter}</strong>
                {sizeFilter && ` · Talle ${sizeFilter}`}
              </p>
            ) : (
              <p className="section-sub">Pañales premium pensados para la piel más sensible.</p>
            )}
          </div>

          {/* Orientation CTA */}
          {!fromWizard && (
            <div className={styles.wizardCta}>
              <span>🎯</span>
              <span>¿No sabés qué talle o modelo elegir?</span>
              <Link to="/orientacion" className={styles.wizardCtaBtn}>Te orientamos →</Link>
            </div>
          )}

          {/* Filters */}
          <div className={styles.filters}>
            <input
              className={styles.searchInput}
              placeholder="Buscar producto…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className={styles.filterChips}>
              <button
                className={`${styles.chip} ${!categoryFilter ? styles.chipActive : ''}`}
                onClick={() => setSearchParams(p => { const n = new URLSearchParams(p); n.delete('category'); return n })}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`${styles.chip} ${categoryFilter === cat ? styles.chipActive : ''}`}
                  onClick={() => setSearchParams(p => { const n = new URLSearchParams(p); n.set('category', cat); return n })}
                >
                  {CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>
            {hasActiveFilters && (
              <button className={styles.clearBtn} onClick={clearFilters}>
                × Limpiar filtros
              </button>
            )}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className={styles.grid}>
              {Array(6).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (
            <>
              {products.length === 0 ? (
                <div className={styles.empty}>
                  <p>No hay productos que coincidan con tu búsqueda.</p>
                  {hasActiveFilters && (
                    <button className="btn-primary" onClick={clearFilters} style={{ marginTop: 16 }}>
                      Ver todos los productos
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <p className={styles.resultsCount}>{products.length} producto{products.length !== 1 ? 's' : ''}</p>
                  <div className={styles.grid}>
                    {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}
