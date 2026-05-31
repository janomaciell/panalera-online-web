import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import MaterialTransparency from '@/components/MaterialTransparency/MaterialTransparency'

export default function Materials() {
  return (
    <div>
      <Navbar />
      <div style={{ paddingTop: '72px' }}>
        <MaterialTransparency />
      </div>
      <Footer />
    </div>
  )
}
