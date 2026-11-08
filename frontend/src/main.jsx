// ไฟล์นี้: จุดเริ่มต้นของหน้าเว็บ React
// หน้าที่: เอา <App /> ไปแสดงใน <div id="root"> ของไฟล์ index.html

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // โหลด CSS (Tailwind) ให้ใช้ได้ทั้งแอป
import App from './App.jsx'

// StrictMode: โหมดช่วยตรวจหาข้อผิดพลาดตอนพัฒนา (ไม่มีผลกับหน้าตา)
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
