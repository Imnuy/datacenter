'use client'

import { useState, useEffect } from 'react'
import { FileText, Table as TableIcon, RefreshCw, Calendar, Download } from 'lucide-react'

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

export default function OPDMonthlyReportPage() {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedYear, setSelectedYear] = useState('2569')

    const fetchData = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`/api/report/monthly?year=${selectedYear}&type=visit`)
            const json = await res.json()
            if (!json.success) throw new Error(json.error)

            // แปลงข้อมูลให้อยู่ในรูปแบบตาราง: รพ.สต. -> เดือน -> จำนวน
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

                // yyyymm (e.g., '202510')
                const mm = curr.yyyymm.substring(4, 6)
                acc[hc].months[mm] = Number(curr.total_count)
                acc[hc].total += Number(curr.total_count)

                return acc
            }, {})

            // เรียงตามรหัสหน่วยบริการ
            const tableData = Object.values(grouped).sort((a: any, b: any) => a.hospcode.localeCompare(b.hospcode))
            setData(tableData)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [selectedYear])



    // คำนวณผลรวมรายเดือนในแถวสุดท้าย
    const monthTotals = MONTHS.reduce((acc: any, m) => {
        acc[m.key] = data.reduce((sum, row) => sum + (row.months[m.key] || 0), 0)
        return acc
    }, {})
    const grandTotal = data.reduce((sum, row) => sum + row.total, 0)

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText color="var(--accent)" size={28} /> บริการรายเดือน (OPD Visit)
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        ตรวจสอบการส่งมอบข้อมูลบริการ (OPD Visit) แยกรายหน่วยบริการ ในแต่ละเดือน
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

                    {/* Dropdown เลือกปีงบประมาณ (ย้อนหลัง 10 ปี) */}
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

                    <button onClick={fetchData} disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: loading ? 0.7 : 1 }}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> ดึงข้อมูล
                    </button>
                </div>
            </div>

            {error && <div style={{ padding: '16px', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fda4af', color: '#e11d48' }}>❌ <strong>Error:</strong> {error}</div>}

            {/* Table */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TableIcon size={20} color="var(--accent)" />
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ข้อมูลการส่งบริการ (OPD) แยก 12 เดือน (ปีงบฯ {selectedYear})
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
                            {loading ? (
                                <tr><td colSpan={14} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังประมวลผลข้อมูล...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={14} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>ไม่พบข้อมูลของปีงบประมาณ {selectedYear}</td></tr>
                            ) : data.map((row, i) => (
                                <tr key={row.hospcode} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)')}>
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
                        {data.length > 0 && (
                            <tfoot style={{ background: 'var(--bg-primary)', fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                                <tr>
                                    <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: '14px', borderRight: '1px solid var(--border)' }}>สะสมรายเดือน</td>
                                    {MONTHS.map(m => (
                                        <td key={m.key} style={{ padding: '14px 10px', textAlign: 'center', fontSize: '13px', color: 'var(--text-primary)' }}>
                                            {monthTotals[m.key].toLocaleString()}
                                        </td>
                                    ))}
                                    <td style={{ padding: '14px 20px', textAlign: 'center', fontSize: '16px', color: 'var(--accent)', borderLeft: '1px solid var(--border)', background: 'rgba(var(--accent-rgb), 0.05)' }}>
                                        {grandTotal.toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    )
}
