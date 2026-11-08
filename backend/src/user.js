// ไฟล์นี้: แปลงข้อมูลผู้ใช้จากฐานข้อมูล ให้เป็นรูปแบบที่ส่งกลับไปให้หน้าเว็บ
//
// ทำ 2 อย่าง:
//  1) เปลี่ยนชื่อฟิลด์จากแบบฐานข้อมูล (display_name) เป็นแบบ JavaScript (displayName)
//  2) เลือกส่งเฉพาะฟิลด์ที่ปลอดภัย โดยไม่ส่ง password_hash ออกไปเด็ดขาด
function toUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url, // ที่อยู่รูปโปรไฟล์ (null ถ้ายังไม่มีรูป)
  };
}

module.exports = { toUser };
