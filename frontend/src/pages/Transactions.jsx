// หน้า: รายการรายรับ-รายจ่าย (หน้าหลักของระบบ)
// ทำได้: ดูรายการ / ค้นหา / กรอง / แบ่งหน้า / เพิ่ม / แก้ไข / ลบ

import { useEffect, useState } from 'react'
import { api } from '../api'
import { money, today } from '../format'

// ค่าเริ่มต้นของฟอร์มเพิ่มรายการ: รายจ่าย วันนี้ ช่องอื่นว่าง
const emptyForm = () => ({ type: 'expense', categoryId: '', amount: '', txnDate: today(), note: '' })

export default function Transactions() {
  const [categories, setCategories] = useState([]) // หมวดทั้งหมด (ใช้ในฟอร์มและตัวกรอง)
  const [list, setList] = useState({ items: [], total: 0, page: 1, pageSize: 20 }) // รายการที่ได้จากเซิร์ฟเวอร์
  const [filters, setFilters] = useState({ from: '', to: '', categoryId: '', q: '' }) // ตัวกรองที่ผู้ใช้เลือก
  const [page, setPage] = useState(1)       // หน้าปัจจุบัน
  const [form, setForm] = useState(null)    // null = ปิดฟอร์ม / เป็น object = เปิดฟอร์มและเก็บค่าที่กรอก
  const [editingId, setEditingId] = useState(null) // null = กำลังเพิ่มใหม่ / มีเลข = กำลังแก้รายการนั้น
  const [error, setError] = useState('')    // ข้อความ error ในฟอร์ม

  // โหลดหมวดครั้งเดียวตอนเปิดหน้า
  useEffect(() => { api('/categories').then(setCategories) }, [])

  // โหลดรายการตามตัวกรองและหน้าปัจจุบัน
  function load() {
    const params = new URLSearchParams({ page })
    // ใส่เฉพาะตัวกรองที่ไม่ว่างลงใน URL เช่น ?page=1&q=ข้าว
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v))
    api(`/transactions?${params}`).then(setList)
  }
  // โหลดใหม่อัตโนมัติทุกครั้งที่ "เปลี่ยนหน้า" หรือ "เปลี่ยนตัวกรอง"
  useEffect(load, [page, filters]) // eslint-disable-line react-hooks/exhaustive-deps

  // เปลี่ยนตัวกรอง: กลับไปหน้า 1 ด้วย เพราะผลลัพธ์เปลี่ยน หน้าเดิมอาจไม่มีอยู่แล้ว
  const setFilter = (key) => (e) => { setPage(1); setFilters({ ...filters, [key]: e.target.value }) }
  // อัปเดตช่องในฟอร์มเพิ่ม/แก้ไข
  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  // กดปุ่ม "เพิ่มรายการ": เปิดฟอร์มเปล่า
  function openAdd() { setEditingId(null); setForm(emptyForm()); setError('') }
  // กดปุ่ม "แก้ไข": เปิดฟอร์มพร้อมใส่ค่าเดิมของรายการนั้น
  function openEdit(t) {
    setEditingId(t.id)
    setForm({ type: t.type, categoryId: t.categoryId, amount: t.amount, txnDate: t.txnDate, note: t.note || '' })
    setError('')
  }

  // บันทึก (ใช้ฟอร์มเดียวกันทั้งเพิ่มและแก้ไข)
  async function save(e) {
    e.preventDefault()
    setError('')
    try {
      // ถ้ามี editingId = แก้ไข (PUT ไปที่รายการนั้น) ถ้าไม่มี = เพิ่มใหม่ (POST)
      await api(editingId ? `/transactions/${editingId}` : '/transactions', {
        method: editingId ? 'PUT' : 'POST', body: form,
      })
      setForm(null) // สำเร็จ ปิดฟอร์ม
      load()        // โหลดรายการใหม่
    } catch (err) { setError(err.message) } // ผิด: ฟอร์มยังเปิดอยู่ ค่าที่กรอกไม่หาย
  }

  // ลบรายการ: ถามยืนยันก่อน โดยแสดงรายละเอียดให้ผู้ใช้เห็นว่ากำลังจะลบอะไร
  async function remove(t) {
    if (!confirm(`ลบรายการ "${t.categoryName} ${money(t.amount)} บาท" วันที่ ${t.txnDate} ใช่หรือไม่?`)) return
    await api(`/transactions/${t.id}`, { method: 'DELETE' })
    load()
  }

  // ในฟอร์ม แสดงเฉพาะหมวดที่ประเภทตรงกับที่เลือก (รายจ่ายเห็นแต่หมวดรายจ่าย)
  const formCategories = categories.filter((c) => c.type === form?.type)
  // จำนวนหน้าทั้งหมด = ปัดขึ้นของ (จำนวนรายการ ÷ รายการต่อหน้า) อย่างน้อย 1 หน้า
  const lastPage = Math.max(Math.ceil(list.total / list.pageSize), 1)
  const field = 'border rounded px-3 py-2' // คลาสหน้าตาช่องกรอก ใช้ซ้ำ

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <h1 className="text-xl font-bold flex-1">รายการรายรับ-รายจ่าย</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white rounded px-4 py-2">+ เพิ่มรายการ</button>
      </div>

      {/* ฟอร์มเพิ่ม/แก้ไข: แสดงเฉพาะตอน form ไม่ใช่ null */}
      {form && (
        <form onSubmit={save} className="bg-white rounded-lg shadow p-4 grid gap-3 sm:grid-cols-2">
          {/* เปลี่ยนประเภทแล้วต้องล้างหมวดที่เลือกไว้ เพราะหมวดเก่าอาจเป็นคนละประเภท */}
          <select className={field} value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value, categoryId: '' })}>
            <option value="expense">รายจ่าย</option>
            <option value="income">รายรับ</option>
          </select>
          <select className={field} value={form.categoryId} onChange={setField('categoryId')}>
            <option value="">-- เลือกหมวดหมู่ --</option>
            {formCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className={field} type="number" step="0.01" min="0" placeholder="จำนวนเงิน (บาท)"
                 value={form.amount} onChange={setField('amount')} />
          {/* max={today()} ไม่ให้เลือกวันในอนาคตจากปฏิทิน */}
          <input className={field} type="date" max={today()}
                 value={form.txnDate} onChange={setField('txnDate')} />
          <input className={`${field} sm:col-span-2`} maxLength={200} placeholder="โน้ต (ไม่บังคับ)"
                 value={form.note} onChange={setField('note')} />
          {error && <p className="sm:col-span-2 text-red-600 text-sm">{error}</p>}
          <div className="sm:col-span-2 flex gap-2">
            <button className="bg-blue-600 text-white rounded px-4 py-2">บันทึก</button>
            <button type="button" onClick={() => setForm(null)} className="border rounded px-4 py-2">ยกเลิก</button>
          </div>
        </form>
      )}

      {/* แถบตัวกรอง: ตั้งแต่วันที่ / ถึงวันที่ / หมวด / ค้นหาโน้ต */}
      <div className="bg-white rounded-lg shadow p-4 grid gap-2 sm:grid-cols-4">
        <input className={field} type="date" value={filters.from} onChange={setFilter('from')} title="ตั้งแต่วันที่" />
        <input className={field} type="date" value={filters.to} onChange={setFilter('to')} title="ถึงวันที่" />
        <select className={field} value={filters.categoryId} onChange={setFilter('categoryId')}>
          <option value="">ทุกหมวด</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className={field} placeholder="ค้นหาจากโน้ต" value={filters.q} onChange={setFilter('q')} />
      </div>

      {/* ตารางรายการ (เลื่อนซ้ายขวาได้บนมือถือ) */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr><th className="p-3">วันที่</th><th>หมวด</th><th>โน้ต</th><th className="text-right">จำนวน</th><th></th></tr>
          </thead>
          <tbody>
            {list.items.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3">{t.txnDate}</td>
                <td>{t.categoryName}</td>
                <td>{t.note}</td>
                {/* รายรับ: สีเขียวนำหน้า + / รายจ่าย: สีแดงนำหน้า - (มีเครื่องหมายด้วย ไม่พึ่งสีอย่างเดียว) */}
                <td className={`text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'}{money(t.amount)}
                </td>
                <td className="text-right p-3 whitespace-nowrap">
                  <button onClick={() => openEdit(t)} className="text-blue-600 mr-3">แก้ไข</button>
                  <button onClick={() => remove(t)} className="text-red-600">ลบ</button>
                </td>
              </tr>
            ))}
            {/* ไม่มีรายการ: แสดงข้อความแทน */}
            {!list.items.length && (
              <tr><td colSpan="5" className="p-6 text-center text-gray-400">ไม่พบรายการ</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ปุ่มเปลี่ยนหน้า: ปิดปุ่ม "ก่อนหน้า" ที่หน้าแรก และ "ถัดไป" ที่หน้าสุดท้าย */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="border rounded px-3 py-1 disabled:opacity-40">ก่อนหน้า</button>
        <span>หน้า {page} / {lastPage} (ทั้งหมด {list.total} รายการ)</span>
        <button disabled={page >= lastPage} onClick={() => setPage(page + 1)} className="border rounded px-3 py-1 disabled:opacity-40">ถัดไป</button>
      </div>
    </div>
  )
}
