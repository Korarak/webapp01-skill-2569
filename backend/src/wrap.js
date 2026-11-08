// ไฟล์นี้: ตัวห่อ (wrapper) ฟังก์ชัน async ของ route
//
// ปัญหา: Express เวอร์ชัน 4 ไม่รู้จักจับ error ที่เกิดในฟังก์ชัน async
//        ถ้า query ฐานข้อมูลพัง เซิร์ฟเวอร์จะค้าง ไม่ตอบอะไรกลับไปเลย
// วิธีแก้: ห่อฟังก์ชันด้วย wrap() แล้ว .catch(next) จะส่ง error ไปให้
//         ตัวจัดการ error กลางใน server.js ตอบ 500 ให้แทน
//
// วิธีใช้: router.get('/', wrap(async (req, res) => { ... }))
module.exports = (fn) => (req, res, next) => fn(req, res, next).catch(next);
