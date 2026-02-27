'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Table as TableIcon, Users, RefreshCw, Search, Baby } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, LabelList
} from 'recharts'

interface RowData {
  hospcode: string
  hosname: string
  anc_count: number
  mothers: number
}

export default function MCWHPage() {
  const [data, setData] = useState<RowData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/mcwh')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setData(json.data)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = data.filter(d =>
    d.hosname?.toLowerCase().includes(search.toLowerCase()) || d.hospcode?.includes(search)
  )

  const totals = filtered.reduce((a, c) => ({
    anc_count: a.anc_count + Number(c.anc_count || 0),
    mothers: a.mothers + Number(c.mothers || 0),
  }), { anc_count: 0, mothers: 0 })

  const chartData = filtered.map(d => ({
    name: d.hosname?.replace('รพ.สต.', '').replace('โรงพยาบาลส่งเสริมสุขภาพตำบล', '') || d.hospcode,
    'ฝากครรภ์': Number(d.anc_count || 0),
    'หญิงตั้งครรภ์': Number(d.mothers || 0),
  }))

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Baby color="#ec4899" size={28} /> อนามัยแม่และเด็ก – ANC (ปีงบ 69)
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>จำนวนครั้งฝากครรภ์และหญิงตั้งครรภ์ แยกตามหน่วยบริการ ตั้งแต่ 1 ต.ค. 2568</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="ค้นหาหน่วยบริการ..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: '14px', minWidth: '220px', outline: 'none' }} />
          </div>
          <button onClick={fetchData} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: loading ? 0.7 : 1 }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> รีเฟรช
          </button>
        </div>
      </div>

      {error && <div style={{ padding: '16px', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fda4af', color: '#e11d48' }}>❌ <strong>Error:</strong> {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {[
          { label: 'ครั้งฝากครรภ์ (ANC)', value: totals.anc_count, bg: '#fce7f3', ic: '#be185d' },
          { label: 'หญิงตั้งครรภ์ (คนไม่ซ้ำ)', value: totals.mothers, bg: '#fef3c7', ic: '#d97706' },
        ].map(w => (
          <div key={w.label} style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: w.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Baby size={24} color={w.ic} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{w.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{loading ? '...' : w.value.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 400 }}>ราย/ครั้ง</span></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={20} color="var(--accent)" /> กราฟแสดงการฝากครรภ์แยกตามหน่วยบริการ
        </h2>
        <div style={{ height: '380px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} style={{ fontSize: '11px' }} />
              <YAxis style={{ fontSize: '12px' }} />
              <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="ฝากครรภ์" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={20}>
                <LabelList dataKey="ฝากครรภ์" position="top" style={{ fontSize: '10px', fill: 'var(--text-muted)' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TableIcon size={20} color="var(--accent)" />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>ข้อมูลตารางแยกราย รพ.สต.</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-primary)' }}>
              <tr>
                {['รหัส', 'หน่วยบริการ', 'ครั้งฝากครรภ์', 'หญิงตั้งครรภ์ (คน)'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: h === 'รหัส' || h === 'หน่วยบริการ' ? 'left' : 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลด...</td></tr>
              ) : filtered.map((row, i) => (
                <tr key={row.hospcode} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)')}>
                  <td style={{ padding: '12px 20px', fontSize: '14px', color: 'var(--text-muted)' }}>{row.hospcode}</td>
                  <td style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 500 }}>{row.hosname}</td>
                  <td style={{ padding: '12px 20px', fontSize: '14px', textAlign: 'center', fontWeight: 600, color: '#be185d' }}>{Number(row.anc_count || 0).toLocaleString()}</td>
                  <td style={{ padding: '12px 20px', fontSize: '14px', textAlign: 'center', fontWeight: 600, color: '#d97706' }}>{Number(row.mothers || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot style={{ background: 'var(--bg-primary)', fontWeight: 700 }}>
              <tr>
                <td colSpan={2} style={{ padding: '14px 20px', textAlign: 'right', fontSize: '14px' }}>รวมทั้งสิ้น</td>
                <td style={{ padding: '14px 20px', textAlign: 'center', fontSize: '16px', color: '#be185d' }}>{totals.anc_count.toLocaleString()}</td>
                <td style={{ padding: '14px 20px', textAlign: 'center', fontSize: '16px', color: '#d97706' }}>{totals.mothers.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}