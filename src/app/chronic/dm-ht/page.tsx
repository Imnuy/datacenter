'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  Table as TableIcon,
  Users,
  RefreshCw,
  Search,
  Activity,
  UserCheck,
  Stethoscope,
  Download
} from 'lucide-react'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
  Cell
} from 'recharts'

interface ChronicData {
  hospcode: string
  hosname: string
  dm_only: number
  ht_only: number
  dm_ht_both: number
  total_patients: number
}

export default function ChronicDMPage() {
  const [data, setData] = useState<ChronicData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/chronic?type=dm-ht-summary')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      // Filter out rows that are not hospitals or have no data if necessary
      // In this case, we show all hospitals from RIGHT JOIN
      setData(json.data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCellClick = async (hospcode: string, filter: string, count: number) => {
    if (count === 0) return

    const { value: pass } = await Swal.fire({
      title: 'ดาวน์โหลดข้อมูลผู้ป่วย NCDs',
      text: 'กรุณาระบุรหัสผ่านหน่วยบริการ',
      input: 'password',
      inputPlaceholder: 'รหัสผ่าน',
      showCancelButton: true,
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: 'var(--accent)',
    })

    if (!pass) return

    try {
      const res = await fetch(`/api/chronic/export?type=dm-ht&hospcode=${hospcode}&filter=${filter}&pass=${pass}`)
      const json = await res.json()
      if (!json.success) {
        Swal.fire({
          icon: 'error',
          title: 'ข้อผิดพลาด',
          text: json.error || 'ไม่สามารถดาวน์โหลดได้ (รหัสผ่านอาจจะผิด)',
          confirmButtonColor: 'var(--accent)'
        })
        return
      }

      if (json.data.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'ไม่พบข้อมูล',
          text: 'ไม่พบข้อมูลตามเงื่อนไขที่เลือก',
          confirmButtonColor: 'var(--accent)'
        })
        return
      }

      const ws = XLSX.utils.json_to_sheet(json.data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Chronic_Data")

      let suffix = "ALL"
      if (filter === 'dm_only') suffix = "DM"
      if (filter === 'ht_only') suffix = "HT"
      if (filter === 'both') suffix = "DM_HT"

      XLSX.writeFile(wb, `CHRONIC_${hospcode}_${suffix}.xlsx`)
    } catch (e: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
        confirmButtonColor: 'var(--accent)'
      })
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = data.filter(item =>
    item.hosname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.hospcode.includes(searchTerm)
  )

  const totals = data.reduce((acc, curr) => ({
    dm_only: acc.dm_only + Number(curr.dm_only || 0),
    ht_only: acc.ht_only + Number(curr.ht_only || 0),
    dm_ht_both: acc.dm_ht_both + Number(curr.dm_ht_both || 0),
    total_patients: acc.total_patients + Number(curr.total_patients || 0)
  }), { dm_only: 0, ht_only: 0, dm_ht_both: 0, total_patients: 0 })

  const chartData = filteredData.map(item => ({
    name: item.hosname.replace('รพ.สต.', '').replace('โรงพยาบาลส่งเสริมสุขภาพตำบล', ''),
    dm: Number(item.dm_only || 0),
    ht: Number(item.ht_only || 0),
    both: Number(item.dm_ht_both || 0)
  }))

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Header section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Stethoscope color="var(--accent)" size={28} /> ทะเบียนผู้ป่วยโรคเรื้อรัง (DM/HT)
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            ข้อมูลผู้ป่วยเบาหวานและความดันโลหิตสูง แยกตามหน่วยบริการ (Type 1, 3 และยังไม่จำหน่าย)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="ค้นหาชื่อหน่วยบริการ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                fontSize: '14px',
                minWidth: '240px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '8px',
              background: 'var(--accent)', color: 'white', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: 500,
              opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            รีเฟรช
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fda4af', color: '#e11d48', fontSize: '14px' }}>
          ❌ <strong>Error:</strong> {error}
        </div>
      )}

      {/* Stats Summary Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity color="#15803d" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>เบาหวาน (DM Only)</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{totals.dm_only.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500 }}>ราย</span></div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity color="#b91c1c" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ความดันฯ (HT Only)</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{totals.ht_only.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500 }}>ราย</span></div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity color="#a16207" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>DM + HT (รวมกัน)</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{totals.dm_ht_both.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500 }}>ราย</span></div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users color="#0369a1" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>จำนวนผู้ป่วยรวม</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{totals.total_patients.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500 }}>ราย</span></div>
          </div>
        </div>
      </div>

      {/* Table and Chart Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>

        {/* 1. Bar Chart */}
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart3 size={20} color="var(--accent)" /> กราฟแสดงจำนวนผู้ป่วยแยกตามหน่วยบริการ
            </h2>
          </div>

          <div style={{ height: '400px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={80}
                  style={{ fontSize: '11px', fontWeight: 500 }}
                />
                <YAxis style={{ fontSize: '12px' }} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    padding: '12px'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="dm" name="เบาหวานอย่างเดียว" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20}>
                  <LabelList dataKey="dm" position="top" style={{ fontSize: '10px', fill: 'var(--text-muted)' }} />
                </Bar>
                <Bar dataKey="ht" name="ความดันอย่างเดียว" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20}>
                  <LabelList dataKey="ht" position="top" style={{ fontSize: '10px', fill: 'var(--text-muted)' }} />
                </Bar>
                <Bar dataKey="both" name="เบาหวาน + ความดัน" fill="#eab308" radius={[4, 4, 0, 0]} barSize={20}>
                  <LabelList dataKey="both" position="top" style={{ fontSize: '10px', fill: 'var(--text-muted)' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TableIcon size={20} color="var(--accent)" />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ข้อมูลตารางแยกราย รพ.สต.
              <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}><Download size={14} /> (สามารถคลิกตัวเลขรายเดือนเพื่อโหลด Excel)</span>
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'var(--bg-primary)', position: 'sticky', top: 0, zIndex: 5 }}>
                <tr>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>รหัส</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>หน่วยบริการ</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#15803d', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>เบาหวาน (DM)</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#b91c1c', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>ความดัน (HT)</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#854d0e', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>DM + HT</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--accent)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>รวมผู้ป่วย</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>ไม่พบข้อมูลตามเงื่อนไข</td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <tr key={item.hospcode} style={{
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                      transition: 'background-color 0.15s'
                    }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)'}>
                      <td style={{ padding: '14px 24px', fontSize: '14px', color: 'var(--text-muted)' }}>{item.hospcode}</td>
                      <td style={{ padding: '14px 24px', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.hosname}</td>
                      <td onClick={() => handleCellClick(item.hospcode, 'dm_only', Number(item.dm_only))} title={Number(item.dm_only) > 0 ? "คลิกเพื่อดาวน์โหลดรายชื่อ" : ""} style={{ padding: '14px 24px', fontSize: '14px', textAlign: 'center', fontWeight: 600, color: '#16a34a', cursor: Number(item.dm_only) > 0 ? 'pointer' : 'default', textDecoration: Number(item.dm_only) > 0 ? 'underline' : 'none' }}>{Number(item.dm_only).toLocaleString()}</td>
                      <td onClick={() => handleCellClick(item.hospcode, 'ht_only', Number(item.ht_only))} title={Number(item.ht_only) > 0 ? "คลิกเพื่อดาวน์โหลดรายชื่อ" : ""} style={{ padding: '14px 24px', fontSize: '14px', textAlign: 'center', fontWeight: 600, color: '#dc2626', cursor: Number(item.ht_only) > 0 ? 'pointer' : 'default', textDecoration: Number(item.ht_only) > 0 ? 'underline' : 'none' }}>{Number(item.ht_only).toLocaleString()}</td>
                      <td onClick={() => handleCellClick(item.hospcode, 'both', Number(item.dm_ht_both))} title={Number(item.dm_ht_both) > 0 ? "คลิกเพื่อดาวน์โหลดรายชื่อ" : ""} style={{ padding: '14px 24px', fontSize: '14px', textAlign: 'center', fontWeight: 600, color: '#ca8a04', cursor: Number(item.dm_ht_both) > 0 ? 'pointer' : 'default', textDecoration: Number(item.dm_ht_both) > 0 ? 'underline' : 'none' }}>{Number(item.dm_ht_both).toLocaleString()}</td>
                      <td onClick={() => handleCellClick(item.hospcode, 'all', Number(item.total_patients))} title={Number(item.total_patients) > 0 ? "คลิกเพื่อดาวน์โหลดรายชื่อ" : ""} style={{ padding: '14px 24px', fontSize: '14px', textAlign: 'center', fontWeight: 800, background: 'rgba(var(--accent-rgb), 0.03)', color: 'var(--accent)', cursor: Number(item.total_patients) > 0 ? 'pointer' : 'default', textDecoration: Number(item.total_patients) > 0 ? 'underline' : 'none' }}>
                        {Number(item.total_patients).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot style={{ background: 'var(--bg-primary)', fontWeight: 700 }}>
                <tr>
                  <td colSpan={2} style={{ padding: '16px 24px', textAlign: 'right', fontSize: '15px' }}>รวมทั้งสิ้น</td>
                  <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '16px', color: '#16a34a' }}>{totals.dm_only.toLocaleString()}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '16px', color: '#dc2626' }}>{totals.ht_only.toLocaleString()}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '16px', color: '#ca8a04' }}>{totals.dm_ht_both.toLocaleString()}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '18px', color: 'var(--accent)', background: 'rgba(var(--accent-rgb), 0.05)' }}>
                    {totals.total_patients.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}