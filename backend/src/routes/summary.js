// ไฟล์นี้: สรุปรายเดือน (รายรับรวม รายจ่ายรวม คงเหลือ และรายจ่ายแยกตามหมวด)
// ยอดคงเหลือ "ไม่เก็บ" ในฐานข้อมูล แต่คำนวณจากรายการทุกครั้งที่เรียก
// จึงตรงกับรายการจริงเสมอ ไม่มีวันเพี้ยน

const router = require('express').Router();
const db = require('../db');
const wrap = require('../wrap');

// GET /api/summary?month=2026-11
router.get('/', wrap(async (req, res) => {
  const month = req.query.month;
  // ต้องเป็นรูปแบบ YYYY-MM และเดือนอยู่ระหว่าง 01-12
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || ''))
    return res.status(400).json({ error: 'month ต้องอยู่ในรูปแบบ YYYY-MM' });

  // วันที่ 1 ของเดือนที่เลือก เช่น "2026-11-01"
  const start = `${month}-01`;

  // เงื่อนไข: ของผู้ใช้คนนี้ ตั้งแต่วันที่ 1 ของเดือน จนถึงก่อนวันที่ 1 ของเดือนถัดไป
  // (ใช้ "< วันที่ 1 เดือนถัดไป" แทน "<= สิ้นเดือน" เพราะไม่ต้องสนว่าเดือนมี 28/30/31 วัน)
  const range = 'user_id = ? AND txn_date >= ? AND txn_date < DATE_ADD(?, INTERVAL 1 MONTH)';

  // รวมยอดรายรับและรายจ่ายในคำสั่งเดียว
  // SUM(CASE WHEN ...) = บวกเฉพาะแถวที่เป็นประเภทนั้น
  // COALESCE(..., 0) = ถ้าเดือนนั้นไม่มีรายการเลย SUM จะได้ NULL ให้แทนด้วย 0
  const totals = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
     FROM transactions WHERE ${range}`,
    [req.userId, start, start]);

  // รายจ่ายแยกตามหมวด เรียงจากมากไปน้อย (ใช้แสดงแท่งกราฟในหน้าสรุป)
  const byCategory = await db.query(
    `SELECT c.name, SUM(t.amount) AS total
       FROM transactions t JOIN categories c ON c.id = t.category_id
      WHERE t.type = 'expense'
        AND t.user_id = ?
        AND t.txn_date >= ?
        AND t.txn_date < DATE_ADD(?, INTERVAL 1 MONTH)
      GROUP BY c.id, c.name
      ORDER BY total DESC`,
    [req.userId, start, start]);

  const { income, expense } = totals[0];
  // คงเหลือ = รายรับ - รายจ่าย
  res.json({ income, expense, balance: income - expense, byCategory });
}));

module.exports = router;
