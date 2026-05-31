import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { productService } from '@/services/productService';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import styles from './ProductDetail.module.css';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCartStore } from '@/store/useCartStore';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const addItem = useCartStore((s) => s.addItem);

  // Load the product detail and its variants
  useEffect(() => {
    // Load the main product
    productService.detail(slug).then((r) => {
      const p = r.data;
      setProduct(p);
    });

    // Load all products to find variants sharing the same base title
    productService.list().then((r) => {
      const all = r.data.results || r.data;
      // Compute base title by stripping " x N unid" pattern (case‑insensitive)
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

  if (!product) return <div className={styles.loading}>Cargando...</div>;

  const imageUrl = product.image || "https://images.unsplash.com/photo-1622445262465-2481c8573226?auto=format&fit=crop&w=600&q=80";

  const handleAdd = () => {
    const item = selectedVariant || product;
    addItem(item);
  };

  return (
    <div>
      <Navbar />
      <section className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>{product.title}</h1>
          <img src={imageUrl} alt={product.title} className={styles.image} />
          <p className={styles.description}>{product.description}</p>
          <div className={styles.info}>
            <p><strong>Precio:</strong> {formatCurrency(product.price)}</p>
            <p><strong>Talle:</strong> {product.size}</p>
            <p><strong>Stock:</strong> {product.stock}</p>
          </div>
          {variants.length > 1 && (
            <div className={styles.variantSelect}>
              <label>Unidades por pack:</label>
              <select
                value={selectedVariant?.id || ''}
                onChange={(e) => {
                  const v = variants.find((v) => v.id === Number(e.target.value));
                  setSelectedVariant(v);
                }}
              >
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.quantity} unidades – {formatCurrency(v.price)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button className={styles.addBtn} onClick={handleAdd} disabled={product.stock === 0}>
            {product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
          </button>
        </div>
      </section>
      <Footer />
    </div>
  );

}
