// ไฟล์นี้: CRUD รายการรายรับ-รายจ่าย พร้อมค้นหา กรอง และแบ่งหน้า
// ทุก SQL มี "user_id = ?" เสมอ เพื่อให้เห็น/แก้ได้เฉพาะรายการของตัวเอง

const router = require('express').Router();
const db = require('../db');
const wrap = require('../wrap');

// วันนี้ตามเวลาไทย รูปแบบ YYYY-MM-DD (ใช้ตรวจว่าวันที่ที่ส่งมาไม่ใช่อนาคต)
// รูปแบบ 'sv-SE' บังเอิญให้ผลเป็น YYYY-MM-DD พอดี
const todayTH = () =>
  new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });

// ตรวจข้อมูลที่ส่งมาตามกฎในเอกสารออกแบบ หัวข้อ 4
// คืน { error: 'ข้อความ' } ถ้าผิด  หรือ { data: {...} } (ข้อมูลที่ทำความสะอาดแล้ว) ถ้าถูก
function parse(body) {
  const { categoryId, type, amount, txnDate } = body;
  const note = (body.note || '').trim();

  if (!['income', 'expense'].includes(type))
    return { error: 'ประเภทต้องเป็น income หรือ expense' };

  // จำนวนเงิน: ต้องเป็นตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง มากกว่า 0 และไม่เกินที่ฐานข้อมูลรับได้
  if (!/^\d+(\.\d{1,2})?$/.test(String(amount)) ||
      Number(amount) <= 0 || Number(amount) > 999999999.99)
    return { error: 'จำนวนเงินต้องมากกว่า 0 ทศนิยมไม่เกิน 2 ตำแหน่ง' };

  // วันที่: รูปแบบ YYYY-MM-DD และเป็นวันที่มีอยู่จริง
  if (!/^\d{4}-\d{2}-\d{2}$/.test(txnDate || '') || isNaN(new Date(txnDate)))
    return { error: 'วันที่ต้องอยู่ในรูปแบบ YYYY-MM-DD' };
  // เทียบเป็นข้อความได้เลย เพราะรูปแบบ YYYY-MM-DD เรียงตามตัวอักษรได้ถูกต้อง
  if (txnDate > todayTH())
    return { error: 'ห้ามใช้วันที่ในอนาคต' };

  if (note.length > 200)
    return { error: 'โน้ตต้องไม่เกิน 200 ตัวอักษร' };
  if (!Number.isInteger(Number(categoryId)))
    return { error: 'กรุณาเลือกหมวดหมู่' };

  return {
    data: {
      categoryId: Number(categoryId),
      type,
      amount: Number(amount),
      txnDate,
      note: note || null, // โน้ตว่างเก็บเป็น NULL
    },
  };
}

// ตรวจว่าหมวดที่เลือก (1) เป็นของผู้ใช้คนนี้ และ (2) ประเภทตรงกับรายการ
// ฐานข้อมูลตรวจเรื่องนี้ให้ไม่ได้ ต้องตรวจเองในโค้ด
// กันกรณีผู้ใช้ A แอบส่ง id หมวดของผู้ใช้ B มา
async function categoryOk(userId, categoryId, type) {
  const rows = await db.query(
    'SELECT 1 FROM categories WHERE id = ? AND user_id = ? AND type = ?',
    [categoryId, userId, type]);
  return rows.length > 0;
}

// READ: GET /api/transactions?from=&to=&categoryId=&q=&page=
// ค้นหา/กรอง/แบ่งหน้า (หน้าละ 20 รายการ)
router.get('/', wrap(async (req, res) => {
  const { from, to, categoryId, q } = req.query;
  // หมายเลขหน้า: ถ้าไม่ส่งมาหรือส่งมาผิด ให้เริ่มที่หน้า 1 (และไม่ต่ำกว่า 1)
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const pageSize = 20;

  // ประกอบเงื่อนไข WHERE ทีละข้อ ตามตัวกรองที่ผู้ใช้เลือก
  // เงื่อนไขแรกคือ user_id เสมอ ส่วนค่าทั้งหมดส่งผ่านเครื่องหมาย ?
  // (ไม่เอาข้อความไปต่อใน SQL ตรง ๆ) เพื่อกัน SQL injection
  const where = ['t.user_id = ?'];
  const params = [req.userId];
  if (from)       { where.push('t.txn_date >= ?');   params.push(from); }       // ตั้งแต่วันที่
  if (to)         { where.push('t.txn_date <= ?');   params.push(to); }         // ถึงวันที่
  if (categoryId) { where.push('t.category_id = ?'); params.push(categoryId); } // เฉพาะหมวดนี้
  if (q)          { where.push('t.note LIKE ?');     params.push(`%${q}%`); }   // โน้ตมีคำที่ค้นหา
  const whereSql = where.join(' AND ');

  // ดึงรายการของหน้านี้ เรียงจากวันที่ใหม่ไปเก่า
  // JOIN categories เพื่อเอาชื่อหมวดมาแสดง
  // LIMIT = จำนวนต่อหน้า, OFFSET = ข้ามไปกี่รายการ (หน้า 2 ข้าม 20 รายการแรก)
  const items = await db.query(
    `SELECT t.id, t.type, t.amount, t.txn_date AS txnDate, t.note,
            t.category_id AS categoryId, c.name AS categoryName
       FROM transactions t JOIN categories c ON c.id = t.category_id
      WHERE ${whereSql}
      ORDER BY t.txn_date DESC, t.id DESC
      LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]);

  // นับจำนวนรายการทั้งหมดที่ตรงเงื่อนไข เพื่อให้หน้าเว็บคำนวณจำนวนหน้า
  const total = await db.query(
    `SELECT COUNT(*) AS n FROM transactions t WHERE ${whereSql}`, params);

  res.json({ items, total: total[0].n, page, pageSize });
}));

// CREATE: POST /api/transactions  เพิ่มรายการ
router.post('/', wrap(async (req, res) => {
  const { error, data } = parse(req.body);
  if (error) return res.status(400).json({ error });
  if (!(await categoryOk(req.userId, data.categoryId, data.type)))
    return res.status(400).json({ error: 'หมวดหมู่ไม่ถูกต้องหรือไม่ตรงกับประเภท' });

  const r = await db.query(
    `INSERT INTO transactions (user_id, category_id, type, amount, txn_date, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.userId, data.categoryId, data.type, data.amount, data.txnDate, data.note]);
  res.status(201).json({ id: r.insertId });
}));

// UPDATE: PUT /api/transactions/:id  แก้ไขรายการ (แก้ได้ทุกช่อง)
router.put('/:id', wrap(async (req, res) => {
  const { error, data } = parse(req.body);
  if (error) return res.status(400).json({ error });
  if (!(await categoryOk(req.userId, data.categoryId, data.type)))
    return res.status(400).json({ error: 'หมวดหมู่ไม่ถูกต้องหรือไม่ตรงกับประเภท' });

  // AND user_id = ? ทำให้แก้ได้เฉพาะรายการของตัวเอง ถ้าเป็นของคนอื่นจะไม่เจอแถว → 404
  const r = await db.query(
    `UPDATE transactions
        SET category_id = ?, type = ?, amount = ?, txn_date = ?, note = ?
      WHERE id = ? AND user_id = ?`,
    [data.categoryId, data.type, data.amount, data.txnDate, data.note,
     req.params.id, req.userId]);
  if (!r.affectedRows) return res.status(404).json({ error: 'ไม่พบรายการ' });
  res.json({ id: Number(req.params.id) });
}));

// DELETE: DELETE /api/transactions/:id  ลบรายการ
router.delete('/:id', wrap(async (req, res) => {
  const r = await db.query(
    'DELETE FROM transactions WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId]);
  if (!r.affectedRows) return res.status(404).json({ error: 'ไม่พบรายการ' });
  res.status(204).end();
}));

module.exports = router;
