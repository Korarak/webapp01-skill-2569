// ไฟล์นี้: ฟังก์ชันช่วยจัดรูปแบบข้อมูลที่แสดงบนหน้าเว็บ

// วันนี้ตามเวลาในเครื่องผู้ใช้ รูปแบบ YYYY-MM-DD เช่น "2026-11-08"
// (รูปแบบ 'sv-SE' บังเอิญให้ผลเป็น YYYY-MM-DD พอดี)
export const today = () => new Date().toLocaleDateString('sv-SE')

// จัดตัวเลขเป็นรูปเงินบาท มีจุลภาคคั่นหลักพัน และทศนิยม 2 ตำแหน่งเสมอ
// เช่น 1234.5 → "1,234.50"
export const money = (n) =>
  Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
