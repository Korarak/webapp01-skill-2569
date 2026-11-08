// ไฟล์นี้: ฟังก์ชันกลางสำหรับเรียก API ทุกครั้ง
// ข้อดี: แนบ token ให้อัตโนมัติ และจัดการ error ที่เดียว ไม่ต้องเขียน fetch ซ้ำในทุกหน้า

// ที่อยู่ของ API (ตั้งค่าเองได้ด้วย VITE_API_URL ถ้าไม่ตั้งใช้ localhost:3000)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// วิธีใช้:
//   api('/categories')                                   → ดึงข้อมูล (GET)
//   api('/categories', { method: 'POST', body: {...} })  → ส่งข้อมูล
export async function api(path, { method = 'GET', body } = {}) {
  const headers = {}

  // ถ้าเคยล็อกอินไว้ จะมี token เก็บในเบราว์เซอร์ ให้แนบไปกับทุกคำขอ
  const token = localStorage.getItem('token')
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (body instanceof FormData) {
    // ส่งไฟล์ (เช่นรูปโปรไฟล์): ไม่ต้องตั้ง Content-Type เบราว์เซอร์ตั้งให้เอง
    payload = body
  } else if (body !== undefined) {
    // ส่งข้อมูลธรรมดา: แปลง object เป็น JSON
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const res = await fetch(`${API_URL}/api${path}`, { method, headers, body: payload })

  // 204 = สำเร็จแต่ไม่มีข้อมูลส่งกลับ (เช่นหลังลบ) ไม่ต้องอ่าน JSON
  if (res.status === 204) return null

  // อ่านคำตอบเป็น JSON (ถ้าอ่านไม่ได้ ใช้ object ว่างแทน)
  const data = await res.json().catch(() => ({}))

  // ถ้าเซิร์ฟเวอร์ตอบ error (400, 401, 404, 409 ...) ให้โยน error พร้อมข้อความ
  // หน้าที่เรียกใช้จะจับด้วย try/catch แล้วแสดงข้อความนี้ให้ผู้ใช้เห็น
  if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด')
  return data
}
