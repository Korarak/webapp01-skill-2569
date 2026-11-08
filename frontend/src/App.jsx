// ไฟล์นี้: กำหนดว่า URL ไหนแสดงหน้าไหน (routing)
// และบังคับว่าหน้าส่วนใหญ่ต้องล็อกอินก่อน ถ้ายังไม่ล็อกอินจะเด้งไปหน้า /login

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Summary from './pages/Summary'
import Transactions from './pages/Transactions'
import Categories from './pages/Categories'
import Profile from './pages/Profile'

// "ยามเฝ้าประตู": ครอบหน้าที่ต้องล็อกอิน
function Protected({ children }) {
  const { user, loading } = useAuth()
  // ระหว่างตรวจ token ที่เก็บไว้ ให้รอก่อน ไม่งั้นจะเด้งไปหน้า login ทั้งที่ล็อกอินค้างอยู่
  if (loading) return <p className="p-6">กำลังโหลด...</p>
  // ล็อกอินแล้ว → แสดงหน้านั้น / ยังไม่ล็อกอิน → ส่งไปหน้า login
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    // AuthProvider: ให้ทุกหน้าข้างในรู้ว่าใครล็อกอินอยู่
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* หน้า login ไม่ต้องล็อกอินก่อน */}
          <Route path="/login" element={<Login />} />

          {/* หน้าที่เหลือทั้งหมดอยู่ใต้ Protected (ต้องล็อกอิน) และใช้ Layout (แถบเมนู) ร่วมกัน */}
          <Route element={<Protected><Layout /></Protected>}>
            <Route index element={<Summary />} />  {/* index = URL "/" */}
            <Route path="transactions" element={<Transactions />} />
            <Route path="categories" element={<Categories />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
