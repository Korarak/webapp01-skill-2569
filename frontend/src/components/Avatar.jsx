// คอมโพเนนต์: แสดงรูปโปรไฟล์ของผู้ใช้
// ถ้ามีรูป แสดงรูปทรงกลม ถ้ายังไม่มีรูป แสดงไอคอนคนบนพื้นสีเทาแทน
// วิธีใช้: <Avatar user={user} size={32} />  (size คือขนาดเป็นพิกเซล ค่าเริ่มต้น 64)

import { User } from 'lucide-react' // ไอคอนรูปคน
import { API_URL } from '../api'

export default function Avatar({ user, size = 64 }) {
  const style = { width: size, height: size }

  if (user?.avatarUrl) {
    // avatarUrl ที่ได้จาก API เป็นแค่ path เช่น /uploads/avatars/1-123.jpg
    // ต้องเติมที่อยู่ API ข้างหน้า รูปจึงจะโหลดมาจากเซิร์ฟเวอร์ถูกที่
    return (
      <img src={API_URL + user.avatarUrl} alt="รูปโปรไฟล์" style={style}
           className="rounded-full object-cover" />
    )
  }

  // ยังไม่มีรูป: แสดงวงกลมสีเทามีไอคอนคนอยู่ตรงกลาง
  return (
    <div style={style}
         className="rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
      <User size={size / 2} />
    </div>
  )
}
