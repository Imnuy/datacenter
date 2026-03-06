'use client'

import { useState, useEffect } from 'react'
import {
    Plus,
    Search,
    RefreshCw,
    Home,
    Loader2,
    X,
    LayoutGrid,
    BarChart3,
    Activity
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell,
    LabelList
} from 'recharts'

interface Temple {
    รหัส: string              // Column A in Sheet
    "ชื่อรพ.สต.": string       // Column B in Sheet
    วัด: string               // Column C in Sheet
    จำนวนพระ: number | string // Column D in Sheet
    จำนวนพระสูบบุหรี่: number | string // Column E in Sheet
    "ip address"?: string    // Column G in Sheet
    "วันที่อัพเดต"?: string    // Column F in Sheet
    [key: string]: any
}

interface Hospital {
    hospcode: string
    hosname: string
}

const API_URL = 'https://script.google.com/macros/s/AKfycbxdolDGQzJ3BM_qa3vi83JNeYAG3hBKOni2-r9Ukqkpy8J34KKmCOoQUQzyKHdlgn3I/exec'

export default function WatBotSurveyPage() {
    const [temples, setTemples] = useState<Temple[]>([])
    const [hospitals, setHospitals] = useState<Hospital[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table')

    // Form state - Using standard field names matching DB
    const [formData, setFormData] = useState({
        hospcode: '',
        hosname: '',
        wat: '',
        total: '',
        smoking: ''
    })

    const fetchHospitals = async () => {
        try {
            const res = await fetch('/api/survey/hospitals')
            const json = await res.json()
            if (json.success) {
                setHospitals(json.data)
            }
        } catch (e) {
            console.error('Fetch hospitals error:', e)
        }
    }

    const fetchTemples = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await fetch(API_URL)
            const data = await response.json()
            setTemples(Array.isArray(data) ? data : (data.data || []))
        } catch (err: any) {
            console.error('Fetch error:', err)
            setError('ไม่สามารถโหลดข้อมูลได้ หรือติดปัญหา CORS/Deployment')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTemples()
        fetchHospitals()
    }, [])

    const handleHospitalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const hospcode = e.target.value
        const selectedHosp = hospitals.find(h => h.hospcode === hospcode)
        if (selectedHosp) {
            setFormData({
                ...formData,
                hospcode: selectedHosp.hospcode,
                hosname: selectedHosp.hosname
            })
        } else {
            setFormData({ ...formData, hospcode: '', hosname: '' })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')

        try {
            let clientIp = 'unknown'
            try {
                const ipRes = await fetch('https://api.ipify.org?format=json')
                const ipData = await ipRes.json()
                clientIp = ipData.ip
            } catch (err) {
                console.error('Failed to get IP:', err)
            }

            const payload = {
                action: 'add',
                hospcode: formData.hospcode,
                hosname: formData.hosname,
                wat: formData.wat,
                total: formData.total,
                smoking: formData.smoking,
                ip: clientIp
            }

            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            setShowForm(false)
            setFormData({ hospcode: '', hosname: '', wat: '', total: '', smoking: '' })
            alert('บันทึกข้อมูลสำเร็จ\nข้อมูลจะแสดงหลังจากกดรีเฟรชสักครู่')
            setTimeout(fetchTemples, 2500)
        } catch (err: any) {
            setError('ไม่สามารถบันทึกข้อมูลได้: ' + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const filteredTemples = temples.filter(t =>
        (t.วัด?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t["ชื่อรพ.สต."]?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.รหัส?.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const chartData = filteredTemples
        .map(t => {
            const totalMonks = Number(t.จำนวนพระ) || 0
            const smokingMonks = Number(t.จำนวนพระสูบบุหรี่) || 0
            const percentage = totalMonks > 0 ? (smokingMonks / totalMonks) * 100 : 0
            return {
                name: t.วัด,
                total: totalMonks,
                smoking: smokingMonks,
                percentage: parseFloat(percentage.toFixed(1))
            }
        })
        .sort((a, b) => b.percentage - a.percentage)

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: 'white', padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}>
                    <p style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{label}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>จำนวนพระทั้งหมด: <strong>{payload[0].payload.total}</strong> รูป</p>
                        <p style={{ fontSize: '13px', color: '#e11d48' }}>จำนวนพระที่สูบบุหรี่: <strong>{payload[0].payload.smoking}</strong> รูป</p>
                        <p style={{ fontSize: '13px', color: '#ef4444', borderTop: '1px solid #fee2e2', paddingTop: '4px', marginTop: '4px' }}>
                            ร้อยละ: <strong style={{ fontSize: '16px' }}>{payload[0].value}%</strong>
                        </p>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', background: 'var(--accent-mid)', borderRadius: '12px', color: 'var(--accent)', display: 'flex' }}>
                            <Home size={24} />
                        </div>
                        ข้อมูลวัด อำเภอวัดโบสถ์
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        สถิติจำนวนพระสงฆ์และการสูบบุหรี่รายวัด
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ background: '#f1f5f9', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
                        <button onClick={() => setActiveTab('table')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'table' ? 'white' : 'transparent', color: activeTab === 'table' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === 'table' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                            <LayoutGrid size={18} /> ตารางข้อมูล
                        </button>
                        <button onClick={() => setActiveTab('chart')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'chart' ? 'white' : 'transparent', color: activeTab === 'chart' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === 'chart' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                            <BarChart3 size={18} /> กราฟวิเคราะห์
                        </button>
                    </div>

                    <button onClick={fetchTemples} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: 'white', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: 'var(--accent)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, boxShadow: '0 4px 12px rgba(var(--accent-rgb), 0.2)' }}>
                        <Plus size={18} /> เพิ่มข้อมูล
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fda4af', color: '#e11d48', fontSize: '14px' }}>
                    ⚠️ {error}
                </div>
            )}

            <div style={{ position: 'relative', marginBottom: '24px' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="ค้นหาชื่อวัด, รพ.สต., หรือรหัสหน่วยงาน..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px', border: '1px solid var(--border)', background: 'white', fontSize: '15px', outline: 'none' }} />
            </div>

            {loading && temples.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '16px', padding: '100px', textAlign: 'center', border: '1px solid var(--border)' }}>
                    <Loader2 size={40} className="animate-spin" color="var(--accent)" />
                </div>
            ) : activeTab === 'table' ? (
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>หน่วยงาน</th>
                                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>ชื่อวัด</th>
                                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>จำนวนพระ</th>
                                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>สูบบุหรี่</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTemples.length === 0 ? (
                                    <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>ไม่พบข้อมูล</td></tr>
                                ) : (
                                    filteredTemples.map((temple, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                                                <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>[{String(temple.รหัส || '').padStart(5, '0')}]</span>
                                                <span style={{ color: 'var(--text-primary)' }}>{temple["ชื่อรพ.สต."]}</span>
                                            </td>
                                            <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-primary)' }}>{temple.วัด}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700 }}>{temple.จำนวนพระ}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, color: '#e11d48', background: Number(temple.จำนวนพระสูบบุหรี่) > 0 ? '#fff1f2' : 'transparent' }}>{temple.จำนวนพระสูบบุหรี่ || 0}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', padding: '24px' }}>
                    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={20} color="#e11d48" />
                        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>ร้อยละของพระที่สูบบุหรี่ รายวัด</h2>
                    </div>
                    <div style={{ width: '100%', height: '450px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 60, left: 100, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide domain={[0, 100]} />
                                <YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 600 }} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Bar dataKey="percentage" radius={[0, 10, 10, 0]} barSize={26}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.percentage > 50 ? '#e11d48' : entry.percentage > 20 ? '#fb923c' : 'var(--accent)'} />
                                    ))}
                                    <LabelList dataKey="percentage" position="right" formatter={(v: any) => `${v}%`} style={{ fontSize: '13px', fontWeight: 700 }} offset={10} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '450px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>เพิ่มข้อมูลสำรวจ</h2>
                            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 600 }}>เลือกหน่วยงาน (รพ.สต.)</label>
                                <select required value={formData.hospcode} onChange={handleHospitalChange} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', background: 'white' }}>
                                    <option value="">-- เลือกหน่วยงาน --</option>
                                    {hospitals.map(h => (
                                        <option key={h.hospcode} value={h.hospcode}>[{h.hospcode}] {h.hosname}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}><strong>รหัส:</strong> {formData.hospcode ? String(formData.hospcode).padStart(5, '0') : '-'}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}><strong>หน่วยงาน:</strong> {formData.hosname || '-'}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 600 }}>ชื่อวัด</label>
                                <input required value={formData.wat} onChange={e => setFormData({ ...formData, wat: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} placeholder="ชื่อวัด" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 600 }}>จำนวนพระ</label>
                                    <input required type="number" value={formData.total} onChange={e => setFormData({ ...formData, total: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} placeholder="รูป" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 600 }}>สูบบุหรี่</label>
                                    <input required type="number" value={formData.smoking} onChange={e => setFormData({ ...formData, smoking: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} placeholder="รูป" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>ยกเลิก</button>
                                <button type="submit" disabled={submitting || !formData.hospcode} style={{ flex: 2, padding: '12px', borderRadius: '12px', background: 'var(--accent)', color: 'white', fontWeight: 600 }}>
                                    {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
