'use client'

import { useState, useEffect } from 'react'
import {
    Users, Hospital, Activity, Heart, BarChart3,
    FlaskConical, Baby, Syringe, Home, Building2,
} from 'lucide-react'
import { getDashboardSummary, DashboardSummary } from '@/app/actions/dashboard'

interface StatCardProps {
    title: string
    value: string
    sub?: string
    icon: React.ReactNode
    color: string
    highlight?: boolean
}

function StatCard({ title, value, sub, icon, color, highlight }: StatCardProps) {
    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
        }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{title}</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
                    {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
                </div>
                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    {icon}
                </div>
            </div>
        </div>
    )
}

function SectionLabel({ label }: { label: string }) {
    return (
        <div style={{
            gridColumn: '1 / -1',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '6px',
            marginTop: '8px',
        }}>
            {label}
        </div>
    )
}

export default function DashboardOverview() {
    const [data, setData] = useState<DashboardSummary | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getDashboardSummary()
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const fmt = (n: number | undefined) => n !== undefined ? n.toLocaleString() : '—'
    const v = (n: number | undefined) => loading ? '...' : fmt(n)

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Title */}
            <div>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    ภาพรวม Dashboard
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    ข้อมูลภาพรวม อ.วัดโบสถ์ · ปีงบประมาณ 2569
                </p>
            </div>

            {/* ===== กลุ่ม 1: ภาพรวมพื้นที่ ===== */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '14px',
            }}>
                <SectionLabel label="📍 ภาพรวมพื้นที่" />
                <StatCard
                    title="หน่วยบริการ"
                    value={v(data?.hospitals)}
                    sub="รพ.สต. ในเครือข่าย"
                    icon={<Building2 size={22} color="white" />}
                    color="linear-gradient(135deg,#0f766e,#14b8a6)"
                    highlight
                />
                <StatCard
                    title="ประชากรทั้งหมด"
                    value={v(data?.population)}
                    sub="Type 1, 3 ยังไม่จำหน่าย"
                    icon={<Users size={22} color="white" />}
                    color="linear-gradient(135deg,#3b82f6,#6366f1)"
                    highlight
                />
                <StatCard
                    title="หลังคาเรือน"
                    value={v(data?.houses)}
                    sub="จำนวนครัวเรือน"
                    icon={<Home size={22} color="white" />}
                    color="linear-gradient(135deg,#7c3aed,#a855f7)"
                    highlight
                />
            </div>

            {/* ===== กลุ่ม 2: บริการสุขภาพ (ปีงบ 69) ===== */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '14px',
            }}>
                <SectionLabel label="🏥 บริการสุขภาพ ปีงบ 69" />
                <StatCard
                    title="ผู้รับบริการ OPD"
                    value={v(data?.opd)}
                    sub="ครั้งที่มารับบริการ"
                    icon={<Hospital size={22} color="white" />}
                    color="linear-gradient(135deg,#10b981,#059669)"
                />
                <StatCard
                    title="LAB ผลตรวจ"
                    value={v(data?.lab)}
                    sub="รายการตรวจทั้งหมด"
                    icon={<FlaskConical size={22} color="white" />}
                    color="linear-gradient(135deg,#8b5cf6,#7c3aed)"
                />
                <StatCard
                    title="วัคซีน EPI"
                    value={v(data?.epi)}
                    sub="ครั้งที่ฉีด"
                    icon={<Syringe size={22} color="white" />}
                    color="linear-gradient(135deg,#06b6d4,#0891b2)"
                />
            </div>

            {/* ===== กลุ่ม 3: โรคเรื้อรัง & แม่และเด็ก ===== */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '14px',
            }}>
                <SectionLabel label="❤️ โรคเรื้อรัง & แม่และเด็ก" />
                <StatCard
                    title="ผู้ป่วยโรคเรื้อรัง"
                    value={v(data?.chronic)}
                    sub="DM + HT (คนไม่ซ้ำ)"
                    icon={<Heart size={22} color="white" />}
                    color="linear-gradient(135deg,#ef4444,#dc2626)"
                />
                <StatCard
                    title="ANC ฝากครรภ์"
                    value={v(data?.anc)}
                    sub="ครั้งที่มารับบริการ"
                    icon={<Baby size={22} color="white" />}
                    color="linear-gradient(135deg,#ec4899,#db2777)"
                />
                <StatCard
                    title="คลอด"
                    value={v(data?.birth)}
                    sub="จำนวนการคลอด ปีงบ 69"
                    icon={<Activity size={22} color="white" />}
                    color="linear-gradient(135deg,#f59e0b,#d97706)"
                />
            </div>
        </div>
    )
}
