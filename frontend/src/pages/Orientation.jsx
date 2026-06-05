import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import OrientationWizard from '@/components/OrientationWizard/OrientationWizard'
import styles from './Orientation.module.css'

export default function Orientation() {
  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <div className="container">
          <div className={styles.intro}>
            <h1 className={styles.title}>Te ayudamos a elegir 🎯</h1>
            <p className={styles.subtitle}>
              Respondé unas preguntas rápidas y te mostramos los productos perfectos para tu situación.
            </p>
          </div>
          <OrientationWizard />
        </div>
      </div>
      <Footer />
    </div>
  )
}
