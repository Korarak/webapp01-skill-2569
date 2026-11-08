// หน้า: เข้าสู่ระบบ / สมัครสมาชิก (ใช้ฟอร์มเดียวกัน สลับโหมดด้วยปุ่มด้านล่าง)

import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Login() {
  const { user, login, register } = useAuth()
  const [isRegister, setIsRegister] = useState(false) // false = โหมดเข้าสู่ระบบ, true = โหมดสมัคร
  const [form, setForm] = useState({ email: '', password: '', displayName: '' })
  const [error, setError] = useState('') // ข้อความ error ที่จะแสดงใต้ช่องกรอก

  // ล็อกอินแล้ว ไม่ต้องอยู่หน้านี้ ส่งไปหน้าแรก
  if (user) return <Navigate to="/" replace />

  // ตัวช่วยสร้างฟังก์ชันอัปเดตช่องกรอก เช่น set('email') ใช้กับช่องอีเมล
  // { ...form, [key]: ... } = คัดลอกค่าเดิมทั้งหมด แล้วเปลี่ยนเฉพาะช่องที่พิมพ์
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function submit(e) {
    e.preventDefault() // กันไม่ให้เบราว์เซอร์โหลดหน้าใหม่ตอนกดส่งฟอร์ม
    setError('')
    try {
      if (isRegister) await register(form.email, form.password, form.displayName)
      else await login(form.email, form.password)
      // สำเร็จแล้ว user จะถูกตั้งค่า และโค้ดด้านบนจะพาไปหน้าแรกเอง
    } catch (err) {
      setError(err.message) // แสดงข้อความจากเซิร์ฟเวอร์ ค่าที่กรอกไว้ยังอยู่ ไม่ถูกล้าง
    }
  }

  const input = 'w-full border rounded px-3 py-2' // คลาสหน้าตาของช่องกรอก ใช้ซ้ำหลายช่อง
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white p-6 rounded-lg shadow w-full max-w-sm space-y-3">
        <h1 className="text-xl font-bold text-center">
          {isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        </h1>
        {/* ช่อง "ชื่อที่แสดง" โชว์เฉพาะตอนสมัคร */}
        {isRegister && (
          <input className={input} placeholder="ชื่อที่แสดง"
                 value={form.displayName} onChange={set('displayName')} />
        )}
        <input className={input} type="email" placeholder="อีเมล"
               value={form.email} onChange={set('email')} />
        <input className={input} type="password" placeholder="รหัสผ่าน (อย่างน้อย 8 ตัว)"
               value={form.password} onChange={set('password')} />
        {/* แสดงข้อความ error เฉพาะตอนมี error */}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-blue-600 text-white rounded py-2">
          {isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        </button>
        {/* ปุ่มสลับโหมด type="button" เพื่อไม่ให้ไปกดส่งฟอร์ม */}
        <button type="button" onClick={() => { setIsRegister(!isRegister); setError('') }}
                className="w-full text-sm text-gray-500 underline">
          {isRegister ? 'มีบัญชีแล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก'}
        </button>
      </form>
    </div>
  )
}
