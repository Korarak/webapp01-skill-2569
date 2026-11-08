// ไฟล์นี้: CRUD หมวดหมู่ (สร้าง / อ่าน / แก้ไข / ลบ)
// ทุกเส้นทางผ่านด่าน requireLogin มาแล้ว จึงใช้ req.userId ได้
// กฎสำคัญ: ทุกคำสั่ง SQL มี "user_id = ?" เสมอ เพื่อให้แต่ละคนเห็น/แก้ได้เฉพาะหมวดของตัวเอง

const router = require('express').Router();
const db = require('../db');
const wrap = require('../wrap');

// ตรวจชื่อหมวด: ตัดช่องว่างหัวท้าย ต้องยาว 1-60 ตัวอักษร
// คืนชื่อที่สะอาดแล้ว หรือ null ถ้าไม่ผ่าน
function parseName(body) {
  const name = (body.name || '').trim();
  if (!name || name.length > 60) return null;
  return name;
}

// READ: GET /api/categories  ดูหมวดทั้งหมดของตัวเอง (เรียงตามประเภท แล้วตามชื่อ)
router.get('/', wrap(async (req, res) => {
  const rows = await db.query(
    'SELECT id, name, type FROM categories WHERE user_id = ? ORDER BY type, name',
    [req.userId]);
  res.json(rows);
}));

// CREATE: POST /api/categories  เพิ่มหมวดใหม่
router.post('/', wrap(async (req, res) => {
  const name = parseName(req.body);
  const { type } = req.body;
  if (!name) return res.status(400).json({ error: 'ชื่อหมวดต้องมี 1-60 ตัวอักษร' });
  if (!['income', 'expense'].includes(type))
    return res.status(400).json({ error: 'ประเภทต้องเป็น income หรือ expense' });

  try {
    // user_id ใส่จาก req.userId (token) ไม่ใช่จากที่หน้าเว็บส่งมา
    const r = await db.query(
      'INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)',
      [req.userId, name, type]);
    res.status(201).json({ id: r.insertId, name, type });
  } catch (err) {
    // errno 1062 = ซ้ำ (ตารางกำหนดว่าชื่อหมวดห้ามซ้ำกันในผู้ใช้คนเดียวกัน) → 409
    if (err.errno === 1062)
      return res.status(409).json({ error: 'มีหมวดชื่อนี้แล้ว' });
    throw err;
  }
}));

// UPDATE: PUT /api/categories/:id  เปลี่ยนชื่อหมวด
// เปลี่ยนได้เฉพาะชื่อ ไม่ให้เปลี่ยนประเภท เพราะรายการเก่าที่ใช้หมวดนี้จะไม่ตรงประเภท
router.put('/:id', wrap(async (req, res) => {
  const name = parseName(req.body);
  if (!name) return res.status(400).json({ error: 'ชื่อหมวดต้องมี 1-60 ตัวอักษร' });

  try {
    // WHERE ... AND user_id = ? : ถ้า id นี้เป็นของคนอื่น จะหาแถวไม่เจอ (affectedRows = 0)
    const r = await db.query(
      'UPDATE categories SET name = ? WHERE id = ? AND user_id = ?',
      [name, req.params.id, req.userId]);
    // ตอบ 404 เหมือน "ไม่มีข้อมูลนี้" ไม่บอกว่าเป็นของคนอื่น (กันการเดา id)
    if (!r.affectedRows) return res.status(404).json({ error: 'ไม่พบหมวดหมู่' });
  } catch (err) {
    if (err.errno === 1062)
      return res.status(409).json({ error: 'มีหมวดชื่อนี้แล้ว' });
    throw err;
  }
  res.json({ id: Number(req.params.id), name });
}));

// DELETE: DELETE /api/categories/:id  ลบหมวด (ลบไม่ได้ถ้ายังมีรายการใช้อยู่)
router.delete('/:id', wrap(async (req, res) => {
  // นับรายการที่ใช้หมวดนี้อยู่ก่อน
  const used = await db.query(
    'SELECT COUNT(*) AS n FROM transactions WHERE category_id = ? AND user_id = ?',
    [req.params.id, req.userId]);
  if (used[0].n > 0)
    return res.status(409).json({ error: 'ลบไม่ได้ เพราะยังมีรายการใช้หมวดนี้อยู่' });

  const r = await db.query(
    'DELETE FROM categories WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId]);
  if (!r.affectedRows) return res.status(404).json({ error: 'ไม่พบหมวดหมู่' });
  res.status(204).end(); // 204 = สำเร็จ และไม่มีเนื้อหาส่งกลับ
}));

module.exports = router;
