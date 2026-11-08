// หน้า: จัดการหมวดหมู่ (ดู / เพิ่ม / เปลี่ยนชื่อ / ลบ)

import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Categories() {
  const [items, setItems] = useState([])   // รายการหมวดทั้งหมดที่ได้จากเซิร์ฟเวอร์
  const [name, setName] = useState('')     // ช่องกรอกชื่อหมวดใหม่
  const [type, setType] = useState('expense') // ประเภทของหมวดใหม่ (ค่าเริ่มต้น รายจ่าย)
  const [error, setError] = useState('')   // ข้อความ error ใต้ฟอร์มเพิ่มหมวด

  // โหลดรายการหมวดจากเซิร์ฟเวอร์มาเก็บใน items
  const load = () => api('/categories').then(setItems)
  // โหลดครั้งเดียวตอนเปิดหน้า ([] = ไม่โหลดซ้ำอีก)
  useEffect(() => { load() }, [])

  // เพิ่มหมวดใหม่
  async function add(e) {
    e.preventDefault()
    setError('')
    try {
      await api('/categories', { method: 'POST', body: { name, type } })
      setName('') // เพิ่มสำเร็จ ล้างช่องกรอก
      load()      // โหลดรายการใหม่ให้เห็นหมวดที่เพิ่งเพิ่ม
    } catch (err) { setError(err.message) } // เช่น "มีหมวดชื่อนี้แล้ว"
  }

  // เปลี่ยนชื่อหมวด: prompt คือกล่องรับข้อความของเบราว์เซอร์ (ค่าเริ่มต้นเป็นชื่อเดิม)
  async function rename(c) {
    const newName = prompt('ชื่อหมวดใหม่', c.name)
    if (!newName || newName === c.name) return // กดยกเลิก หรือไม่ได้เปลี่ยนอะไร ก็ไม่ทำอะไร
    try {
      await api(`/categories/${c.id}`, { method: 'PUT', body: { name: newName } })
      load()
    } catch (err) { alert(err.message) }
  }

  // ลบหมวด: confirm ถามยืนยันก่อนลบเสมอ
  async function remove(c) {
    if (!confirm(`ลบหมวด "${c.name}" ใช่หรือไม่?`)) return
    try {
      await api(`/categories/${c.id}`, { method: 'DELETE' })
      load()
    } catch (err) { alert(err.message) } // เช่น ลบไม่ได้เพราะยังมีรายการใช้หมวดนี้อยู่
  }

  // สร้างกล่องแสดงหมวดของประเภทหนึ่ง (t = 'expense' หรือ 'income')
  // เรียกใช้ 2 ครั้งด้านล่าง ได้กล่องรายจ่ายและกล่องรายรับ โดยไม่ต้องเขียนโค้ดซ้ำ
  const group = (t, title, color) => (
    <section className="bg-white rounded-lg shadow p-4">
      <h2 className={`font-bold mb-2 ${color}`}>{title}</h2>
      <ul className="divide-y">
        {/* เลือกเฉพาะหมวดที่เป็นประเภทนี้ แล้ววนแสดงทีละหมวด */}
        {items.filter((c) => c.type === t).map((c) => (
          <li key={c.id} className="py-2 flex items-center gap-3">
            <span className="flex-1">{c.name}</span>
            <button onClick={() => rename(c)} className="text-sm text-blue-600">แก้ไข</button>
            <button onClick={() => remove(c)} className="text-sm text-red-600">ลบ</button>
          </li>
        ))}
      </ul>
    </section>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">หมวดหมู่</h1>

      {/* ฟอร์มเพิ่มหมวดใหม่ */}
      <form onSubmit={add} className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-2">
        <input className="border rounded px-3 py-2 flex-1 min-w-40" placeholder="ชื่อหมวดใหม่"
               value={name} onChange={(e) => setName(e.target.value)} />
        <select className="border rounded px-3 py-2" value={type}
                onChange={(e) => setType(e.target.value)}>
          <option value="expense">รายจ่าย</option>
          <option value="income">รายรับ</option>
        </select>
        <button className="bg-blue-600 text-white rounded px-4 py-2">เพิ่ม</button>
        {error && <p className="w-full text-red-600 text-sm">{error}</p>}
      </form>

      {/* กล่องรายจ่ายกับรายรับ วางเคียงกันบนจอใหญ่ เรียงบนล่างบนมือถือ */}
      <div className="grid gap-4 sm:grid-cols-2">
        {group('expense', 'รายจ่าย', 'text-red-600')}
        {group('income', 'รายรับ', 'text-green-600')}
      </div>
    </div>
  )
}
