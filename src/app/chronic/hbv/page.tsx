'use client'

import { useState, useEffect } from 'react'
import {
    BarChart3,
    Table as TableIcon,
    Users,
    RefreshCw,
    Search,
    Activity,
    Syringe,
    AlertCircle,
    Calendar,
    Download
} from 'lucide-react'

// รายการเดือนในปีงบประมาณ (ต.ค. - ก.ย.)
const MONTHS = [
    { key: '10', name: 'ต.ค.' },
    { key: '11', name: 'พ.ย.' },
    { key: '12', name: 'ธ.ค.' },
    { key: '01', name: 'ม.ค.' },
    { key: '02', name: 'ก.พ.' },
    { key: '03', name: 'มี.ค.' },
    { key: '04', name: 'เม.ย.' },
    { key: '05', name: 'พ.ค.' },
    { key: '06', name: 'มิ.ย.' },
    { key: '07', name: 'ก.ค.' },
    { key: '08', name: 'ส.ค.' },
    { key: '09', name: 'ก.ย.' },
]
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
    total_patients: number
}

export default function HBVNoVaccinePage() {
    const [data, setData] = useState<ChronicData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    // States for monthly data
    const [monthlyData, setMonthlyData] = useState<any[]>([])
    const [loadingMonthly, setLoadingMonthly] = useState(true)
    const [selectedYear, setSelectedYear] = useState('2569')

    const fetchData = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/chronic?type=hbv-no-vaccine')
            const json = await res.json()
            if (!json.success) throw new Error(json.error)
            setData(json.data)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchMonthlyData = async () => {
        setLoadingMonthly(true)
        try {
            const res = await fetch(`/api/report/monthly?year=${selectedYear}&type=hbv`)
            const json = await res.json()
            if (json.success) {
                const records = json.data
                const grouped = records.reduce((acc: any, curr: any) => {
                    const hc = curr.hospcode
                    if (!acc[hc]) {
                        acc[hc] = {
                            hospcode: hc,
                            hosname: curr.hosname || ('รหัส ' + hc),
                            months: {},
                            total: 0
                        }
                    }
                    const mm = curr.yyyymm.substring(4, 6)
                    acc[hc].months[mm] = Number(curr.total_count)
                    acc[hc].total += Number(curr.total_count)
                    return acc
                }, {})
                const tableData = Object.values(grouped).sort((a: any, b: any) => a.hospcode.localeCompare(b.hospcode))
                setMonthlyData(tableData)
            }
        } catch (e: any) {
            console.error(e)
        } finally {
            setLoadingMonthly(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        fetchMonthlyData()
    }, [selectedYear])

    const filteredData = data.filter(item =>
        item.hosname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hospcode.includes(searchTerm)
    )

    const totalCount = data.reduce((acc, curr) => acc + Number(curr.total_patients || 0), 0)

    // Calculate monthly totals
    const monthTotals = MONTHS.reduce((acc: any, m) => {
        acc[m.key] = monthlyData.reduce((sum, row) => sum + (row.months[m.key] || 0), 0)
        return acc
    }, {})
    const grandMonthlyTotal = monthlyData.reduce((sum, row) => sum + row.total, 0)

    const chartData = filteredData.map(item => ({
        name: item.hosname.replace('รพ.สต.', '').replace('โรงพยาบาลส่งเสริมสุขภาพตำบล', ''),
        total: Number(item.total_patients || 0)
    }))

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
            {/* Top Controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                {/* Dropdown เลือกปีงบประมาณ */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <Calendar size={18} color="var(--text-muted)" />
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>ปีงบฯ</span>
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(e.target.value)}
                        style={{ padding: '4px', border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
                    >
                        {Array.from({ length: 15 }, (_, i) => 2569 - i).map(year => (
                            <option key={year} value={year.toString()}>{year}</option>
                        ))}
                    </select>
                </div>

                <button onClick={() => { fetchData(); fetchMonthlyData(); }} disabled={loading || loadingMonthly} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '8px',
                    background: 'var(--accent)', color: 'white', border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px'
                }}>
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    รีเฟรช
                </button>
            </div>

            {error && (
                <div style={{ padding: '16px', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fda4af', color: '#e11d48' }}>
                    ❌ <strong>Error:</strong> {error}
                </div>
            )}

            {/* Monthly Table Section (Moved to Top) */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TableIcon size={20} color="var(--accent)" />
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ข้อมูลการให้วัคซีน HBV แยก 12 เดือน (ปีงบฯ {selectedYear})
                    </h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--bg-primary)' }}>
                            <tr>
                                <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>หน่วยบริการ</th>
                                {MONTHS.map(m => (
                                    <th key={m.key} style={{ padding: '14px 10px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>{m.name}</th>
                                ))}
                                <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--accent)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>รวมทั้งสิ้น</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingMonthly ? (
                                <tr><td colSpan={14} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังประมวลผลข้อมูล...</td></tr>
                            ) : monthlyData.length === 0 ? (
                                <tr><td colSpan={14} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>ไม่พบข้อมูลของการให้บริการในปีงบประมาณ {selectedYear}</td></tr>
                            ) : monthlyData.map((row, i) => (
                                <tr key={row.hospcode} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                                    <td style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 500, borderRight: '1px solid var(--border)' }}>
                                        {row.hosname} <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>({row.hospcode})</span>
                                    </td>
                                    {MONTHS.map(m => {
                                        const val = row.months[m.key] || 0
                                        const isEmpty = val === 0

                                        return (
                                            <td
                                                key={m.key}
                                                style={{
                                                    padding: '12px 10px',
                                                    fontSize: '13px',
                                                    textAlign: 'center',
                                                    color: isEmpty ? '#ef4444' : 'var(--text-primary)',
                                                    fontWeight: isEmpty ? 400 : 500,
                                                }}
                                            >
                                                {isEmpty ? '-' : val.toLocaleString()}
                                            </td>
                                        )
                                    })}
                                    <td style={{ padding: '12px 20px', fontSize: '14px', textAlign: 'center', fontWeight: 700, color: 'var(--accent)', borderLeft: '1px solid var(--border)' }}>
                                        {row.total.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {monthlyData.length > 0 && (
                            <tfoot style={{ background: 'var(--bg-primary)', fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                                <tr>
                                    <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: '14px', borderRight: '1px solid var(--border)' }}>สะสมรายเดือน</td>
                                    {MONTHS.map(m => (
                                        <td key={m.key} style={{ padding: '14px 10px', textAlign: 'center', fontSize: '13px', color: 'var(--text-primary)' }}>
                                            {monthTotals[m.key].toLocaleString()}
                                        </td>
                                    ))}
                                    <td style={{ padding: '14px 20px', textAlign: 'center', fontSize: '16px', color: 'var(--accent)', borderLeft: '1px solid var(--border)', background: 'rgba(var(--accent-rgb), 0.05)' }}>
                                        {grandMonthlyTotal.toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Title Section for Target Population */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Syringe color="#f59e0b" size={28} /> ประชากรที่ยังไม่ได้รับวัคซีน HBV (ปีงบ 69)
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        ประชากร (Type 1, 3) ที่มีผลตรวจ HBsAg เป็น Negative และยังได้รับวัคซีนไม่ครบ 3 เข็ม (คัดกรองตั้งแต่ 1 ต.ค. 2568)
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
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Summary Widget */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '350px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle color="#d97706" size={24} />
                </div>
                <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>จำนวนเป้าหมายที่ยังไม่ได้รับวัคซีน</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalCount.toLocaleString()} <span style={{ fontSize: '14px' }}>ราย</span></div>
                </div>
            </div>

            {/* Bar Chart Section */}
            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={20} color="var(--accent)" /> กราฟแสดงจำนวนเป้าหมายแยกตามหน่วยบริการ
                </h2>
                <div style={{ height: '400px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} style={{ fontSize: '11px', fontWeight: 500 }} />
                            <YAxis style={{ fontSize: '12px' }} />
                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                            <Bar dataKey="total" name="จำนวนที่ยังไม่ได้รับวัคซีน" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="total" position="top" style={{ fontSize: '11px', fill: 'var(--text-muted)' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>


        </div>
    )
}
