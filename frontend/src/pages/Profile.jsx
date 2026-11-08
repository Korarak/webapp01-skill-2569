// หน้า: โปรไฟล์ (เปลี่ยนรูป / แก้ชื่อ / เปลี่ยนรหัสผ่าน)
// แบ่งเป็น 3 กล่อง แต่ละกล่องมี state และข้อความแจ้งผลของตัวเอง

import { useRef, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import Avatar from '../components/Avatar'

export default function Profile() {
  const { user, setUser } = useAuth() // setUser ใช้อัปเดตข้อมูลผู้ใช้ให้แถบเมนูเปลี่ยนตามทันที
  const fileRef = useRef()            // อ้างถึงช่องเลือกไฟล์ เพื่อล้างค่าหลังอัปโหลด

  // --- กล่องแก้ชื่อ ---
  const [name, setName] = useState(user.displayName)
  const [nameMsg, setNameMsg] = useState('')

  // --- กล่องเปลี่ยนรหัสผ่าน ---
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' })
  const [pwMsg, setPwMsg] = useState('')

  // --- กล่องรูปโปรไฟล์ ---
  const [preview, setPreview] = useState(null) // ที่อยู่รูปตัวอย่าง (ยังไม่ได้อัปโหลดจริง)
  const [file, setFile] = useState(null)       // ไฟล์ที่เลือกไว้ รอกดอัปโหลด
  const [avatarMsg, setAvatarMsg] = useState('')

  // ผู้ใช้เลือกไฟล์: เก็บไฟล์ไว้ และสร้างรูปตัวอย่างให้ดูก่อนอัปโหลดจริง
  function pickFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f)) // สร้างที่อยู่ชั่วคราวในเบราว์เซอร์สำหรับแสดงรูปตัวอย่าง
    setAvatarMsg('')
  }

  // กดอัปโหลด: ส่งไฟล์ไปเซิร์ฟเวอร์ด้วย FormData
  async function uploadAvatar() {
    const body = new FormData()
    body.append('avatar', file) // ชื่อ 'avatar' ต้องตรงกับ upload.single('avatar') ใน backend
    try {
      setUser(await api('/me/avatar', { method: 'POST', body })) // ได้ข้อมูลผู้ใช้ใหม่ที่มีรูปแล้ว
      setFile(null); setPreview(null); fileRef.current.value = '' // ล้างสถานะการเลือกไฟล์
      setAvatarMsg('เปลี่ยนรูปแล้ว')
    } catch (err) { setAvatarMsg(err.message) } // เช่น ไฟล์ใหญ่เกิน หรือชนิดไฟล์ไม่รับ
  }

  // ลบรูปโปรไฟล์ (ถามยืนยันก่อน)
  async function removeAvatar() {
    if (!confirm('ลบรูปโปรไฟล์ใช่หรือไม่?')) return
    await api('/me/avatar', { method: 'DELETE' })
    setUser({ ...user, avatarUrl: null }) // อัปเดตหน้าเว็บให้กลับไปใช้ไอคอนเริ่มต้น
    setAvatarMsg('ลบรูปแล้ว')
  }

  // บันทึกชื่อใหม่
  async function saveName(e) {
    e.preventDefault()
    try {
      setUser(await api('/me', { method: 'PATCH', body: { displayName: name } }))
      setNameMsg('บันทึกแล้ว')
    } catch (err) { setNameMsg(err.message) }
  }

  // เปลี่ยนรหัสผ่าน (ส่งทั้งรหัสเดิมและรหัสใหม่)
  async function savePassword(e) {
    e.preventDefault()
    try {
      await api('/me/password', { method: 'PATCH', body: pw })
      setPw({ currentPassword: '', newPassword: '' }) // สำเร็จแล้วล้างช่องรหัสผ่านทิ้ง
      setPwMsg('เปลี่ยนรหัสผ่านแล้ว')
    } catch (err) { setPwMsg(err.message) } // เช่น รหัสเดิมไม่ถูกต้อง
  }

  const box = 'bg-white rounded-lg shadow p-4 space-y-3' // หน้าตากล่อง ใช้ซ้ำทั้ง 3 กล่อง
  const input = 'border rounded px-3 py-2 w-full'

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-xl font-bold">โปรไฟล์</h1>

      {/* กล่องที่ 1: รูปโปรไฟล์ */}
      <section className={box}>
        <h2 className="font-bold">รูปโปรไฟล์</h2>
        <div className="flex items-center gap-4">
          {/* มีรูปตัวอย่าง (เพิ่งเลือกไฟล์) แสดงรูปตัวอย่าง ไม่งั้นแสดงรูปปัจจุบัน */}
          {preview
            ? <img src={preview} alt="ตัวอย่าง" className="w-24 h-24 rounded-full object-cover" />
            : <Avatar user={user} size={96} />}
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                   onChange={pickFile} className="text-sm" />
            <div className="flex gap-2">
              {/* ปุ่มอัปโหลดกดไม่ได้จนกว่าจะเลือกไฟล์ */}
              <button onClick={uploadAvatar} disabled={!file}
                      className="bg-blue-600 text-white rounded px-3 py-1 disabled:opacity-40">อัปโหลด</button>
              {/* ปุ่มลบรูป โชว์เฉพาะตอนมีรูปอยู่แล้ว */}
              {user.avatarUrl && (
                <button onClick={removeAvatar} className="border rounded px-3 py-1 text-red-600">ลบรูป</button>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500">รับ jpg, png, webp ขนาดไม่เกิน 2 MB</p>
        {avatarMsg && <p className="text-sm text-blue-600">{avatarMsg}</p>}
      </section>

      {/* กล่องที่ 2: ชื่อที่แสดง */}
      <form onSubmit={saveName} className={box}>
        <h2 className="font-bold">ชื่อที่แสดง</h2>
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
        <button className="bg-blue-600 text-white rounded px-4 py-2">บันทึก</button>
        {nameMsg && <p className="text-sm text-blue-600">{nameMsg}</p>}
      </form>

      {/* กล่องที่ 3: เปลี่ยนรหัสผ่าน */}
      <form onSubmit={savePassword} className={box}>
        <h2 className="font-bold">เปลี่ยนรหัสผ่าน</h2>
        <input className={input} type="password" placeholder="รหัสผ่านเดิม"
               value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
        <input className={input} type="password" placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)"
               value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
        <button className="bg-blue-600 text-white rounded px-4 py-2">เปลี่ยนรหัสผ่าน</button>
        {pwMsg && <p className="text-sm text-blue-600">{pwMsg}</p>}
      </form>
    </div>
  )
}
