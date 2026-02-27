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
    AlertCircle
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

interface ChronicData {
    hospcode: string
    hosname: string
    total_patients: number
}

export default function HCVNoVaccinePage() {
    const [data, setData] = useState<ChronicData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    const fetchData = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/chronic?type=hcv-no-vaccine')
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
    }, [])

    const filteredData = data.filter(item =>
        item.hosname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hospcode.includes(searchTerm)
    )

    const totalCount = data.reduce((acc, curr) => acc + Number(curr.total_patients || 0), 0)

    const chartData = filteredData.map(item => ({
        name: item.hosname.replace('รพ.สต.', '').replace('โรงพยาบาลส่งเสริมสุขภาพตำบล', ''),
        total: Number(item.total_patients || 0)
    }))

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Syringe color="#ec4899" size={28} /> ประชากรที่ยังไม่ได้รับการตรวจ/วัคซีน HCV (ปีงบ 69)
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        เป้าหมายประชากร (Type 1, 3) ที่ยังไม่มีประวัติในแฟ้ม EPI (HCV) ตั้งแต่ 1 ต.ค. 2568
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
                    <button onClick={fetchData} disabled={loading} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', borderRadius: '8px',
                        background: 'var(--accent)', color: 'white', border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px'
                    }}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        รีเฟรช
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: '16px', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fda4af', color: '#e11d48' }}>
                    ❌ <strong>Error:</strong> {error}
                </div>
            )}

            <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '350px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle color="#be185d" size={24} />
                </div>
                <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>จำนวนเป้าหมายที่ยังไม่ดำเนินการ</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalCount.toLocaleString()} <span style={{ fontSize: '14px' }}>ราย</span></div>
                </div>
            </div>

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
                            <Bar dataKey="total" name="จำนวนที่ยังไม่ดำเนินการ" fill="#ec4899" radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="total" position="top" style={{ fontSize: '11px', fill: 'var(--text-muted)' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>ข้อมูลตารางแยกราย รพ.สต.</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--bg-primary)' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>รหัส</th>
                                <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>หน่วยบริการ</th>
                                <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>จำนวนที่ยังไม่ดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center' }}>กำลังโหลดข้อมูล...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center' }}>ไม่พบข้อมูล</td></tr>
                            ) : (
                                filteredData.map((item, idx) => (
                                    <tr key={item.hospcode} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                                        <td style={{ padding: '14px 24px', fontSize: '14px', color: 'var(--text-muted)' }}>{item.hospcode}</td>
                                        <td style={{ padding: '14px 24px', fontSize: '14px', fontWeight: 500 }}>{item.hosname}</td>
                                        <td style={{ padding: '14px 24px', fontSize: '14px', textAlign: 'center', fontWeight: 700, color: '#be185d' }}>{Number(item.total_patients).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot style={{ background: 'var(--bg-primary)', fontWeight: 700 }}>
                            <tr>
                                <td colSpan={2} style={{ padding: '16px 24px', textAlign: 'right' }}>รวมทั้งสิ้น</td>
                                <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '18px', color: 'var(--accent)' }}>{totalCount.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    )
}
