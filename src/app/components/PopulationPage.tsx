'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, RefreshCw, Filter, Download, ChevronDown } from 'lucide-react'

const AGE_PRESETS = [
    { label: 'ทั้งหมด', min: 0, max: 150 },
    { label: 'เด็กแรกเกิด', min: 0, max: 0 },
    { label: 'เด็กเล็ก', min: 1, max: 5 },
    { label: 'เด็กวัยเรียน', min: 6, max: 14 },
    { label: 'วัยรุ่น', min: 15, max: 24 },
    { label: 'วัยทำงาน', min: 25, max: 59 },
    { label: 'ผู้สูงอายุ', min: 60, max: 150 },
]

interface AgeGroupRow {
    age_group: string
    sex: string
    total: number
}

function sumBySex(data: AgeGroupRow[], sex: string) {
    return data.filter(r => r.sex === sex).reduce((s, r) => s + Number(r.total), 0)
}

export default function PopulationPage() {
    const [ageMin, setAgeMin] = useState(0)
    const [ageMax, setAgeMax] = useState(150)
    const [sex, setSex] = useState('')
    const [preset, setPreset] = useState(0)   // index ใน AGE_PRESETS
    const [data, setData] = useState<AgeGroupRow[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [totalCount, setTotalCount] = useState(0)

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const params = new URLSearchParams({
                type: 'age-group',
                ageMin: String(ageMin),
                ageMax: String(ageMax),
                sex,
            })
            const res = await fetch(`/api/population?${params}`)
            const json = await res.json()
            if (!json.success) throw new Error(json.error)
            const rows: AgeGroupRow[] = json.data
            setData(rows)
            setTotalCount(rows.reduce((s, r) => s + Number(r.total), 0))
        } catch (e) {
            setError(String(e))
        } finally {
            setLoading(false)
        }
    }, [ageMin, ageMax, sex])

    useEffect(() => { fetchData() }, [fetchData])

    const applyPreset = (idx: number) => {
        setPreset(idx)
        setAgeMin(AGE_PRESETS[idx].min)
        setAgeMax(AGE_PRESETS[idx].max)
    }

    // unique groups
    const groups = Array.from(new Set(data.map(r => r.age_group)))

    const maleTotal = sumBySex(data, '1')
    const femaleTotal = sumBySex(data, '2')

    const cardStyle = (color: string): React.CSSProperties => ({
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '20px 22px',
        display: 'flex', alignItems: 'center', gap: '14px',
        boxShadow: 'var(--shadow-sm)',
    })

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '21px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ข้อมูลประชากรทั้งหมด
                    </h1>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        ตาราง person · ฐานข้อมูล datacenter
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '8px',
                        background: 'var(--accent)', color: 'white', border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '13px', fontWeight: 500,
                        opacity: loading ? 0.7 : 1,
                        transition: 'all 0.18s',
                        boxShadow: 'var(--shadow-sm)',
                    }}
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
                </button>
            </div>

            {/* Filter Bar */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '18px 20px',
                display: 'flex', flexDirection: 'column', gap: '14px',
                boxShadow: 'var(--shadow-sm)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--accent)', fontWeight: 600, fontSize: '13px' }}>
                    <Filter size={15} />
                    ตัวกรองข้อมูล
                </div>

                {/* Preset Buttons */}
                <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>กลุ่มอายุที่กำหนดไว้</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                        {AGE_PRESETS.map((p, i) => (
                            <button
                                key={i}
                                onClick={() => applyPreset(i)}
                                style={{
                                    padding: '6px 13px',
                                    borderRadius: '20px',
                                    border: `1px solid ${preset === i ? 'var(--accent)' : 'var(--border)'}`,
                                    background: preset === i ? 'var(--accent)' : 'transparent',
                                    color: preset === i ? 'white' : 'var(--text-muted)',
                                    fontSize: '12.5px', fontWeight: preset === i ? 600 : 400,
                                    cursor: 'pointer', transition: 'all 0.18s',
                                }}
                            >
                                {p.label}
                                {preset === i && ` (${p.min}–${p.max === 150 ? '∞' : p.max})`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Range + Sex */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                            อายุขั้นต่ำ (ปี)
                        </label>
                        <input
                            type="number" min={0} max={150} value={ageMin}
                            onChange={e => { setAgeMin(Number(e.target.value)); setPreset(-1) }}
                            style={{
                                width: '100px', padding: '7px 11px', borderRadius: '8px',
                                border: '1px solid var(--border)', background: 'var(--bg-primary)',
                                color: 'var(--text-primary)', fontSize: '13px',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                            อายุสูงสุด (ปี)
                        </label>
                        <input
                            type="number" min={0} max={150} value={ageMax === 150 ? '' : ageMax}
                            placeholder="ไม่จำกัด"
                            onChange={e => { setAgeMax(e.target.value === '' ? 150 : Number(e.target.value)); setPreset(-1) }}
                            style={{
                                width: '110px', padding: '7px 11px', borderRadius: '8px',
                                border: '1px solid var(--border)', background: 'var(--bg-primary)',
                                color: 'var(--text-primary)', fontSize: '13px',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                            เพศ
                        </label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={sex}
                                onChange={e => setSex(e.target.value)}
                                style={{
                                    padding: '7px 30px 7px 11px', borderRadius: '8px',
                                    border: '1px solid var(--border)', background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)', fontSize: '13px',
                                    appearance: 'none', cursor: 'pointer', outline: 'none',
                                }}
                            >
                                <option value="">ทั้งหมด</option>
                                <option value="1">ชาย</option>
                                <option value="2">หญิง</option>
                            </select>
                            <ChevronDown size={13} style={{
                                position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)',
                                color: 'var(--text-muted)', pointerEvents: 'none',
                            }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                {[
                    { label: 'ประชากรทั้งหมด', value: totalCount, color: '#2e7d32', bg: 'linear-gradient(135deg,#2e7d32,#66bb6a)' },
                    { label: 'ชาย', value: maleTotal, color: '#0288d1', bg: 'linear-gradient(135deg,#0288d1,#29b6f6)' },
                    { label: 'หญิง', value: femaleTotal, color: '#e91e63', bg: 'linear-gradient(135deg,#e91e63,#f48fb1)' },
                    { label: 'กลุ่มอายุ', value: groups.length + ' กลุ่ม', color: '#f57c00', bg: 'linear-gradient(135deg,#f57c00,#ffb74d)' },
                ].map(c => (
                    <div key={c.label} style={cardStyle(c.color)}>
                        <div style={{
                            width: '42px', height: '42px', borderRadius: '11px',
                            background: c.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <Users size={20} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.label}</div>
                            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                                {loading ? '...' : typeof c.value === 'number' ? c.value.toLocaleString() : c.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    padding: '14px 16px', borderRadius: '10px',
                    background: '#fff3f3', border: '1px solid #ffcdd2',
                    color: 'var(--danger)', fontSize: '13px',
                }}>
                    ❌ {error}
                </div>
            )}

            {/* Table */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
            }}>
                <div style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>
                        ตารางแบ่งกลุ่มอายุ
                    </span>
                    <button style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 11px', borderRadius: '7px',
                        border: '1px solid var(--border)', background: 'transparent',
                        color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer',
                    }}>
                        <Download size={13} /> ดาวน์โหลด
                    </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: 'var(--accent-light)' }}>
                                {['กลุ่มอายุ', 'ชาย', 'หญิง', 'รวม', 'สัดส่วน (%)'].map(h => (
                                    <th key={h} style={{
                                        padding: '11px 16px', textAlign: h === 'กลุ่มอายุ' ? 'left' : 'right',
                                        color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap',
                                        borderBottom: '1px solid var(--border)',
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                            <RefreshCw size={16} className="animate-spin" />
                                            กำลังโหลดข้อมูล...
                                        </div>
                                    </td>
                                </tr>
                            ) : groups.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        ไม่พบข้อมูลในช่วงที่เลือก
                                    </td>
                                </tr>
                            ) : (
                                groups.map((grp, idx) => {
                                    const m = data.find(r => r.age_group === grp && r.sex === '1')?.total ?? 0
                                    const f = data.find(r => r.age_group === grp && r.sex === '2')?.total ?? 0
                                    const t = Number(m) + Number(f)
                                    const pct = totalCount > 0 ? ((t / totalCount) * 100).toFixed(1) : '0.0'
                                    return (
                                        <tr
                                            key={grp}
                                            style={{ borderBottom: '1px solid var(--border-light)', background: idx % 2 === 0 ? 'transparent' : 'var(--bg-primary)' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-hover)'}
                                            onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? 'transparent' : 'var(--bg-primary)'}
                                        >
                                            <td style={{ padding: '10px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>{grp}</td>
                                            <td style={{ padding: '10px 16px', textAlign: 'right', color: '#0288d1' }}>{Number(m).toLocaleString()}</td>
                                            <td style={{ padding: '10px 16px', textAlign: 'right', color: '#e91e63' }}>{Number(f).toLocaleString()}</td>
                                            <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>{t.toLocaleString()}</td>
                                            <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <div style={{ width: '70px', height: '6px', borderRadius: '3px', background: 'var(--border)', overflow: 'hidden' }}>
                                                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: '3px' }} />
                                                    </div>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'right' }}>{pct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                        {!loading && groups.length > 0 && (
                            <tfoot>
                                <tr style={{ background: 'var(--accent-light)', borderTop: '2px solid var(--border)' }}>
                                    <td style={{ padding: '11px 16px', fontWeight: 700, color: 'var(--accent)' }}>รวมทั้งหมด</td>
                                    <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: '#0288d1' }}>{maleTotal.toLocaleString()}</td>
                                    <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: '#e91e63' }}>{femaleTotal.toLocaleString()}</td>
                                    <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>{totalCount.toLocaleString()}</td>
                                    <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>100%</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    )
}
