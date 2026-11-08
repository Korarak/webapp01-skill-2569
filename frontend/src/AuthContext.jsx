// ไฟล์นี้: "ที่เก็บสถานะการล็อกอิน" ที่ทุกหน้าในแอปเรียกใช้ได้
// ใช้ React Context ซึ่งเหมือนตัวแปรกลาง ไม่ต้องส่งข้อมูลผู้ใช้ผ่านทุกหน้าทีละชั้น
// หน้าไหนอยากรู้ว่าใครล็อกอินอยู่ แค่เรียก const { user } = useAuth()

import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

// ฟังก์ชันลัดสำหรับหน้าอื่น ๆ ใช้ดึงข้อมูลล็อกอิน
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // ข้อมูลผู้ใช้ที่ล็อกอิน (null = ยังไม่ล็อกอิน)
  const [loading, setLoading] = useState(true) // true = กำลังตรวจว่าเคยล็อกอินค้างไว้ไหม

  // ทำครั้งเดียวตอนเปิดเว็บ: ถ้ามี token เก็บไว้ ลองถามเซิร์ฟเวอร์ว่า token นี้เป็นใคร
  // ทำให้ปิดแล้วเปิดเว็บใหม่ไม่ต้องล็อกอินซ้ำ
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false) // ไม่มี token แปลว่ายังไม่ล็อกอิน ไม่ต้องถามเซิร์ฟเวอร์
      return
    }
    api('/me')
      .then(setUser)                                  // token ใช้ได้ → จำว่าเป็นใคร
      .catch(() => localStorage.removeItem('token'))  // token หมดอายุ/ใช้ไม่ได้ → ทิ้ง
      .finally(() => setLoading(false))
  }, [])

  // ใช้ร่วมกันทั้งสมัครและเข้าสู่ระบบ: ส่งข้อมูลไป แล้วเก็บ token + ผู้ใช้ที่ได้กลับมา
  async function authenticate(path, body) {
    const data = await api(path, { method: 'POST', body })
    localStorage.setItem('token', data.token) // เก็บ token ไว้ในเบราว์เซอร์
    setUser(data.user)
  }

  const login = (email, password) =>
    authenticate('/auth/login', { email, password })
  const register = (email, password, displayName) =>
    authenticate('/auth/register', { email, password, displayName })

  // ออกจากระบบ: ทิ้ง token และล้างข้อมูลผู้ใช้ (ไม่ต้องบอกเซิร์ฟเวอร์ เพราะ token อยู่ฝั่งเบราว์เซอร์)
  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  // แจกค่าเหล่านี้ให้ทุกหน้าที่อยู่ใน <AuthProvider>
  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
