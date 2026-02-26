'use client'

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import { Map, RefreshCw, BarChart3 } from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList, Cell
} from 'recharts'

interface ApiResponseRow {
    hospcode: string
    hosname: string
    village: string
    total: number
}

interface HospData {
    hospcode: string
    hosname: string
    totalHomes: number
    villages: { name: string, total: number }[]
}

const COLORS = ['#2e7d32', '#43a047', '#66bb6a', '#81c784', '#0288d1', '#0277bd', '#f57c00', '#e65100']

export default function HousePage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [rawData, setRawData] = useState<ApiResponseRow[]>([])

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`/api/population?type=house`)
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
    const { hospList, chartData, grandTotal } = useMemo(() => {
        const hospMap: Record<string, HospData> = {}

        rawData.forEach(r => {
            if (!hospMap[r.hospcode]) {
                hospMap[r.hospcode] = {
                    hospcode: r.hospcode,
                    hosname: r.hosname || 'ไม่ระบุสถานบริการ',
                    totalHomes: 0,
                    villages: [],
                }
            }
            const h = hospMap[r.hospcode]
            const count = Number(r.total) || 0
            h.totalHomes += count

            // Format village string
            const vName = !r.village || r.village.trim() === '' ? 'ไม่ระบุหมู่' : `หมู่ ${Number(r.village)}`
            h.villages.push({ name: vName, total: count })
        })

        const tData = Object.values(hospMap).sort((a, b) => a.hospcode.localeCompare(b.hospcode))

        // Sort villages inside each hosp
        tData.forEach(h => {
            h.villages.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        })

        let sum = 0
        const cData = tData.map(h => {
            sum += h.totalHomes
            return {
                name: h.hosname.replace('รพ.สต.', ''),
                รวมหลังคาเรือน: h.totalHomes,
            }
        })

        cData.sort((a, b) => b.รวมหลังคาเรือน - a.รวมหลังคาเรือน)

        return { hospList: tData, chartData: cData, grandTotal: sum }
    }, [rawData])

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '21px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        จำนวนหลังคาเรือน
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        แสดงสถิติจำนวนหลังคาเรือน แยกตามรายสถานบริการและหมู่บ้าน
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
                        <Map size={16} /> ตารางจำนวนหลังคาเรือน
                    </span>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        รวมทั้งหมด <strong style={{ color: 'var(--accent)', fontSize: '16px' }}>{grandTotal.toLocaleString()}</strong> หลัง
                    </div>
                </div>

                {/* Table Container */}
                <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--accent-light)' }}>
                            <tr>
                                <th style={{ padding: '12px 14px', borderBottom: '2px solid var(--accent)', textAlign: 'left', color: 'var(--accent)', fontWeight: 600, width: '40%' }}>
                                    สถานบริการ / หมู่บ้าน
                                </th>
                                <th style={{ padding: '12px 14px', borderBottom: '2px solid var(--accent)', textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>
                                    จำนวนหลังคาเรือน (หลัง)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={2} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        กำลังประมวลผลข้อมูล...
                                    </td>
                                </tr>
                            ) : hospList.length === 0 ? (
                                <tr>
                                    <td colSpan={2} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        ไม่พบข้อมูล
                                    </td>
                                </tr>
                            ) : (
                                hospList.map((h, i) => (
                                    <Fragment key={h.hospcode}>
                                        {/* Hospital Header Row */}
                                        <tr style={{ background: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)' }}>
                                            <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '4px', height: '16px', background: 'var(--accent)', borderRadius: '4px' }} />
                                                {h.hosname}
                                            </td>
                                            <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>
                                                {h.totalHomes.toLocaleString()}
                                            </td>
                                        </tr>
                                        {/* Villages Details Rows */}
                                        {h.villages.map((v, j) => (
                                            <tr key={`${h.hospcode}-${v.name}`} style={{ background: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)', opacity: 0.9 }}>
                                                <td style={{ padding: '10px 14px 10px 38px', borderBottom: j === h.villages.length - 1 ? '1px solid var(--border)' : 'none', color: 'var(--text-secondary)' }}>
                                                    {v.name}
                                                </td>
                                                <td style={{ padding: '10px 14px', borderBottom: j === h.villages.length - 1 ? '1px solid var(--border)' : 'none', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                                    {v.total.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </Fragment>
                                ))
                            )}
                        </tbody>
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
                    กราฟเปรียบเทียบจำนวนหลังคาเรือนรายสถานบริการ
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
                                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
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
                                    formatter={(value: number | string | undefined) => [Number(value || 0).toLocaleString() + ' หลัง', 'จำนวนหลังคาเรือน']}
                                />
                                <Bar dataKey="รวมหลังคาเรือน" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    <LabelList dataKey="รวมหลังคาเรือน" position="top" style={{ fill: 'var(--accent)', fontSize: 11, fontWeight: 600 }} formatter={(v: any) => Number(v || 0).toLocaleString()} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    )
}
