'use client'

import { useState, useEffect } from 'react'
import {
    BarChart3,
    Table as TableIcon,
    Activity,
    RefreshCw,
    Search,
    Stethoscope,
    Calendar
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Legend,
    LabelList
} from 'recharts'

interface LdlData {
    hospcode: string
    hosname: string
    target_count: number
    achievement_count: number
}

// เดือนสำหรับปีงบประมาณ 2569 (ต.ค. 68 - ก.ย. 69)
const MONTHS_FY69 = [
    { value: '202510', label: 'ตุลาคม 2568' },
    { value: '202511', label: 'พฤศจิกายน 2568' },
    { value: '202512', label: 'ธันวาคม 2568' },
    { value: '202601', label: 'มกราคม 2569' },
    { value: '202602', label: 'กุมภาพันธ์ 2569' },
    { value: '202603', label: 'มีนาคม 2569' },
    { value: '202604', label: 'เมษายน 2569' },
    { value: '202605', label: 'พฤษภาคม 2569' },
    { value: '202606', label: 'มิถุนายน 2569' },
    { value: '202607', label: 'กรกฎาคม 2569' },
    { value: '202608', label: 'สิงหาคม 2569' },
    { value: '202609', label: 'กันยายน 2569' },
]

export default function DmLdlPage() {
    const [data, setData] = useState<LdlData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedMonth, setSelectedMonth] = useState(MONTHS_FY69[0].value)

    const fetchData = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`/api/chronic?type=dm-ldl&month=${selectedMonth}`)
            const json = await res.json()
            if (!json.success) throw new Error(json.error)
            setData(json.data)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [selectedMonth])

    const filteredData = data.filter(item =>
        item.hosname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hospcode.includes(searchTerm)
    )

    const totals = data.reduce((acc, curr) => ({
        target_count: acc.target_count + Number(curr.target_count || 0),
        achievement_count: acc.achievement_count + Number(curr.achievement_count || 0)
    }), { target_count: 0, achievement_count: 0 })

    const totalPercent = totals.target_count > 0
        ? ((totals.achievement_count / totals.target_count) * 100).toFixed(2)
        : '0.00'

    const chartData = filteredData.map(item => {
        const target = Number(item.target_count || 0)
        const ach = Number(item.achievement_count || 0)
        const pct = target > 0 ? ((ach / target) * 100).toFixed(2) : 0
        return {
            name: item.hosname.replace('รพ.สต.', '').replace('โรงพยาบาลส่งเสริมสุขภาพตำบล', ''),
            target,
            achievement: ach,
            percent: Number(pct)
        }
    })

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Stethoscope color="var(--accent)" size={28} /> ร้อยละของผู้ป่วยเบาหวานที่ได้รับการตรวจไขมัน LDL
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        ตัวชี้วัดปี 2569: ผู้ป่วยโรคเบาหวาน (DM) ได้รับการตรวจระดับไขมัน (LDL Cholesterol)
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>

                    {/* Dropdown เดือน */}
                    <div style={{ position: 'relative' }}>
                        <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{
                                padding: '8px 12px 8px 36px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-card)',
                                fontSize: '14px',
                                outline: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-primary)',
                            }}
                        >
                            <optgroup label="ปีงบประมาณ 2569">
                                {MONTHS_FY69.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

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
                                minWidth: '220px',
                                outline: 'none',
                            }}
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

            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity color="#0369a1" size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>จำนวนผู้ป่วย DM ทั้งหมด (เป้า)</div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{totals.target_count.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500 }}>ราย</span></div>
                    </div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity color="#15803d" size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ได้รับการตรวจ LDL (ผลงาน)</div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{totals.achievement_count.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500 }}>ราย</span></div>
                    </div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart3 color="#a16207" size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ร้อยละความสำเร็จ</div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalPercent} <span style={{ fontSize: '14px', fontWeight: 500 }}>%</span></div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>

                {/* Chart */}
                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BarChart3 size={20} color="var(--accent)" />
                        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>กราฟร้อยละการตรวจ LDL (หน่วยบริการ)</h2>
                    </div>
                    <div style={{ height: '360px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={70} style={{ fontSize: '11px', fontWeight: 500 }} />
                                <YAxis domain={[0, 100]} style={{ fontSize: '12px' }} />
                                <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)', padding: '12px' }} />
                                <Bar dataKey="percent" name="ร้อยละ (%)" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={32}>
                                    <LabelList dataKey="percent" position="top" style={{ fontSize: '11px', fill: 'var(--text-muted)' }} formatter={(v: unknown) => Number(v) > 0 ? Number(v) + '%' : ''} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Table */}
                <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <TableIcon size={20} color="var(--accent)" />
                        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>ข้อมูลตารางแยกราย รพ.สต.</h2>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'var(--bg-primary)', position: 'sticky', top: 0, zIndex: 5 }}>
                                <tr>
                                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>รหัส</th>
                                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>ชื่อหน่วยบริการ</th>
                                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#0369a1', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>เป้า (คน)</th>
                                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#15803d', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>ผลงาน (คน)</th>
                                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--accent)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>ร้อยละ (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>ไม่พบข้อมูลตามเงื่อนไข</td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, idx) => {
                                        const t = Number(item.target_count || 0)
                                        const a = Number(item.achievement_count || 0)
                                        const p = t > 0 ? ((a / t) * 100).toFixed(2) : '0.00'
                                        return (
                                            <tr key={item.hospcode} style={{
                                                background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                                            }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)'}>
                                                <td style={{ padding: '14px 24px', fontSize: '14px', color: 'var(--text-muted)' }}>{item.hospcode}</td>
                                                <td style={{ padding: '14px 24px', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.hosname}</td>
                                                <td style={{ padding: '14px 24px', fontSize: '14px', textAlign: 'center', fontWeight: 600, color: '#0369a1' }}>{t.toLocaleString()}</td>
                                                <td style={{ padding: '14px 24px', fontSize: '14px', textAlign: 'center', fontWeight: 600, color: '#16a34a' }}>{a.toLocaleString()}</td>
                                                <td style={{ padding: '14px 24px', fontSize: '14px', textAlign: 'center', fontWeight: 700, color: 'var(--accent)' }}>{p}</td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                            <tfoot style={{ background: 'var(--bg-primary)', fontWeight: 700 }}>
                                <tr>
                                    <td colSpan={2} style={{ padding: '16px 24px', textAlign: 'right', fontSize: '15px' }}>รวมทั้งสิ้น</td>
                                    <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '16px', color: '#0369a1' }}>{totals.target_count.toLocaleString()}</td>
                                    <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '16px', color: '#16a34a' }}>{totals.achievement_count.toLocaleString()}</td>
                                    <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '18px', color: 'var(--accent)', background: 'rgba(var(--accent-rgb), 0.05)' }}>
                                        {totalPercent}%
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
