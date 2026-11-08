// หน้า: สรุปรายเดือน (รายรับรวม รายจ่ายรวม คงเหลือ และรายจ่ายแยกตามหมวด)

import { useEffect, useState } from 'react'
import { api } from '../api'
import { money, today } from '../format'

export default function Summary() {
  // เดือนที่เลือก รูปแบบ YYYY-MM เริ่มต้นเป็นเดือนปัจจุบัน (ตัดเอา 7 ตัวแรกของวันที่ เช่น "2026-11")
  const [month, setMonth] = useState(today().slice(0, 7))
  const [data, setData] = useState(null) // ผลสรุปจากเซิร์ฟเวอร์ (null = ยังโหลดไม่เสร็จ)

  // โหลดสรุปใหม่ทุกครั้งที่เปลี่ยนเดือน
  useEffect(() => {
    api(`/summary?month=${month}`).then(setData)
  }, [month])

  // สร้างการ์ดตัวเลข 1 ใบ (ชื่อ ตัวเลข สี) ใช้ซ้ำ 3 ใบด้านล่าง
  const card = (label, value, color) => (
    <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-40">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{money(value)}</div>
    </div>
  )

  // ยอดของหมวดที่ใช้จ่ายมากที่สุด ใช้เป็น "ตัวเต็มหลอด" เทียบความยาวแท่งกราฟของหมวดอื่น
  // (ใส่ 1 ไว้ในรายการเพื่อกันกรณีไม่มีข้อมูลเลย จะได้ไม่หารด้วยศูนย์)
  const max = data ? Math.max(...data.byCategory.map((c) => c.total), 1) : 1

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold flex-1">สรุปรายเดือน</h1>
        {/* ช่องเลือกเดือน ถ้าผู้ใช้กดล้างค่า (ว่าง) จะไม่เปลี่ยนเดือน */}
        <input type="month" className="border rounded px-3 py-2" value={month}
               onChange={(e) => e.target.value && setMonth(e.target.value)} />
      </div>

      {/* แสดงผลเมื่อโหลดข้อมูลเสร็จแล้วเท่านั้น */}
      {data && (
        <>
          <div className="flex flex-wrap gap-4">
            {card('รายรับรวม', data.income, 'text-green-600')}
            {card('รายจ่ายรวม', data.expense, 'text-red-600')}
            {/* คงเหลือติดลบ (จ่ายมากกว่ารับ) แสดงเป็นสีแดงเตือน */}
            {card('คงเหลือ', data.balance, data.balance < 0 ? 'text-red-600' : 'text-gray-800')}
          </div>

          <section className="bg-white rounded-lg shadow p-4">
            <h2 className="font-bold mb-3">รายจ่ายแยกตามหมวด</h2>
            {!data.byCategory.length && <p className="text-gray-400">เดือนนี้ยังไม่มีรายจ่าย</p>}
            {data.byCategory.map((c) => (
              <div key={c.name} className="mb-3">
                <div className="flex justify-between text-sm">
                  <span>{c.name}</span><span>{money(c.total)}</span>
                </div>
                {/* แท่งกราฟ: ความกว้าง = สัดส่วนของหมวดนี้เทียบกับหมวดที่จ่ายมากสุด (เป็น %) */}
                <div className="h-2 bg-gray-100 rounded">
                  <div className="h-2 bg-red-400 rounded" style={{ width: `${(c.total / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
