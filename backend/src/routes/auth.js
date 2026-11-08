// ไฟล์นี้: สมัครสมาชิก (register) และเข้าสู่ระบบ (login)
// สองเส้นทางนี้เป็นเส้นทางเดียวที่ไม่ต้องล็อกอินก่อน

const router = require('express').Router();
const bcrypt = require('bcryptjs');   // เข้ารหัสผ่านแบบเข้ารหัสทางเดียว (เก็บเป็น hash)
const jwt = require('jsonwebtoken');  // สร้าง token ยืนยันตัวตน
const db = require('../db');
const wrap = require('../wrap');
const { toUser } = require('../user');

// สร้าง token ที่ฝัง id ผู้ใช้ไว้ในนั้น มีอายุ 7 วัน เซ็นลายเซ็นด้วย JWT_SECRET
const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// หมวดหมู่เริ่มต้นที่สร้างให้ผู้ใช้ทุกคนตอนสมัคร (ชื่อ, ประเภท)
const DEFAULT_CATEGORIES = [
  ['เงินเดือน', 'income'],
  ['รายได้อื่น ๆ', 'income'],
  ['อาหาร', 'expense'],
  ['เดินทาง', 'expense'],
  ['ที่พัก', 'expense'],
  ['ช้อปปิ้ง', 'expense'],
  ['อื่น ๆ', 'expense'],
];

// POST /api/auth/register  สมัครสมาชิก
router.post('/register', wrap(async (req, res) => {
  const { email, password, displayName } = req.body;

  // ---- ตรวจข้อมูลที่ส่งมา ถ้าผิดตอบ 400 (ข้อมูลไม่ถูกต้อง) ----
  // regex นี้เช็กว่ามีรูปแบบ xxx@yyy.zzz และไม่มีช่องว่าง
  if (!/^\S+@\S+\.\S+$/.test(email || ''))
    return res.status(400).json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' });
  if (!password || password.length < 8)
    return res.status(400).json({ error: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' });
  if (!displayName || !displayName.trim() || displayName.length > 100)
    return res.status(400).json({ error: 'กรุณากรอกชื่อที่แสดง (ไม่เกิน 100 ตัวอักษร)' });

  // เข้ารหัสผ่านก่อนเก็บ (ฐานข้อมูลไม่เคยเก็บรหัสผ่านจริง) เลข 10 คือความ "หนัก" ของการเข้ารหัส
  const hash = await bcrypt.hash(password, 10);

  let userId;
  try {
    // อีเมลเก็บเป็นตัวพิมพ์เล็กเสมอ กัน A@x.com กับ a@x.com ถูกมองเป็นคนละคน
    const r = await db.query(
      'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)',
      [email.toLowerCase(), hash, displayName.trim()]);
    userId = r.insertId; // id ของผู้ใช้ที่เพิ่งสร้าง
  } catch (err) {
    // errno 1062 = ข้อมูลซ้ำกับคอลัมน์ที่ห้ามซ้ำ (email เป็น UNIQUE) → ตอบ 409
    if (err.errno === 1062)
      return res.status(409).json({ error: 'อีเมลนี้ถูกใช้แล้ว' });
    throw err; // error อื่น ปล่อยให้ตัวจัดการกลางตอบ 500
  }

  // สร้างหมวดเริ่มต้นให้ผู้ใช้คนใหม่ ทีละหมวด
  for (const [name, type] of DEFAULT_CATEGORIES) {
    await db.query(
      'INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)',
      [userId, name, type]);
  }

  // ดึงข้อมูลผู้ใช้กลับมา แล้วส่ง token + ข้อมูลผู้ใช้ให้หน้าเว็บ (สมัครเสร็จล็อกอินให้เลย)
  const rows = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
  res.status(201).json({ token: sign(userId), user: toUser(rows[0]) });
}));

// POST /api/auth/login  เข้าสู่ระบบ
router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;

  const rows = await db.query(
    'SELECT * FROM users WHERE email = ?', [(email || '').toLowerCase()]);
  const user = rows[0];

  // เทียบรหัสผ่านที่กรอกกับ hash ในฐานข้อมูล
  // ตอบข้อความเดียวกันทั้ง "ไม่มีอีเมลนี้" และ "รหัสผิด" เพื่อไม่ให้ผู้โจมตีรู้ว่าอีเมลไหนมีในระบบ
  if (!user || !(await bcrypt.compare(password || '', user.password_hash)))
    return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

  res.json({ token: sign(user.id), user: toUser(user) });
}));

module.exports = router;
