'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart3, Building2, Calendar, RefreshCw,
  Search, TrendingUp, ChevronDown, ChevronUp, MapPin
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, LabelList, Cell
} from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#84cc16']
const FISCAL_YEARS = Array.from({ length: 5 }, (_, i) => 2569 - i)

interface DiagRow { hospcode: string; hosname: string; diagcode: string; total: number; rn: number }
interface DistrictRow { diagcode: string; total: number }

/* ─── Shared year/hosname selector ─────────────────────────── */
function YearSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '6px 14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
      <Calendar size={16} color="var(--text-muted)" />
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
        {FISCAL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  )
}

/* ─── Custom Bar Tooltip ────────────────────────────────────── */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 16px', boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{payload[0].payload.name}</div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{Number(payload[0].value).toLocaleString()} ครั้ง</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Tab 1: ภาพรวมอำเภอ
═══════════════════════════════════════════════════════════════ */
function DistrictTab() {
  const [data, setData] = useState<DistrictRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [year, setYear] = useState('2569')

  const fetch = async (y = year) => {
    setLoading(true); setError('')
    try {
      const res = await window.fetch(`/api/opd?type=top-diag-district&year=${y}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setData(json.data)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch(year) }, [year])

  const chartData = data.map((d, i) => ({ name: d.diagcode, total: Number(d.total), rank: i + 1 }))
  const maxTotal = chartData[0]?.total || 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <YearSelector value={year} onChange={v => { setYear(v); fetch(v) }} />
        <button onClick={() => fetch(year)} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', background: 'var(--accent)', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />รีเฟรช
        </button>
      </div>

      {error && (
        <div style={{ padding: '14px', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fda4af', color: '#e11d48' }}>❌ {error}</div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>กำลังโหลด...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Bar Chart */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={17} color="var(--accent)" />
              กราฟ 10 อันดับโรค — ภาพรวมอำเภอ ปีงบ {year}
            </h2>
            <div style={{ height: '360px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 60, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" style={{ fontSize: '11px' }} tickFormatter={v => Number(v).toLocaleString()} />
                  <YAxis type="category" dataKey="name" width={70} style={{ fontSize: '12px', fontWeight: 600 }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    <LabelList dataKey="total" position="right" style={{ fontSize: '11px', fontWeight: 600 }} formatter={(v: any) => Number(v).toLocaleString()} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={17} color="var(--accent)" />
              ตารางสรุปภาพรวมอำเภอ ปีงบ {year}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-primary)' }}>
                <tr>
                  <th style={{ padding: '10px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', width: '60px' }}>อันดับ</th>
                  <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>รหัส ICD-10</th>
                  <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>จำนวน (ครั้ง)</th>
                  <th style={{ padding: '10px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>สัดส่วน</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((d, i) => {
                  const pct = Math.round((d.total / maxTotal) * 100)
                  return (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                      <td style={{ padding: '12px 20px', fontWeight: 700, fontSize: '15px', color: i < 3 ? COLORS[i] : 'var(--text-muted)' }}>#{i + 1}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 600, background: `${COLORS[i]}18`, color: COLORS[i], padding: '3px 10px', borderRadius: '6px' }}>{d.name}</span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                        {d.total.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: '4px', transition: 'width 0.5s' }} />
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '36px' }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Tab 2: แยกรายหน่วยบริการ
═══════════════════════════════════════════════════════════════ */
function UnitTab() {
  const [data, setData] = useState<DiagRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [year, setYear] = useState('2569')
  const [selectedHosp, setSelectedHosp] = useState('')
  const [search, setSearch] = useState('')
  const [expandedHosp, setExpandedHosp] = useState<Record<string, boolean>>({})

  const fetch = async (y = year, hosp = selectedHosp) => {
    setLoading(true); setError('')
    try {
      const url = `/api/opd?type=top-diag&year=${y}${hosp ? `&hospcode=${hosp}` : ''}`
      const res = await window.fetch(url)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setData(json.data)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch(year, selectedHosp) }, [year, selectedHosp])

  const hospList = useMemo(() => {
    const map: Record<string, string> = {}
    data.forEach(r => { map[r.hospcode] = r.hosname })
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))
  }, [data])

  const grouped = useMemo(() => {
    const map: Record<string, { hospcode: string; hosname: string; diags: DiagRow[] }> = {}
    data.forEach(row => {
      if (!map[row.hospcode]) map[row.hospcode] = { hospcode: row.hospcode, hosname: row.hosname, diags: [] }
      map[row.hospcode].diags.push(row)
    })
    return Object.values(map)
      .filter(h => h.hosname?.toLowerCase().includes(search.toLowerCase()) || h.hospcode.includes(search))
      .sort((a, b) => a.hospcode.localeCompare(b.hospcode))
  }, [data, search])

  const toggleHosp = (code: string) =>
    setExpandedHosp(prev => ({ ...prev, [code]: !(prev[code] !== false) }))

  const chartData = selectedHosp && grouped[0]
    ? grouped[0].diags.map((d, i) => ({ name: d.diagcode, total: Number(d.total), rank: i + 1 }))
    : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <YearSelector value={year} onChange={v => { setYear(v); fetch(v, selectedHosp) }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '6px 14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <Building2 size={16} color="var(--text-muted)" />
          <select value={selectedHosp} onChange={e => { setSelectedHosp(e.target.value); fetch(year, e.target.value) }}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer', maxWidth: '200px' }}>
            <option value="">ทุกหน่วยบริการ</option>
            {hospList.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
          </select>
        </div>
        <button onClick={() => fetch(year, selectedHosp)} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', background: 'var(--accent)', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />รีเฟรช
        </button>
      </div>

      {error && <div style={{ padding: '14px', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fda4af', color: '#e11d48' }}>❌ {error}</div>}

      {/* Bar Chart when single unit selected */}
      {selectedHosp && chartData.length > 0 && (
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={17} color="var(--accent)" />
            {grouped[0]?.hosname} — 10 อันดับโรค ปีงบ {year}
          </h2>
          <div style={{ height: '340px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 60, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" style={{ fontSize: '11px' }} tickFormatter={v => Number(v).toLocaleString()} />
                <YAxis type="category" dataKey="name" width={70} style={{ fontSize: '12px', fontWeight: 600 }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  <LabelList dataKey="total" position="right" style={{ fontSize: '11px', fontWeight: 600 }} formatter={(v: any) => Number(v).toLocaleString()} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '300px' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input type="text" placeholder="ค้นหาชื่อหน่วยบริการ..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 12px 8px 36px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: '14px', width: '100%', outline: 'none' }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</div>
      ) : grouped.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>ไม่พบข้อมูล</div>
      ) : (
        grouped.map(hosp => {
          const isExpanded = expandedHosp[hosp.hospcode] !== false
          const maxTotal = Number(hosp.diags[0]?.total) || 1
          return (
            <div key={hosp.hospcode} style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <button onClick={() => toggleHosp(hosp.hospcode)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'var(--bg-primary)', border: 'none', cursor: 'pointer', borderBottom: isExpanded ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={16} color="var(--accent)" />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{hosp.hosname}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '20px', border: '1px solid var(--border)' }}>{hosp.hospcode}</span>
                </div>
                {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
              </button>
              {isExpanded && (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: 'var(--bg-primary)' }}>
                    <tr>
                      <th style={{ padding: '10px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', width: '60px' }}>อันดับ</th>
                      <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>รหัส ICD-10</th>
                      <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>จำนวน (ครั้ง)</th>
                      <th style={{ padding: '10px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>สัดส่วน (เทียบอันดับ 1)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hosp.diags.map((d, i) => {
                      const pct = Math.round((Number(d.total) / maxTotal) * 100)
                      return (
                        <tr key={i} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                          <td style={{ padding: '11px 20px', fontWeight: 700, fontSize: '15px', color: i < 3 ? COLORS[i] : 'var(--text-muted)' }}>#{i + 1}</td>
                          <td style={{ padding: '11px 16px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 600, background: `${COLORS[i % COLORS.length]}18`, color: COLORS[i % COLORS.length], padding: '3px 10px', borderRadius: '6px' }}>{d.diagcode}</span>
                          </td>
                          <td style={{ padding: '11px 16px', textAlign: 'right', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {Number(d.total).toLocaleString()}
                          </td>
                          <td style={{ padding: '11px 20px', minWidth: '180px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: '4px', transition: 'width 0.5s' }} />
                              </div>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '36px' }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Main Page with Tabs
═══════════════════════════════════════════════════════════════ */
export default function OpdDiagPage() {
  const [activeTab, setActiveTab] = useState<'district' | 'unit'>('district')

  const tabs = [
    { key: 'district', label: 'ภาพรวมอำเภอ', icon: <MapPin size={15} /> },
    { key: 'unit', label: 'แยกรายหน่วย', icon: <Building2 size={15} /> },
  ] as const

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp color="#6366f1" size={26} />
          10 อันดับโรคที่พบสูงสุด (OPD) — ยกเว้นรหัส Z
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          จากแฟ้ม diagnosis_opd (diagtype = 1) รหัส ICD-10 ทุกกลุ่มยกเว้น Z
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)', width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 20px', borderRadius: '9px', border: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: 600, transition: 'all 0.2s',
              background: activeTab === tab.key ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--text-muted)',
              boxShadow: activeTab === tab.key ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
            }}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'district' ? <DistrictTab /> : <UnitTab />}
    </div>
  )
}