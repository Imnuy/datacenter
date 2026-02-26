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
    villages: Record<string, number>
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
    const { hospList, chartData, grandTotal, allVillages, colTotals } = useMemo(() => {
        const hospMap: Record<string, HospData> = {}
        const villageSet = new Set<string>()

        rawData.forEach(r => {
            if (!hospMap[r.hospcode]) {
                hospMap[r.hospcode] = {
                    hospcode: r.hospcode,
                    hosname: r.hosname || 'ไม่ระบุสถานบริการ',
                    totalHomes: 0,
                    villages: {},
                }
            }
            const h = hospMap[r.hospcode]
            const count = Number(r.total) || 0
            h.totalHomes += count

            // Format village string
            const vName = !r.village || r.village.trim() === '' ? 'ไม่ระบุหมู่' : `หมู่ ${Number(r.village)}`
            villageSet.add(vName)
            h.villages[vName] = (h.villages[vName] || 0) + count
        })

        const tData = Object.values(hospMap).sort((a, b) => a.hospcode.localeCompare(b.hospcode))

        // Sort all unique villages
        const allV = Array.from(villageSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

        // Calculate column totals
        const cTotals: Record<string, number> = {}
        allV.forEach(v => {
            cTotals[v] = tData.reduce((sum, h) => sum + (h.villages[v] || 0), 0)
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

        return { hospList: tData, chartData: cData, grandTotal: sum, allVillages: allV, colTotals: cTotals }
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
                        <Map size={16} /> ตารางจำนวนหลังคาเรือน (แยกตามหน่วยบริการและหมู่บ้าน)
                    </span>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        รวมทั้งหมด <strong style={{ color: 'var(--accent)', fontSize: '16px' }}>{grandTotal.toLocaleString()}</strong> หลัง
                    </div>
                </div>

                {/* Table Container */}
                <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '800px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--accent-light)' }}>
                            <tr>
                                <th style={{ padding: '12px 14px', borderBottom: '2px solid var(--accent)', borderRight: '1px solid var(--border)', textAlign: 'left', color: 'var(--accent)', fontWeight: 700, position: 'sticky', left: 0, background: 'var(--accent-light)', zIndex: 11, minWidth: '180px' }}>
                                    สถานบริการ
                                </th>
                                {allVillages?.map(v => (
                                    <th key={v} style={{ padding: '12px 14px', borderBottom: '2px solid var(--accent)', borderRight: '1px solid var(--border)', textAlign: 'right', color: 'var(--accent)', fontWeight: 600, minWidth: '80px' }}>
                                        {v}
                                    </th>
                                ))}
                                <th style={{ padding: '12px 14px', borderBottom: '2px solid var(--accent)', textAlign: 'right', background: 'var(--accent-mid)', color: 'var(--accent)', fontWeight: 700, minWidth: '100px' }}>
                                    รวม (หลัง)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={(allVillages?.length || 0) + 2} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        กำลังประมวลผลข้อมูล...
                                    </td>
                                </tr>
                            ) : hospList.length === 0 ? (
                                <tr>
                                    <td colSpan={(allVillages?.length || 0) + 2} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        ไม่พบข้อมูล
                                    </td>
                                </tr>
                            ) : (
                                hospList.map((h, i) => (
                                    <tr key={h.hospcode} style={{ background: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)' }}>
                                        <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-primary)', position: 'sticky', left: 0, background: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)', zIndex: 1 }}>
                                            {h.hosname}
                                        </td>
                                        {allVillages.map(v => {
                                            const val = h.villages[v]
                                            return (
                                                <td key={v} style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', textAlign: 'right', color: val ? '#0288d1' : 'var(--border)' }}>
                                                    {val ? val.toLocaleString() : '-'}
                                                </td>
                                            )
                                        })}
                                        <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontWeight: 700, background: 'var(--accent-light)', color: 'var(--accent)' }}>
                                            {h.totalHomes.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {/* Footer TFoot component to show grand total */}
                        {hospList.length > 0 && (
                            <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
                                <tr>
                                    <td style={{ padding: '12px 14px', background: 'var(--accent)', color: 'white', fontWeight: 700, borderRight: '1px solid rgba(255,255,255,0.2)', position: 'sticky', left: 0, zIndex: 11 }}>
                                        รวมทุกสถานบริการ
                                    </td>
                                    {allVillages.map(v => (
                                        <td key={v} style={{ padding: '12px 14px', background: 'var(--accent)', color: 'white', fontWeight: 600, textAlign: 'right', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                                            {colTotals[v] ? colTotals[v].toLocaleString() : '-'}
                                        </td>
                                    ))}
                                    <td style={{ padding: '12px 14px', background: '#1b5e20', color: 'white', fontWeight: 700, textAlign: 'right' }}>
                                        {grandTotal.toLocaleString()}
                                    </td>
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
