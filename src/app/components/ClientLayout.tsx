'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

const MENU_LABELS: Record<string, string> = {
    '/': 'ภาพรวม Dashboard',
    '/map': 'แผนที่หน่วยบริการ',
    '/population': 'ประชากรทั้งหมด',
    '/population/house': 'หลังคาเรือน',
    '/population/age': 'แยกตามช่วงอายุ',
    '/opd': 'บริการผู้ป่วยนอก (OPD)',
    '/opd/visit': 'การให้บริการ OPD',
    '/opd/diag': 'การวินิจฉัยโรค OPD',
    '/opd/drug': 'การจ่ายยา',
    '/ipd': 'บริการผู้ป่วยใน (IPD)',
    '/ipd/admit': 'การรับไว้รักษา IPD',
    '/ipd/diag': 'การวินิจฉัยโรค IPD',
    '/chronic': 'โรคเรื้อรัง (NCD)',
    '/chronic/dm': 'เบาหวาน',
    '/chronic/ht': 'ความดันโลหิตสูง',
    '/mcwh': 'อนามัยแม่และเด็ก',
    '/epi': 'สร้างเสริมภูมิคุ้มกัน',
    '/lab': 'ห้องปฏิบัติการ (LAB)',
    '/report': 'รายงาน',
    '/report/monthly': 'รายงานรายเดือน',
    '/report/annual': 'รายงานประจำปี',
    '/settings': 'ตั้งค่าระบบ',
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
            <Sidebar activePath={pathname} />

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                {/* Top bar */}
                <header style={{
                    height: '60px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    display: 'flex', alignItems: 'center',
                    padding: '0 22px', gap: '10px', flexShrink: 0,
                    boxShadow: 'var(--shadow-sm)',
                }}>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>43 แฟ้ม</span>
                        <span style={{ color: 'var(--border)' }}>›</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {MENU_LABELS[pathname] ?? 'ระบบข้อมูลสุขภาพ'}
                        </span>
                    </div>
                    <div style={{ flex: 1 }} />
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '5px 11px',
                        background: 'var(--accent-light)',
                        borderRadius: '7px',
                        border: '1px solid var(--border)',
                    }}>
                        <div style={{
                            width: '7px', height: '7px', borderRadius: '50%',
                            background: 'var(--success)',
                            animation: 'pulse-dot 2s infinite',
                        }} />
                        <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 500 }}>
                            Connected · datacenter
                        </span>
                    </div>
                </header>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                    {children}
                </div>
            </main>
        </div>
    )
}
