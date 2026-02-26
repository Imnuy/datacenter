'use client'

import {
    Users, Hospital, Activity, Heart, BarChart3,
    TrendingUp, FlaskConical, Baby, Syringe,
    ArrowUpRight, ArrowDownRight,
} from 'lucide-react'

interface StatCardProps {
    title: string
    value: string
    sub?: string
    icon: React.ReactNode
    color: string
    trend?: number
}

function StatCard({ title, value, sub, icon, color, trend }: StatCardProps) {
    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
        }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                    ; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                    ; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{title}</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
                    {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
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
            {trend !== undefined && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: trend >= 0 ? 'var(--success)' : 'var(--danger)',
                }}>
                    {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span>{Math.abs(trend)}% จากเดือนที่แล้ว</span>
                </div>
            )}
        </div>
    )
}

const stats = [
    {
        title: 'ประชากรทั้งหมด',
        value: '—',
        sub: 'ข้อมูลจาก person',
        icon: <Users size={22} color="white" />,
        color: 'linear-gradient(135deg,#3b82f6,#6366f1)',
        trend: 0.8,
    },
    {
        title: 'ผู้รับบริการ OPD',
        value: '—',
        sub: 'ปีงบประมาณ 2568',
        icon: <Hospital size={22} color="white" />,
        color: 'linear-gradient(135deg,#10b981,#059669)',
        trend: 2.3,
    },
    {
        title: 'ผู้ป่วยใน IPD',
        value: '—',
        sub: 'ปีงบประมาณ 2568',
        icon: <Activity size={22} color="white" />,
        color: 'linear-gradient(135deg,#f59e0b,#d97706)',
        trend: -1.2,
    },
    {
        title: 'ผู้ป่วยโรคเรื้อรัง',
        value: '—',
        sub: 'DM + HT',
        icon: <Heart size={22} color="white" />,
        color: 'linear-gradient(135deg,#ef4444,#dc2626)',
        trend: 1.5,
    },
    {
        title: 'LAB ทั้งหมด',
        value: '—',
        sub: 'รายการตรวจ',
        icon: <FlaskConical size={22} color="white" />,
        color: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
        trend: 3.1,
    },
    {
        title: 'ANC / MCH',
        value: '—',
        sub: 'ฝากครรภ์-หลังคลอด',
        icon: <Baby size={22} color="white" />,
        color: 'linear-gradient(135deg,#ec4899,#db2777)',
        trend: 0.5,
    },
    {
        title: 'วัคซีน EPI',
        value: '—',
        sub: 'ครั้งที่ฉีด',
        icon: <Syringe size={22} color="white" />,
        color: 'linear-gradient(135deg,#06b6d4,#0891b2)',
        trend: -0.3,
    },
    {
        title: 'รายงานสะสม',
        value: '—',
        sub: 'ทุกแฟ้มข้อมูล',
        icon: <BarChart3 size={22} color="white" />,
        color: 'linear-gradient(135deg,#f97316,#ea580c)',
        trend: 5.0,
    },
]

export default function DashboardOverview() {
    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Title */}
            <div>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    ภาพรวม Dashboard
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    ข้อมูลจากฐานข้อมูล f43watbot · 192.168.101.135
                </p>
            </div>

            {/* Stat Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '16px',
            }}>
                {stats.map(s => <StatCard key={s.title} {...s} />)}
            </div>

            {/* Info Banner */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(59,130,246,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <TrendingUp size={24} color="var(--accent)" />
                </div>
                <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        ระบบข้อมูล 43 แฟ้ม
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        เชื่อมต่อกับฐานข้อมูล MySQL at <code style={{ color: 'var(--accent)', fontSize: '12px' }}>192.168.101.135</code> · database: <code style={{ color: 'var(--accent)', fontSize: '12px' }}>f43watbot</code>
                        {' '}· user: <code style={{ color: 'var(--accent)', fontSize: '12px' }}>root</code> · เลือกเมนูด้านซ้ายเพื่อดูข้อมูล
                    </div>
                </div>
            </div>
        </div>
    )
}
