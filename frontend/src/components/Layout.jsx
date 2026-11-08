// คอมโพเนนต์: โครงหน้าที่ใช้ร่วมกันทุกหน้า (แถบเมนูด้านบน + พื้นที่เนื้อหา)
// หน้าต่าง ๆ (สรุป รายการ หมวดหมู่ โปรไฟล์) จะไปแสดงตรง <Outlet /> ด้านล่าง

import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import Avatar from './Avatar'

// เมนู: [ที่อยู่ URL, ข้อความที่แสดง]
const links = [
  ['/', 'สรุป'],
  ['/transactions', 'รายการ'],
  ['/categories', 'หมวดหมู่'],
  ['/profile', 'โปรไฟล์'],
]

export default function Layout() {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4">
          <nav className="flex gap-4 flex-1">
            {/* วนสร้างลิงก์เมนูจากรายการ links ด้านบน */}
            {/* NavLink รู้ว่าตอนนี้อยู่หน้าไหน (isActive) จึงทำตัวหนาสีน้ำเงินให้เมนูของหน้านั้น */}
            {/* end เฉพาะหน้าแรก "/" กันไม่ให้ไฮไลต์ติดอยู่ทุกหน้า (เพราะทุก URL ขึ้นต้นด้วย "/") */}
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) =>
                  isActive ? 'font-bold text-blue-600' : 'text-gray-600'}>
                {label}
              </NavLink>
            ))}
          </nav>
          {/* รูปโปรไฟล์ ชื่อ และปุ่มออกจากระบบ ที่มุมขวาบน */}
          <Avatar user={user} size={32} />
          <span className="text-sm">{user.displayName}</span>
          <button onClick={logout} className="text-sm text-gray-500 underline">
            ออกจากระบบ
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4">
        {/* ตรงนี้คือที่ที่เนื้อหาของแต่ละหน้าจะมาแสดง */}
        <Outlet />
      </main>
    </div>
  )
}
