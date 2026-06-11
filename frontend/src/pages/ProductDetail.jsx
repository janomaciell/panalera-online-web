import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { productService } from '@/services/productService';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import styles from './ProductDetail.module.css';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCartStore } from '@/store/useCartStore';
import { FiShoppingCart, FiPackage, FiCheckCircle, FiArrowLeft, FiZap } from 'react-icons/fi';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    productService.detail(slug).then((r) => {
      const p = r.data;
      setProduct(p);
    });

    productService.list().then((r) => {
      const all = r.data.results || r.data;
      const baseTitle = all
        .find((p) => p.slug === slug)
        ?.title.replace(/\s*x\s*\d+\s*unid.*/i, '')
        .trim();
      if (!baseTitle) return;
      const vars = all.filter(
        (p) => p.title.replace(/\s*x\s*\d+\s*unid.*/i, '').trim() === baseTitle
      );
      setVariants(vars);
      if (vars.length > 0) setSelectedVariant(vars[0]);
    });
  }, [slug]);

  if (!product) {
    return (
      <div>
        <Navbar />
        <div className={styles.loadingPage}>
          <div className={styles.skeleton} style={{ width: '100%', height: 400, borderRadius: 24 }} />
        </div>
      </div>
    );
  }

  const imageUrl = product.image || 'https://images.unsplash.com/photo-1622445262465-2481c8573226?auto=format&fit=crop&w=900&q=80';
  const displayItem = selectedVariant || product;

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(displayItem);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const inStock = product.stock > 0;
  const stockLow = product.stock > 0 && product.stock <= 10;

  return (
    <div>
      <Navbar />
      <section className={styles.page}>
        <div className="container">

          {/* Breadcrumb */}
          <div className={styles.breadcrumb}>
            <Link to="/productos" className={styles.backLink}>
              <FiArrowLeft size={14} />
              Volver a productos
            </Link>
          </div>

          <div className={styles.grid}>

            {/* ── Image column ── */}
            <div className={styles.imageCol}>
              <div className={styles.imageWrap}>
                <img src={imageUrl} alt={product.title} className={styles.image} />
                {!inStock && (
                  <div className={styles.outOfStockOverlay}>Sin stock</div>
                )}
              </div>
            </div>

            {/* ── Info column ── */}
            <div className={styles.infoCol}>

              {/* Category tag */}
              {product.category && (
                <span className={styles.category}>{product.category}</span>
              )}

              <h1 className={styles.title}>{product.title}</h1>

              {/* Price block */}
              <div className={styles.priceBlock}>
                <span className={styles.price}>{formatCurrency(displayItem.price)}</span>
                <span className={styles.priceUnit}>por pack</span>
              </div>

              {/* Description */}
              {product.description && (
                <p className={styles.description}>{product.description}</p>
              )}

              {/* Variant selector */}
              {variants.length > 1 && (
                <div className={styles.variantSection}>
                  <div className={styles.variantLabel}>
                    <FiPackage size={14} />
                    Unidades por pack
                  </div>
                  <div className={styles.variantGrid}>
                    {variants.map((v) => (
                      <button
                        key={v.id}
                        className={`${styles.variantBtn} ${selectedVariant?.id === v.id ? styles.variantBtnActive : ''}`}
                        onClick={() => setSelectedVariant(v)}
                        type="button"
                      >
                        <span className={styles.variantQty}>{v.quantity} unid.</span>
                        <span className={styles.variantPrice}>{formatCurrency(v.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Details */}
              <div className={styles.details}>
                {product.size && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Talle / Medida</span>
                    <span className={styles.detailValue}>{product.size}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Disponibilidad</span>
                  <span className={`${styles.detailValue} ${inStock ? styles.inStock : styles.noStock}`}>
                    {inStock
                      ? stockLow
                        ? `⚡ Últimas ${product.stock} unidades`
                        : '✓ En stock'
                      : '✗ Sin stock'}
                  </span>
                </div>
                {displayItem.quantity && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Unidades por pack</span>
                    <span className={styles.detailValue}>{displayItem.quantity} unid.</span>
                  </div>
                )}
              </div>

              {/* Qty + Add to cart */}
              <div className={styles.actions}>
                {inStock && (
                  <div className={styles.qtyControl}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      type="button"
                    >−</button>
                    <span className={styles.qtyNum}>{qty}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => setQty(q => q + 1)}
                      type="button"
                    >+</button>
                  </div>
                )}
                <button
                  className={`${styles.addBtn} ${added ? styles.addBtnDone : ''}`}
                  onClick={handleAdd}
                  disabled={!inStock}
                  type="button"
                >
                  {added
                    ? <><FiCheckCircle size={16} /> Agregado</>
                    : !inStock
                      ? 'Sin stock'
                      : <><FiShoppingCart size={16} /> Agregar al carrito</>
                  }
                </button>
              </div>

              {/* Shipping note */}
              <div className={styles.shippingNote}>
                <FiZap size={13} />
                Envío el 1° y 15 de cada mes desde Chascomús
              </div>

            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
