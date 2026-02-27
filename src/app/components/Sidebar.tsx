'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    LayoutDashboard, Users, Activity, Hospital,
    FlaskConical, Stethoscope, FileText, TrendingUp,
    Settings, ChevronLeft, ChevronRight, Database,
    Heart, Baby, Pill, Syringe, ClipboardList,
    Map, BarChart3, Wallet
} from 'lucide-react'

export interface MenuItem {
    href: string
    label: string
    icon: React.ReactNode
    children?: MenuItem[]
}

const menuItems: MenuItem[] = [
    {
        href: '/',
        label: 'ภาพรวม Dashboard',
        icon: <LayoutDashboard size={20} />,
    },
    {
        href: '/map',
        label: 'แผนที่หน่วยบริการ',
        icon: <Map size={20} />,
    },
    {
        href: '/population', // Serves as the base path for parent active state
        label: 'ข้อมูลประชากร',
        icon: <Users size={20} />,
        children: [
            { href: '/population', label: 'ประชากรทั้งหมด', icon: <Users size={16} /> },
            { href: '/population/house', label: 'หลังคาเรือน', icon: <Map size={16} /> },
        ],
    },
    {
        href: '/opd',
        label: 'บริการผู้ป่วยนอก (OPD)',
        icon: <Hospital size={20} />,
        children: [
            { href: '/opd/visit', label: 'การให้บริการ', icon: <ClipboardList size={16} /> },
            { href: '/opd/monthly', label: 'บริการรายเดือน', icon: <FileText size={16} /> },
            { href: '/opd/diag', label: 'การวินิจฉัยโรค', icon: <Stethoscope size={16} /> },
            { href: '/opd/drug', label: 'การจ่ายยา', icon: <Pill size={16} /> },
        ],
    },
    {
        href: '/ipd',
        label: 'บริการผู้ป่วยใน (IPD)',
        icon: <Activity size={20} />,
        children: [
            { href: '/ipd/admit', label: 'การรับไว้รักษา', icon: <ClipboardList size={16} /> },
            { href: '/ipd/diag', label: 'การวินิจฉัยโรค', icon: <Stethoscope size={16} /> },
        ],
    },
    {
        href: '/chronic',
        label: 'โรคเรื้อรัง (NCD)',
        icon: <Heart size={20} />,
        children: [
            { href: '/chronic/dm-ht', label: 'เบาหวาน/ความดัน', icon: <Activity size={16} /> },
        ],
    },
    { href: '/mcwh', label: 'อนามัยแม่และเด็ก', icon: <Baby size={20} /> },
    {
        href: '/epi',
        label: 'สร้างเสริมภูมิคุ้มกัน',
        icon: <Syringe size={20} />,
        children: [
            { href: '/epi', label: 'ภาพรวมงาน EPI', icon: <Syringe size={16} /> },
            { href: '/epi/monthly', label: 'บริการวัคซีนรายเดือน', icon: <FileText size={16} /> },
            { href: '/chronic/hbv', label: 'ไวรัสตับอักเสบบี (HBV)', icon: <TrendingUp size={16} /> },
            { href: '/chronic/hcv', label: 'ไวรัสตับอักเสบซี (HCV)', icon: <TrendingUp size={16} /> },
        ],
    },
    { href: '/finance', label: 'การจัดเก็บรายได้', icon: <Wallet size={20} /> },
]

export default function Sidebar({ activePath }: { activePath: string }) {
    const [collapsed, setCollapsed] = useState(false)
    // Auto-expand the group that is currently active based on path
    const currentGroup = menuItems.find(m => m.children && activePath.startsWith(m.href))?.href
    const [expandedGroups, setExpandedGroups] = useState<string[]>(currentGroup ? [currentGroup] : ['/population'])

    const toggleGroup = (href: string) =>
        setExpandedGroups(prev =>
            prev.includes(href) ? prev.filter(g => g !== href) : [...prev, href]
        )

    return (
        <aside style={{
            width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
            minWidth: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', height: '100vh',
            transition: 'width 0.28s cubic-bezier(.4,0,.2,1), min-width 0.28s cubic-bezier(.4,0,.2,1)',
            overflow: 'hidden', position: 'relative', zIndex: 10,
            boxShadow: 'var(--shadow-sm)',
        }}>
            {/* Logo Header */}
            < div style={{
                padding: '18px 16px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: '11px', minHeight: '68px',
                background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)',
            }}>
                <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #2e7d32, #66bb6a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, boxShadow: '0 3px 10px rgba(46,125,50,0.30)',
                }}>
                    <Database size={19} color="white" />
                </div>
                {
                    !collapsed && (
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)', lineHeight: 1.2 }}>
                                อ.วัดโบสถ์
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                                Health Data Center
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Nav */}
            < nav style={{
                flex: 1, overflowY: 'auto', overflowX: 'hidden',
                padding: '10px 7px', display: 'flex', flexDirection: 'column', gap: '1px',
            }}>
                {
                    menuItems.map(item => {
                        // Parent active logic
                        const isExact = activePath === item.href
                        const isChildActive = item.children?.some(c => activePath === c.href)
                        const isActive = isExact || isChildActive
                        const isExpanded = expandedGroups.includes(item.href)

                        return (
                            <div key={item.href}>
                                {item.children ? (
                                    // Button for Parent (Toggle Expand)
                                    <button
                                        onClick={() => collapsed ? undefined : toggleGroup(item.href)}
                                        title={collapsed ? item.label : undefined}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
                                            padding: collapsed ? '10px' : '9px 11px',
                                            borderRadius: '8px', border: 'none', cursor: 'pointer',
                                            background: isActive ? 'var(--accent-mid)' : 'transparent',
                                            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                                            transition: 'all 0.18s', justifyContent: collapsed ? 'center' : 'flex-start',
                                            textAlign: 'left', fontWeight: isActive ? 600 : 400,
                                        }}
                                        onMouseEnter={e => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = 'var(--bg-hover)'
                                                e.currentTarget.style.color = 'var(--accent)'
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = 'transparent'
                                                e.currentTarget.style.color = 'var(--text-muted)'
                                            }
                                        }}
                                    >
                                        <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                                        {!collapsed && (
                                            <>
                                                <span style={{ fontSize: '13px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {item.label}
                                                </span>
                                                <ChevronRight size={13} style={{
                                                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                                                    transition: 'transform 0.2s', flexShrink: 0, opacity: 0.55,
                                                }} />
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    // Link for Standalone
                                    <Link
                                        href={item.href}
                                        title={collapsed ? item.label : undefined}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
                                            padding: collapsed ? '10px' : '9px 11px',
                                            borderRadius: '8px', cursor: 'pointer', textDecoration: 'none',
                                            background: isActive ? 'var(--accent-mid)' : 'transparent',
                                            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                                            transition: 'all 0.18s', justifyContent: collapsed ? 'center' : 'flex-start',
                                            fontWeight: isActive ? 600 : 400,
                                        }}
                                        onMouseEnter={e => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = 'var(--bg-hover)'
                                                e.currentTarget.style.color = 'var(--accent)'
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = 'transparent'
                                                e.currentTarget.style.color = 'var(--text-muted)'
                                            }
                                        }}
                                    >
                                        <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                                        {!collapsed && (
                                            <span style={{ fontSize: '13px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.label}
                                            </span>
                                        )}
                                    </Link>
                                )}

                                {/* Sub items */}
                                {!collapsed && item.children && isExpanded && (
                                    <div style={{ paddingLeft: '8px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                        {item.children.map(child => {
                                            const ca = activePath === child.href
                                            return (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    style={{
                                                        width: '100%', display: 'flex', alignItems: 'center', gap: '7px',
                                                        padding: '7px 11px 7px 12px', textDecoration: 'none',
                                                        borderRadius: '6px', cursor: 'pointer',
                                                        background: ca ? 'var(--accent-light)' : 'transparent',
                                                        color: ca ? 'var(--accent)' : 'var(--text-muted)',
                                                        borderLeft: `2px solid ${ca ? 'var(--accent)' : 'var(--border)'}`,
                                                        transition: 'all 0.18s', fontWeight: ca ? 600 : 400,
                                                    }}
                                                    onMouseEnter={e => {
                                                        if (!ca) {
                                                            e.currentTarget.style.background = 'var(--bg-hover)'
                                                            e.currentTarget.style.color = 'var(--accent)'
                                                        }
                                                    }}
                                                    onMouseLeave={e => {
                                                        if (!ca) {
                                                            e.currentTarget.style.background = 'transparent'
                                                            e.currentTarget.style.color = 'var(--text-muted)'
                                                        }
                                                    }}
                                                >
                                                    <span style={{ display: 'flex', flexShrink: 0 }}>{child.icon}</span>
                                                    <span style={{ fontSize: '12.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {child.label}
                                                    </span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })
                }
            </nav >

            {/* Collapse toggle */}
            < button
                onClick={() => setCollapsed(p => !p)}
                style={{
                    position: 'absolute', top: '18px', right: '-12px',
                    width: '24px', height: '24px', borderRadius: '50%',
                    border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                    color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 20, transition: 'all 0.2s', boxShadow: 'var(--shadow-md)',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--accent)'
                    e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                    e.currentTarget.style.color = 'var(--text-muted)'
                }}
            >
                {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button >
        </aside >
    )
}
