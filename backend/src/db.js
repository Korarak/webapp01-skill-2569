// ไฟล์นี้: สร้าง "ตัวเชื่อมต่อฐานข้อมูล" (pool) ไว้ให้ไฟล์อื่นเรียกใช้ร่วมกัน
// pool = กลุ่มการเชื่อมต่อที่เปิดค้างไว้ ใช้ซ้ำได้ ไม่ต้องเปิดใหม่ทุกครั้งที่ query จึงเร็วกว่า

const mariadb = require('mariadb');

const pool = mariadb.createPool({
  // ค่าต่อไปนี้อ่านจาก environment ซึ่งตั้งไว้ใน docker-compose.yml
  host: process.env.DB_HOST,         // ชื่อเครื่องฐานข้อมูล (ใน Docker คือชื่อ service "db")
  user: process.env.DB_USER,         // ชื่อผู้ใช้ฐานข้อมูล
  password: process.env.DB_PASSWORD, // รหัสผ่านฐานข้อมูล
  database: process.env.DB_NAME,     // ชื่อฐานข้อมูลที่จะใช้ (expense_tracker)
  connectionLimit: 5,                // เปิดการเชื่อมต่อพร้อมกันได้สูงสุด 5 ช่อง

  // 4 ตัวเลือกด้านล่างช่วยให้ข้อมูลที่ได้จากฐานข้อมูลใช้งานง่าย:
  bigIntAsNumber: true,   // ตัวเลข BIGINT (เช่น id) ให้เป็น number ปกติ ไม่ใช่ BigInt
  insertIdAsNumber: true, // id ที่เพิ่ง INSERT ให้เป็น number
  decimalAsNumber: true,  // ตัวเลขทศนิยม (เช่น amount) ให้เป็น number ไม่ใช่ string
  dateStrings: true,      // วันที่ให้เป็นข้อความ "2026-11-07" ไม่แปลงเป็น Date (กันวันเพี้ยนเพราะ timezone)
});

module.exports = pool; // ส่งออกให้ไฟล์อื่นใช้ด้วย require('../db')
