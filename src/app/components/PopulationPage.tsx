'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Users, RefreshCw, BarChart3, Download } from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList, Cell
} from 'recharts'

interface ApiResponseRow {
    hospcode: string
    hosname: string
    age_group: string
    sex: string
    total: number
}

const AGE_GROUPS = [
    '0-4', '5-9', '10-14', '15-19', '20-24', '25-29',
    '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60+'
]

interface HospData {
    hospcode: string
    hosname: string
    ageGroups: Record<string, { m: number, f: number, t: number }>
    totalMale: number
    totalFemale: number
    totalAll: number
}

const COLORS = ['#2e7d32', '#43a047', '#66bb6a', '#81c784', '#0288d1', '#0277bd', '#f57c00', '#e65100']

export default function PopulationPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [rawData, setRawData] = useState<ApiResponseRow[]>([])

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`/api/population?type=hosp-age-5yr`)
            const json = await res.json()
            if (!json.success) throw new Error(json.error)
            setRawData(json.data)
        } catch (e) {
            setError(String(e))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Transform Data
    const { tableData, totalRow, chartData } = useMemo(() => {
        // Map with hospcode as key
        const hospMap: Record<string, HospData> = {}

        // Initialize map
        rawData.forEach(r => {
            if (!hospMap[r.hospcode]) {
                hospMap[r.hospcode] = {
                    hospcode: r.hospcode,
                    hosname: r.hosname || 'ไม่ระบุสถานบริการ',
                    ageGroups: {},
                    totalMale: 0,
                    totalFemale: 0,
                    totalAll: 0,
                }
                AGE_GROUPS.forEach(g => {
                    hospMap[r.hospcode].ageGroups[g] = { m: 0, f: 0, t: 0 }
                })
            }
        })

        // Fill data
        rawData.forEach(r => {
            const h = hospMap[r.hospcode]
            // Use 'Unknown' or fit into groups safely
            const groupKey = AGE_GROUPS.includes(r.age_group) ? r.age_group : null
            const count = Number(r.total) || 0

            if (r.sex === '1') {
                h.totalMale += count
                h.totalAll += count
                if (groupKey) {
                    h.ageGroups[groupKey].m += count
                    h.ageGroups[groupKey].t += count
                }
            } else if (r.sex === '2') {
                h.totalFemale += count
                h.totalAll += count
                if (groupKey) {
                    h.ageGroups[groupKey].f += count
                    h.ageGroups[groupKey].t += count
                }
            }
        })

        const tData = Object.values(hospMap).sort((a, b) => a.hospcode.localeCompare(b.hospcode))

        // Calculate Grand Total Row
        const grandRow: HospData = {
            hospcode: 'TOTAL',
            hosname: 'รวมทั้งหมด',
            ageGroups: {},
            totalMale: 0,
            totalFemale: 0,
            totalAll: 0,
        }
        AGE_GROUPS.forEach(g => { grandRow.ageGroups[g] = { m: 0, f: 0, t: 0 } })

        tData.forEach(h => {
            grandRow.totalMale += h.totalMale
            grandRow.totalFemale += h.totalFemale
            grandRow.totalAll += h.totalAll
            AGE_GROUPS.forEach(g => {
                grandRow.ageGroups[g].m += h.ageGroups[g].m
                grandRow.ageGroups[g].f += h.ageGroups[g].f
                grandRow.ageGroups[g].t += h.ageGroups[g].t
            })
        })

        // Prepare Chart Data
        const cData = tData.map(h => ({
            name: h.hosname.replace('รพ.สต.', ''),
            รวมประชากร: h.totalAll,
        }))
        // Sort chart dynamically (descending by total)
        cData.sort((a, b) => b.รวมประชากร - a.รวมประชากร)

        return { tableData: tData, totalRow: grandRow, chartData: cData }
    }, [rawData])

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '21px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        จำนวนประชากร แยกรายสถานบริการ
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        เฉพาะประชากร Type 1, 3 ที่ยังมีชีวิตและยังไม่จำหน่าย แยกชาย/หญิง ตามช่วงอายุ 5 ปี
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
                        opacity: loading ? 0.7 : 1, transition: 'all 0.18s',
                        boxShadow: 'var(--shadow-sm)',
                    }}
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
                </button>
            </div>

            {error && (
                <div style={{
                    padding: '14px 16px', borderRadius: '10px',
                    background: '#fff3f3', border: '1px solid #ffcdd2',
                    color: 'var(--danger)', fontSize: '13px',
                }}>
                    ❌ {error}
                </div>
            )}

            {/* Table Section */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex', flexDirection: 'column',
            }}>
                <div style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--bg-primary)'
                }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={16} /> ตารางประชากรแยกกลุ่มอายุ 5 ปี
                    </span>
                </div>

                {/* Scrollable Table Container */}
                <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '1500px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--accent-light)' }}>
                            {/* Header Row 1: Group Names */}
                            <tr>
                                <th rowSpan={2} style={{ padding: '10px', borderBottom: '2px solid var(--accent)', borderRight: '1px solid var(--border)', textAlign: 'left', minWidth: '180px', color: 'var(--accent)', position: 'sticky', left: 0, background: 'var(--accent-light)' }}>
                                    สถานบริการ
                                </th>
                                {AGE_GROUPS.map(g => (
                                    <th key={g} colSpan={3} style={{ padding: '8px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', textAlign: 'center', color: 'var(--accent)', fontWeight: 600 }}>
                                        อายุ {g} ปี
                                    </th>
                                ))}
                                <th colSpan={3} style={{ padding: '8px', borderBottom: '1px solid var(--border)', textAlign: 'center', background: 'var(--accent-mid)', color: 'var(--accent)', fontWeight: 700 }}>
                                    รวมทั้งหมด
                                </th>
                            </tr>
                            {/* Header Row 2: Sex */}
                            <tr>
                                {AGE_GROUPS.map(g => (
                                    <optgroup key={g} style={{ display: 'contents' }}>
                                        <th style={{ padding: '6px', borderBottom: '2px solid var(--accent)', textAlign: 'right', color: '#0288d1', fontWeight: 500 }}>ช</th>
                                        <th style={{ padding: '6px', borderBottom: '2px solid var(--accent)', textAlign: 'right', color: '#e91e63', fontWeight: 500 }}>ญ</th>
                                        <th style={{ padding: '6px', borderBottom: '2px solid var(--accent)', borderRight: '1px solid var(--border)', textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>รวม</th>
                                    </optgroup>
                                ))}
                                <th style={{ padding: '6px', borderBottom: '2px solid var(--accent)', textAlign: 'right', background: 'var(--accent-mid)', color: '#0288d1', fontWeight: 600 }}>ชาย</th>
                                <th style={{ padding: '6px', borderBottom: '2px solid var(--accent)', textAlign: 'right', background: 'var(--accent-mid)', color: '#e91e63', fontWeight: 600 }}>หญิง</th>
                                <th style={{ padding: '6px', borderBottom: '2px solid var(--accent)', textAlign: 'right', background: 'var(--accent-mid)', color: 'var(--accent)', fontWeight: 700 }}>รวมทั้งหมด</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={AGE_GROUPS.length * 3 + 4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        กำลังประมวลผลข้อมูล...
                                    </td>
                                </tr>
                            ) : tableData.length === 0 ? (
                                <tr>
                                    <td colSpan={AGE_GROUPS.length * 3 + 4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        ไม่พบข้อมูล
                                    </td>
                                </tr>
                            ) : (
                                tableData.map((h, idx) => (
                                    <tr key={h.hospcode} style={{ background: idx % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)', borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '10px', borderRight: '1px solid var(--border)', position: 'sticky', left: 0, background: idx % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {h.hosname}
                                        </td>
                                        {AGE_GROUPS.map(g => (
                                            <optgroup key={g} style={{ display: 'contents' }}>
                                                <td style={{ padding: '8px', textAlign: 'right', color: '#0288d1' }}>{h.ageGroups[g].m.toLocaleString()}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', color: '#e91e63' }}>{h.ageGroups[g].f.toLocaleString()}</td>
                                                <td style={{ padding: '8px', borderRight: '1px solid var(--border)', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>{h.ageGroups[g].t.toLocaleString()}</td>
                                            </optgroup>
                                        ))}
                                        <td style={{ padding: '8px', textAlign: 'right', background: 'var(--accent-light)', color: '#0288d1', fontWeight: 600 }}>{h.totalMale.toLocaleString()}</td>
                                        <td style={{ padding: '8px', textAlign: 'right', background: 'var(--accent-light)', color: '#e91e63', fontWeight: 600 }}>{h.totalFemale.toLocaleString()}</td>
                                        <td style={{ padding: '8px', textAlign: 'right', background: 'var(--accent-mid)', color: 'var(--accent)', fontWeight: 700 }}>{h.totalAll.toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {tableData.length > 0 && (
                            <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
                                <tr style={{ background: 'var(--accent)', color: 'white' }}>
                                    <td style={{ padding: '12px 10px', borderRight: '1px solid rgba(255,255,255,0.2)', position: 'sticky', left: 0, background: 'var(--accent)', fontWeight: 700 }}>
                                        รวมทุกสถานบริการ
                                    </td>
                                    {AGE_GROUPS.map(g => (
                                        <optgroup key={g} style={{ display: 'contents' }}>
                                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>{totalRow.ageGroups[g].m.toLocaleString()}</td>
                                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>{totalRow.ageGroups[g].f.toLocaleString()}</td>
                                            <td style={{ padding: '12px 8px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'right', fontWeight: 700 }}>{totalRow.ageGroups[g].t.toLocaleString()}</td>
                                        </optgroup>
                                    ))}
                                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600, background: 'var(--accent-hover)' }}>{totalRow.totalMale.toLocaleString()}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600, background: 'var(--accent-hover)' }}>{totalRow.totalFemale.toLocaleString()}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, background: '#1b5e20' }}>{totalRow.totalAll.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Chart Section */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex', flexDirection: 'column', gap: '20px',
            }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={18} color="var(--accent)" />
                    จำนวนประชากรรายสถานบริการ (เปรียบเทียบ)
                </div>

                <div style={{ width: '100%', height: '350px' }}>
                    {loading ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            กำลังโหลดกราฟ...
                        </div>
                    ) : chartData.length === 0 ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            ไม่มีข้อมูล
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis
                                    dataKey="name"
                                    angle={-40}
                                    textAnchor="end"
                                    height={60}
                                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                                    axisLine={{ stroke: 'var(--border)' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                                    axisLine={{ stroke: 'var(--border)' }}
                                    tickLine={false}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: 'var(--bg-hover)' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                                    formatter={(value: number | string | undefined) => [Number(value || 0).toLocaleString() + ' คน', 'รวมประชากร']}
                                />
                                <Bar dataKey="รวมประชากร" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    <LabelList dataKey="รวมประชากร" position="top" style={{ fill: 'var(--accent)', fontSize: 11, fontWeight: 600 }} formatter={(v: any) => Number(v || 0).toLocaleString()} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    )
}
