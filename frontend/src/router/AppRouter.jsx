import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Products from '@/pages/Products'
import ProductDetail from '@/pages/ProductDetail'
import Materials from '@/pages/Materials'
import Shipping from '@/pages/Shipping'
import Checkout from '@/pages/Checkout'
import CheckoutSuccess from '@/pages/CheckoutSuccess'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Profile from '@/pages/Profile'
import Orientation from '@/pages/Orientation'
import NotFound from '@/pages/NotFound'
import ProtectedRoute from './ProtectedRoute'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                  element={<Home />} />
        <Route path="/orientacion"       element={<Orientation />} />
        <Route path="/productos"         element={<Products />} />
        <Route path="/productos/:slug"   element={<ProductDetail />} />
        <Route path="/materiales"        element={<Materials />} />
        <Route path="/envios"            element={<Shipping />} />
        <Route path="/checkout"          element={<Checkout />} />
        <Route path="/checkout/exito"    element={<CheckoutSuccess />} />
        <Route path="/login"             element={<Login />} />
        <Route path="/perfil"            element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/dashboard/*"       element={<ProtectedRoute staffOnly><Dashboard /></ProtectedRoute>} />
        <Route path="*"                  element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
