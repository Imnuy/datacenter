'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

const MENU_LABELS: Record<string, string> = {
    '/': 'ภาพรวม Dashboard',
    '/map': 'แผนที่หน่วยบริการ',
    '/population': 'ประชากรทั้งหมด',
    '/population/house': 'หลังคาเรือน',
    '/opd': 'บริการผู้ป่วยนอก (OPD)',
    '/opd/visit': 'การให้บริการ OPD',
    '/opd/diag': 'การวินิจฉัยโรค OPD',
    '/opd/drug': 'การจ่ายยา',
    '/ipd': 'บริการผู้ป่วยใน (IPD)',
    '/ipd/admit': 'การรับไว้รักษา IPD',
    '/ipd/diag': 'การวินิจฉัยโรค IPD',
    '/chronic': 'โรคเรื้อรัง (NCD)',
    '/chronic/dm-ht': 'เบาหวาน/ความดัน',
    '/chronic/dm-ldl': 'การตรวจไขมัน LDL ในผู้ป่วยเบาหวาน',
    '/chronic/hbv': 'ไวรัสตับอักเสบบี (HBV)',
    '/chronic/hcv': 'ไวรัสตับอักเสบซี (HCV)',
    '/mcwh': 'อนามัยแม่และเด็ก',
    '/epi': 'สร้างเสริมภูมิคุ้มกัน',
    '/lab': 'ห้องปฏิบัติการ (LAB)',
    '/report': 'รายงาน',
    '/report/monthly': 'รายงานรายเดือน',
    '/report/annual': 'รายงานประจำปี',
    '/custom-report': 'CUSTOM-Report',
    '/chat-ai': 'Chat AI (Gemini)',
    '/settings': 'ตั้งค่าระบบ',
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // ปิดเมนูเมื่อเปลี่ยนหน้า
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [pathname])

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
            <Sidebar
                activePath={pathname}
                isMobileOpen={mobileMenuOpen}
                onCloseMobile={() => setMobileMenuOpen(false)}
            />

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
                    {/* ปุ่ม Hamburger เฉพาะบนมือถือ */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(true)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            padding: '4px',
                            marginRight: '8px',
                            display: 'none', // ซ่อนในจอใหญ่ (แสดงผ่าน CSS)
                            alignItems: 'center',
                        }}
                    >
                        <Menu size={22} />
                    </button>

                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>43 แฟ้ม</span>
                        <span style={{ color: 'var(--border)' }}>›</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {MENU_LABELS[pathname] ?? 'ระบบข้อมูลสุขภาพ'}
                        </span>
                    </div>
                    <div style={{ flex: 1 }} />
                    <Link
                        href="/upload"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px',
                            background: '#ffffff',
                            color: 'var(--accent)',
                            borderRadius: '8px',
                            border: '1.5px solid var(--accent)',
                            fontSize: '13px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            boxShadow: '0 8px 18px rgba(46, 125, 50, 0.12)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
                        }}
                        onMouseEnter={(event) => {
                            event.currentTarget.style.transform = 'translateY(-1px)'
                            event.currentTarget.style.boxShadow = '0 12px 24px rgba(46, 125, 50, 0.2)'
                            event.currentTarget.style.backgroundColor = 'var(--accent-light)'
                        }}
                        onMouseLeave={(event) => {
                            event.currentTarget.style.transform = 'none'
                            event.currentTarget.style.boxShadow = '0 8px 18px rgba(46, 125, 50, 0.12)'
                            event.currentTarget.style.backgroundColor = '#ffffff'
                        }}
                    >
                        <span style={{
                            display: 'inline-flex', justifyContent: 'center', alignItems: 'center',
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            fontSize: '12px', fontWeight: 700,
                        }}>
                            ↑
                        </span>
                        <span>อัปโหลดแฟ้ม</span>
                    </Link>
                </header>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                    {children}
                </div>
            </main>
        </div>
    )
}
