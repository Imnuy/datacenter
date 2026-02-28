'use client'

import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from 'recharts'

/* ── types ── */
export interface PageData {
    fiscalYears: string[]
    hospitals: { hoscode: string; hosname: string }[]
    funds: string[]
    fundByYear: { fiscal_year: string; fund_descr: string; total: number }[]
    hosByYear: { fiscal_year: string; hoscode: string; hosname: string; total: number }[]
    pivotData: Record<string, string | number>[]
    details: { hoscode: string; hosname: string; fiscal_year: string; transfer_date: string; fund_descr: string; efund_desc: string; total_amount: number }[]
}

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

const currency = (v: number) => v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatDateTH = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}

/* ── shared styles ── */
const card: React.CSSProperties = { border: '1px solid var(--border)', borderRadius: '14px', padding: '18px', background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }
const thS: React.CSSProperties = { textAlign: 'left', padding: '10px 14px', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', fontSize: '13px' }
const tdS: React.CSSProperties = { padding: '10px 14px', color: 'var(--text-secondary)', fontSize: '13px', borderBottom: '1px solid var(--border)' }
const selectStyle: React.CSSProperties = { height: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff', color: 'var(--text-primary)', outline: 'none', minWidth: '160px', fontSize: '13px' }

/* ── custom tooltip for pie ── */
function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) {
    if (!active || !payload?.length) return null
    const d = payload[0]
    return (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
            <strong>{d.name}</strong><br />฿{currency(d.value)}
        </div>
    )
}

/* ── main component ── */
export default function ReimbursementClient({ data }: { data: PageData }) {
    const { fiscalYears, hospitals, funds, fundByYear, hosByYear, pivotData, details } = data

    /* current Thai fiscal year: if month >= Oct (10) => year+544, else year+543 */
    const now = new Date()
    const defaultFY = String(now.getMonth() >= 9 ? now.getFullYear() + 544 : now.getFullYear() + 543)
    const initialFY = fiscalYears.includes(defaultFY) ? defaultFY : fiscalYears[0] ?? ''

    /* Section 1 state */
    const [sec1Year, setSec1Year] = useState(initialFY)

    /* Section 1 derived data */
    const pieData = useMemo(() =>
        fundByYear.filter(r => r.fiscal_year === sec1Year).map(r => ({ name: r.fund_descr, value: r.total })),
        [fundByYear, sec1Year]
    )
    const barData = useMemo(() =>
        hosByYear.filter(r => r.fiscal_year === sec1Year).map(r => ({ name: r.hosname, value: r.total, hoscode: r.hoscode })),
        [hosByYear, sec1Year]
    )
    const totalAmount = useMemo(() => pieData.reduce((s, r) => s + r.value, 0), [pieData])

    /* Section 2: fiscal year columns sorted descending */
    const fyCols = useMemo(() => [...fiscalYears].sort((a, b) => Number(b) - Number(a)), [fiscalYears])

    /* Section 3 filters */
    const [f3Hos, setF3Hos] = useState('')
    const [f3Year, setF3Year] = useState('')
    const [f3Fund, setF3Fund] = useState('')

    const filteredDetails = useMemo(() => {
        let rows = details
        if (f3Hos) rows = rows.filter(r => r.hoscode === f3Hos)
        if (f3Year) rows = rows.filter(r => r.fiscal_year === f3Year)
        if (f3Fund) rows = rows.filter(r => r.fund_descr === f3Fund)
        return rows
    }, [details, f3Hos, f3Year, f3Fund])

    const f3Total = useMemo(() => filteredDetails.reduce((s, r) => s + r.total_amount, 0), [filteredDetails])

    const exportDetailsToExcel = () => {
        const rows = filteredDetails.map((row) => ({
            รหัส: row.hoscode,
            หน่วยบริการ: row.hosname,
            ปีงบ: row.fiscal_year,
            วันโอน: formatDateTH(row.transfer_date),
            กองทุน: row.fund_descr,
            กองทุนย่อย: row.efund_desc,
            ยอดรับ: row.total_amount,
        }))

        const worksheet = XLSX.utils.json_to_sheet(rows)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'รายการโอนเงิน')

        const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
        XLSX.writeFile(workbook, `reimbursement-transfers-${ts}.xlsx`)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <header style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Reimbursement</p>
                <h1 style={{ margin: 0, fontSize: '30px', color: 'var(--text-primary)', fontWeight: 700 }}>การจัดเก็บรายได้</h1>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                    แหล่งข้อมูลจากระบบบริหารการเบิกจ่ายกองทุนหลักประกันสุขภาพแห่งชาติ (Smart Money Transfer)
                </p>
            </header>

            {/* ═══════ SECTION 1: ภาพรวมอำเภอ ═══════ */}
            <section style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)' }}>ภาพรวมอำเภอ</h2>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                            ยอดรวม ฿{currency(totalAmount)} — ปีงบประมาณ {sec1Year}
                        </p>
                    </div>
                    <select value={sec1Year} onChange={e => setSec1Year(e.target.value)} style={selectStyle}>
                        {fiscalYears.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 2fr)', gap: '20px' }}>
                    {/* Pie Chart — by fund_descr */}
                    <div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--text-secondary)' }}>สัดส่วนตามกองทุน</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2} label={false}>
                                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                                <Legend
                                    align="left"
                                    verticalAlign="bottom"
                                    content={() => (
                                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', textAlign: 'left' }}>
                                            {pieData.map((item, i) => (
                                                <li
                                                    key={`${item.name}-${i}`}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: 8,
                                                        marginBottom: 4,
                                                        fontSize: 11,
                                                        color: 'var(--text-secondary)',
                                                        paddingLeft: 0,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: 2,
                                                            background: COLORS[i % COLORS.length],
                                                            marginTop: 3,
                                                            flex: '0 0 10px',
                                                        }}
                                                    />
                                                    <span>
                                                        {item.name} รวม <strong style={{ fontWeight: 700 }}>{currency(item.value)}</strong> บาท
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Bar Chart — by hoscode/hosname */}
                    <div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--text-secondary)' }}>ยอดรวมตามหน่วยบริการ</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis type="number" tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} style={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="name" width={130} style={{ fontSize: 11 }} tick={{ fill: 'var(--text-secondary)' }} />
                                <Tooltip formatter={(v) => [`฿${currency(Number(v))}`, 'ยอดรับ']} />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                    {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    <LabelList dataKey="value" position="right" formatter={(v) => `฿${(Number(v) / 1000).toFixed(1)}k`} style={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* ═══════ SECTION 2: สรุปยอดรายหน่วยบริการ × ปีงบ ═══════ */}
            <section style={{ ...card, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '18px', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>สรุปยอดรายหน่วยบริการ</h2>
                    <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>แสดงยอดรวมแต่ละปีงบประมาณ แยกตามหน่วยบริการ</p>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-primary)' }}>
                                <th style={thS}>รหัส</th>
                                <th style={thS}>หน่วยบริการ</th>
                                {fyCols.map(fy => <th key={fy} style={{ ...thS, textAlign: 'right' }}>ปีงบ {fy}</th>)}
                                <th style={{ ...thS, textAlign: 'right' }}>รวมทุกปี</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pivotData.map((row) => {
                                const rowTotal = fyCols.reduce((s, fy) => s + (Number(row[`fy${fy}`]) || 0), 0)
                                return (
                                    <tr key={String(row.hoscode)}>
                                        <td style={tdS}>{row.hoscode}</td>
                                        <td style={tdS}>{row.hosname}</td>
                                        {fyCols.map(fy => {
                                            const v = Number(row[`fy${fy}`]) || 0
                                            return <td key={fy} style={{ ...tdS, textAlign: 'right', fontWeight: 500 }}>{v ? `฿${currency(v)}` : '—'}</td>
                                        })}
                                        <td style={{ ...tdS, textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>฿{currency(rowTotal)}</td>
                                    </tr>
                                )
                            })}
                            {/* Grand total row */}
                            <tr style={{ background: 'var(--bg-primary)', fontWeight: 700 }}>
                                <td style={tdS} colSpan={2}>รวมทั้งอำเภอ</td>
                                {fyCols.map(fy => {
                                    const colTotal = pivotData.reduce((s, row) => s + (Number(row[`fy${fy}`]) || 0), 0)
                                    return <td key={fy} style={{ ...tdS, textAlign: 'right', fontWeight: 700 }}>฿{currency(colTotal)}</td>
                                })}
                                <td style={{ ...tdS, textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>
                                    ฿{currency(pivotData.reduce((s, row) => s + fyCols.reduce((ss, fy) => ss + (Number(row[`fy${fy}`]) || 0), 0), 0))}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ═══════ SECTION 3: รายการโอนเงิน (กรองได้) ═══════ */}
            <section style={{ ...card, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '18px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>รายการโอนเงิน</h2>
                        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>
                            {filteredDetails.length.toLocaleString()} รายการ — ยอดรวม ฿{currency(f3Total)}
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                        <select value={f3Hos} onChange={e => setF3Hos(e.target.value)} style={selectStyle}>
                            <option value="">หน่วยบริการ: ทั้งหมด</option>
                            {hospitals.map(h => <option key={h.hoscode} value={h.hoscode}>{h.hoscode} - {h.hosname}</option>)}
                        </select>
                        <select value={f3Year} onChange={e => setF3Year(e.target.value)} style={selectStyle}>
                            <option value="">ปีงบ: ทั้งหมด</option>
                            {fiscalYears.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                        </select>
                        <select value={f3Fund} onChange={e => setF3Fund(e.target.value)} style={selectStyle}>
                            <option value="">กองทุน: ทั้งหมด</option>
                            {funds.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        {(f3Hos || f3Year || f3Fund) && (
                            <button
                                type="button"
                                onClick={() => { setF3Hos(''); setF3Year(''); setF3Fund('') }}
                                style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}
                            >
                                ล้างตัวกรอง
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={exportDetailsToExcel}
                            disabled={filteredDetails.length === 0}
                            style={{
                                height: 36,
                                padding: '0 14px',
                                borderRadius: 8,
                                border: '1px solid var(--accent)',
                                background: '#fff',
                                color: 'var(--accent)',
                                cursor: filteredDetails.length === 0 ? 'not-allowed' : 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                                opacity: filteredDetails.length === 0 ? 0.6 : 1,
                            }}
                        >
                            ส่งออก Excel
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto', maxHeight: '520px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr style={{ background: 'var(--bg-primary)' }}>
                                <th style={thS}>รหัส</th>
                                <th style={thS}>หน่วยบริการ</th>
                                <th style={thS}>ปีงบ</th>
                                <th style={thS}>วันโอน</th>
                                <th style={thS}>กองทุน</th>
                                <th style={thS}>กองทุนย่อย</th>
                                <th style={{ ...thS, textAlign: 'right' }}>ยอดรับ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDetails.map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={tdS}>{row.hoscode}</td>
                                    <td style={tdS}>{row.hosname}</td>
                                    <td style={tdS}>{row.fiscal_year}</td>
                                    <td style={tdS}>{formatDateTH(row.transfer_date)}</td>
                                    <td style={tdS}>{row.fund_descr}</td>
                                    <td style={tdS}>{row.efund_desc}</td>
                                    <td style={{ ...tdS, textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>฿{currency(row.total_amount)}</td>
                                </tr>
                            ))}
                            {filteredDetails.length === 0 && (
                                <tr><td colSpan={7} style={{ ...tdS, textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>ไม่พบข้อมูล</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}
