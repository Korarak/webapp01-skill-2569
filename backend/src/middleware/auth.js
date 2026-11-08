// ไฟล์นี้: "ด่านตรวจล็อกอิน" (middleware)
// ทุกคำขอที่ผ่านด่านนี้ต้องแนบ token มา ถ้าไม่มีหรือไม่ถูกต้อง จะตอบ 401 และไม่ไปต่อ
// ถ้าผ่าน จะใส่ req.userId ให้ route ถัดไปใช้งาน

const jwt = require('jsonwebtoken');
const db = require('../db');

module.exports = async function requireLogin(req, res, next) {
  // หน้าเว็บส่ง token มาใน header แบบ  Authorization: Bearer <token>
  // ตัดคำว่า "Bearer " ออก เหลือแต่ตัว token
  const token = (req.headers.authorization || '').replace('Bearer ', '');

  let id;
  try {
    // ตรวจลายเซ็น token ด้วย JWT_SECRET (ถ้าถูกแก้ไข หรือหมดอายุ จะ throw error)
    // แล้วดึง id ของผู้ใช้ที่เซิร์ฟเวอร์เคยฝังไว้ตอนออก token
    id = jwt.verify(token, process.env.JWT_SECRET).id;
  } catch {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
  }

  try {
    // เช็กซ้ำว่าผู้ใช้คนนี้ยังมีอยู่ในฐานข้อมูล (เผื่อบัญชีถูกลบไปแล้ว แต่ token ยังไม่หมดอายุ)
    const rows = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (!rows[0]) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
  } catch (err) {
    // ฐานข้อมูลมีปัญหา ส่งให้ตัวจัดการ error กลางใน server.js (ตอบ 500)
    return next(err);
  }

  // สำคัญ: เก็บ id จาก token ไว้ใน req.userId
  // ทุก route หลังจากนี้ต้องใช้ req.userId นี้เท่านั้น ห้ามเชื่อ user_id ที่หน้าเว็บส่งมาเอง
  // เพราะ token เซ็นโดยเซิร์ฟเวอร์ ปลอมไม่ได้ แต่ค่าจากหน้าเว็บใครจะแก้ก็ได้
  req.userId = id;
  next(); // ผ่านด่านแล้ว ไปที่ route ต่อไป
};
