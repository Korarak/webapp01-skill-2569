// ไฟล์นี้: จุดเริ่มต้นของ API (รันไฟล์นี้เพื่อเปิดเซิร์ฟเวอร์)
// หน้าที่: ตั้งค่า middleware กลาง แล้วต่อเส้นทาง (route) แต่ละกลุ่มเข้ามา

require('dotenv').config(); // อ่านไฟล์ .env (ถ้ามี) เข้ามาเป็น process.env
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const requireLogin = require('./middleware/auth'); // ด่านตรวจว่าล็อกอินแล้วหรือยัง

const app = express();

// helmet: เพิ่ม HTTP header ด้านความปลอดภัยให้อัตโนมัติ
// ตั้ง crossOriginResourcePolicy เป็น cross-origin เพื่อให้หน้าเว็บ (พอร์ต 5173)
// โหลดรูปโปรไฟล์จาก API (พอร์ต 3000) ได้ ไม่เช่นนั้นเบราว์เซอร์จะบล็อกรูป
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// cors: อนุญาตให้เฉพาะหน้าเว็บที่ http://localhost:5173 เรียก API นี้ได้
app.use(cors({ origin: 'http://localhost:5173' }));

// ให้ Express อ่าน body ที่ส่งมาเป็น JSON แล้วใส่ไว้ใน req.body
app.use(express.json());

// เปิดโฟลเดอร์ uploads ให้เข้าถึงผ่าน URL ได้ เช่น /uploads/avatars/1-123.jpg
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// จำกัดจำนวนครั้งที่สมัคร/เข้าสู่ระบบ: ไม่เกิน 50 ครั้งต่อ 15 นาทีต่อ IP
// ป้องกันคนเดารหัสผ่านรัว ๆ
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });

// ต่อเส้นทางทีละกลุ่ม
// /api/auth (สมัคร/เข้าสู่ระบบ) ไม่ต้องล็อกอิน เพราะเป็นทางเข้าระบบ
app.use('/api/auth', authLimiter, require('./routes/auth'));
// ที่เหลือใส่ requireLogin ไว้หน้า = ต้องล็อกอินก่อนทุกเส้นทาง (กฎสิทธิ์ข้อ 1)
app.use('/api/me', requireLogin, require('./routes/me'));
app.use('/api/categories', requireLogin, require('./routes/categories'));
app.use('/api/transactions', requireLogin, require('./routes/transactions'));
app.use('/api/summary', requireLogin, require('./routes/summary'));

// ตัวจัดการ error กลาง: error ที่ wrap() ส่งมาจะมาจบที่นี่
// บันทึกรายละเอียดไว้ดูในเทอร์มินัล แต่ตอบผู้ใช้แค่ข้อความกลาง ๆ (ไม่เปิดเผยรายละเอียดภายใน)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'เซิร์ฟเวอร์ผิดพลาด' });
});

// เปิดเซิร์ฟเวอร์ที่พอร์ต 3000 (หรือค่าจาก PORT)
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API พร้อมที่พอร์ต ${port}`));
