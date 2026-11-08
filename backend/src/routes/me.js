// ไฟล์นี้: โปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่
// ทำ 5 อย่าง: ดูโปรไฟล์ / แก้ชื่อ / เปลี่ยนรหัสผ่าน / อัปโหลดรูป / ลบรูป
// ใช้ req.userId (จาก token) เสมอ จึงแก้ได้เฉพาะโปรไฟล์ของตัวเอง

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const multer = require('multer'); // ไลบรารีรับไฟล์ที่อัปโหลดมา
const fs = require('fs');
const path = require('path');
const db = require('../db');
const wrap = require('../wrap');
const { toUser } = require('../user');

// ================= ตั้งค่าอัปโหลดรูปโปรไฟล์ =================

// โฟลเดอร์เก็บรูป: backend/uploads/avatars
const AVATAR_DIR = path.join(__dirname, '../../uploads/avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true }); // สร้างโฟลเดอร์ให้ถ้ายังไม่มี

// ชนิดไฟล์ที่รับ → นามสกุลไฟล์ที่ใช้ตอนบันทึก
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: AVATAR_DIR,
    // ตั้งชื่อไฟล์เองเป็น "id ผู้ใช้-เวลา.นามสกุล" ไม่ใช้ชื่อที่ผู้ใช้ส่งมา
    // กันชื่อซ้ำ และกันชื่อไฟล์แปลก ๆ ที่อาจเป็นอันตราย
    filename: (req, file, cb) =>
      cb(null, `${req.userId}-${Date.now()}${EXT[file.mimetype]}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // ขนาดไม่เกิน 2 MB
  // รับเฉพาะ jpg/png/webp ถ้าชนิดอื่นให้ปฏิเสธ
  fileFilter: (req, file, cb) =>
    EXT[file.mimetype] ? cb(null, true) : cb(new Error('TYPE')),
});

// ลบไฟล์รูปเก่าออกจากเครื่อง (ถ้ามี) ไม่ให้ไฟล์เก่าค้างสะสม
async function removeFile(avatarUrl) {
  if (!avatarUrl) return;
  await fs.promises
    // path.basename เอาเฉพาะชื่อไฟล์ กันการแอบใส่ path ย้อนโฟลเดอร์
    .unlink(path.join(AVATAR_DIR, path.basename(avatarUrl)))
    .catch(() => {}); // ถ้าลบไม่ได้ (เช่นไฟล์หายไปแล้ว) ก็ข้ามไป ไม่ต้องแจ้ง error
}

// ================= เส้นทาง =================

// GET /api/me  ดูโปรไฟล์ตัวเอง (หน้าเว็บเรียกตอนเปิดเว็บเพื่อรู้ว่าใครล็อกอินอยู่)
router.get('/', wrap(async (req, res) => {
  const rows = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
  res.json(toUser(rows[0]));
}));

// PATCH /api/me  แก้ชื่อที่แสดง
router.patch('/', wrap(async (req, res) => {
  const displayName = (req.body.displayName || '').trim();
  if (!displayName || displayName.length > 100)
    return res.status(400).json({ error: 'ชื่อต้องมี 1-100 ตัวอักษร' });
  await db.query('UPDATE users SET display_name = ? WHERE id = ?',
    [displayName, req.userId]);
  const rows = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
  res.json(toUser(rows[0]));
}));

// PATCH /api/me/password  เปลี่ยนรหัสผ่าน (ต้องส่งรหัสเดิมมายืนยันด้วย)
router.patch('/password', wrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8)
    return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร' });

  // เทียบรหัสเดิมกับ hash ที่เก็บไว้ กันคนอื่นมาเปลี่ยนรหัสตอนเราลืมออกจากระบบ
  const rows = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.userId]);
  if (!(await bcrypt.compare(currentPassword || '', rows[0].password_hash)))
    return res.status(400).json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' });

  await db.query('UPDATE users SET password_hash = ? WHERE id = ?',
    [await bcrypt.hash(newPassword, 10), req.userId]);
  res.status(204).end();
}));

// POST /api/me/avatar  อัปโหลด/เปลี่ยนรูปโปรไฟล์ (ฟิลด์ไฟล์ชื่อ "avatar")
// ครอบ multer ไว้เอง เพื่อจับ error แล้วตอบเป็นข้อความภาษาไทย
router.post('/avatar', (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      // ไฟล์ใหญ่เกิน หรือชนิดไฟล์ไม่รับ → ตอบ 400 พร้อมสาเหตุ
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? 'ไฟล์ใหญ่เกิน 2 MB'
        : 'รับเฉพาะไฟล์ jpg, png, webp';
      return res.status(400).json({ error: msg });
    }
    next(); // อัปโหลดผ่าน ไปทำขั้นถัดไป
  });
}, wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'กรุณาเลือกไฟล์รูป' });

  // จำที่อยู่รูปเก่าไว้ก่อน เพื่อลบทิ้งหลังบันทึกรูปใหม่สำเร็จ
  const old = await db.query('SELECT avatar_url FROM users WHERE id = ?', [req.userId]);
  const url = `/uploads/avatars/${req.file.filename}`;
  await db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [url, req.userId]);
  await removeFile(old[0].avatar_url); // ลบรูปเก่า (ผู้ใช้ 1 คนมีรูปได้ 1 รูป)

  const rows = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
  res.json(toUser(rows[0]));
}));

// DELETE /api/me/avatar  ลบรูปโปรไฟล์ กลับไปใช้รูปเริ่มต้น
router.delete('/avatar', wrap(async (req, res) => {
  const old = await db.query('SELECT avatar_url FROM users WHERE id = ?', [req.userId]);
  await db.query('UPDATE users SET avatar_url = NULL WHERE id = ?', [req.userId]);
  await removeFile(old[0].avatar_url);
  res.status(204).end();
}));

module.exports = router;
