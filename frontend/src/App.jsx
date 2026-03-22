import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AddProduct from './pages/AddProduct'
import ManageProducts from './pages/ManageProducts'
import EditProduct from './pages/EditProduct'
import Settings from './pages/Settings'
import MaterialUsage from './pages/MaterialUsage'
import CostCalculator from './pages/CostCalculator'
import SalesRecords from './pages/SalesRecords'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/add-product" element={<AddProduct />} />
          <Route path="/admin/manage-products" element={<ManageProducts />} />
          <Route path="/admin/edit-product/:id" element={<EditProduct />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/material-usage" element={<MaterialUsage />} />
          <Route path="/admin/cost-calculator" element={<CostCalculator />} />
          <Route path="/admin/sales-records" element={<SalesRecords />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
