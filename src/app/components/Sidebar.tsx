'use client'

import { useState } from 'react'
import {
    LayoutDashboard, Users, Activity, Hospital,
    FlaskConical, Stethoscope, FileText, TrendingUp,
    Settings, ChevronLeft, ChevronRight, Database,
    Heart, Baby, Pill, Syringe, ClipboardList,
    Map, BarChart3,
} from 'lucide-react'

export interface MenuItem {
    id: string
    label: string
    icon: React.ReactNode
    children?: MenuItem[]
}

const menuItems: MenuItem[] = [
    {
        id: 'dashboard',
        label: 'ภาพรวม Dashboard',
        icon: <LayoutDashboard size={20} />,
    },
    {
        id: 'population',
        label: 'ข้อมูลประชากร',
        icon: <Users size={20} />,
        children: [
            { id: 'pop-all', label: 'ประชากรทั้งหมด', icon: <Users size={16} /> },
            { id: 'pop-house', label: 'ทะเบียนบ้าน', icon: <Map size={16} /> },
            { id: 'pop-age', label: 'แยกตามช่วงอายุ', icon: <BarChart3 size={16} /> },
        ],
    },
    {
        id: 'opd',
        label: 'บริการผู้ป่วยนอก (OPD)',
        icon: <Hospital size={20} />,
        children: [
            { id: 'opd-visit', label: 'การให้บริการ', icon: <ClipboardList size={16} /> },
            { id: 'opd-diag', label: 'การวินิจฉัยโรค', icon: <Stethoscope size={16} /> },
            { id: 'opd-drug', label: 'การจ่ายยา', icon: <Pill size={16} /> },
        ],
    },
    {
        id: 'ipd',
        label: 'บริการผู้ป่วยใน (IPD)',
        icon: <Activity size={20} />,
        children: [
            { id: 'ipd-admit', label: 'การรับไว้รักษา', icon: <ClipboardList size={16} /> },
            { id: 'ipd-diag', label: 'การวินิจฉัยโรค', icon: <Stethoscope size={16} /> },
        ],
    },
    {
        id: 'chronic',
        label: 'โรคเรื้อรัง (NCD)',
        icon: <Heart size={20} />,
        children: [
            { id: 'ncd-dm', label: 'เบาหวาน', icon: <Activity size={16} /> },
            { id: 'ncd-ht', label: 'ความดันโลหิตสูง', icon: <TrendingUp size={16} /> },
        ],
    },
    { id: 'mcwh', label: 'อนามัยแม่และเด็ก', icon: <Baby size={20} /> },
    { id: 'epi', label: 'สร้างเสริมภูมิคุ้มกัน', icon: <Syringe size={20} /> },
    { id: 'lab', label: 'ห้องปฏิบัติการ (LAB)', icon: <FlaskConical size={20} /> },
    {
        id: 'report',
        label: 'รายงาน',
        icon: <BarChart3 size={20} />,
        children: [
            { id: 'report-monthly', label: 'รายงานรายเดือน', icon: <FileText size={16} /> },
            { id: 'report-annual', label: 'รายงานประจำปี', icon: <TrendingUp size={16} /> },
        ],
    },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: <Settings size={20} /> },
]

interface SidebarProps {
    activeMenu: string
    onMenuChange: (id: string) => void
}

export default function Sidebar({ activeMenu, onMenuChange }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false)
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['population'])

    const toggleGroup = (id: string) =>
        setExpandedGroups(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        )

    const handleMenuClick = (item: MenuItem) => {
        if (item.children) {
            if (!collapsed) toggleGroup(item.id)
        } else {
            onMenuChange(item.id)
        }
    }

    return (
        <aside style={{
            width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
            minWidth: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            transition: 'width 0.28s cubic-bezier(.4,0,.2,1), min-width 0.28s cubic-bezier(.4,0,.2,1)',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 10,
            boxShadow: 'var(--shadow-sm)',
        }}>
            {/* Logo Header */}
            <div style={{
                padding: '18px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                minHeight: '68px',
                background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)',
            }}>
                <div style={{
                    width: '38px', height: '38px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #2e7d32, #66bb6a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 3px 10px rgba(46,125,50,0.30)',
                }}>
                    <Database size={19} color="white" />
                </div>
                {!collapsed && (
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)', lineHeight: 1.2 }}>
                            43 แฟ้ม
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                            Health Data Center
                        </div>
                    </div>
                )}
            </div>

            {/* DB Tag */}
            {!collapsed && (
                <div style={{
                    margin: '10px 10px 0',
                    padding: '8px 11px',
                    background: 'var(--accent-light)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                    <div style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: 'var(--success)',
                        animation: 'pulse-dot 2s infinite', flexShrink: 0,
                    }} />
                    <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ฐานข้อมูล</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--accent)', fontWeight: 600 }}>
                            192.168.101.135 · datacenter
                        </div>
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav style={{
                flex: 1,
                overflowY: 'auto', overflowX: 'hidden',
                padding: '10px 7px',
                display: 'flex', flexDirection: 'column', gap: '1px',
            }}>
                {menuItems.map(item => {
                    const isActive = activeMenu === item.id ||
                        item.children?.some(c => c.id === activeMenu)
                    const isExpanded = expandedGroups.includes(item.id)

                    return (
                        <div key={item.id}>
                            <button
                                onClick={() => handleMenuClick(item)}
                                title={collapsed ? item.label : undefined}
                                style={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center',
                                    gap: '9px',
                                    padding: collapsed ? '10px' : '9px 11px',
                                    borderRadius: '8px', border: 'none', cursor: 'pointer',
                                    background: isActive ? 'var(--accent-mid)' : 'transparent',
                                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                                    transition: 'all 0.18s',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    textAlign: 'left',
                                    fontWeight: isActive ? 600 : 400,
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'
                                            ; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                                            ; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
                                    }
                                }}
                            >
                                <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                                {!collapsed && (
                                    <>
                                        <span style={{
                                            fontSize: '13px', flex: 1,
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {item.label}
                                        </span>
                                        {item.children && (
                                            <ChevronRight size={13} style={{
                                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                                                transition: 'transform 0.2s',
                                                flexShrink: 0, opacity: 0.55,
                                            }} />
                                        )}
                                    </>
                                )}
                            </button>

                            {/* Sub items */}
                            {!collapsed && item.children && isExpanded && (
                                <div style={{ paddingLeft: '8px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                    {item.children.map(child => {
                                        const ca = activeMenu === child.id
                                        return (
                                            <button
                                                key={child.id}
                                                onClick={() => onMenuChange(child.id)}
                                                style={{
                                                    width: '100%', display: 'flex', alignItems: 'center',
                                                    gap: '7px', padding: '7px 11px 7px 12px',
                                                    borderRadius: '6px', border: 'none', cursor: 'pointer',
                                                    background: ca ? 'var(--accent-light)' : 'transparent',
                                                    color: ca ? 'var(--accent)' : 'var(--text-muted)',
                                                    borderLeft: `2px solid ${ca ? 'var(--accent)' : 'var(--border)'}`,
                                                    transition: 'all 0.18s', textAlign: 'left', fontWeight: ca ? 600 : 400,
                                                }}
                                                onMouseEnter={e => {
                                                    if (!ca) {
                                                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'
                                                            ; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (!ca) {
                                                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                                                            ; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
                                                    }
                                                }}
                                            >
                                                <span style={{ display: 'flex', flexShrink: 0 }}>{child.icon}</span>
                                                <span style={{ fontSize: '12.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {child.label}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </nav>

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(p => !p)}
                style={{
                    position: 'absolute', top: '18px', right: '-12px',
                    width: '24px', height: '24px', borderRadius: '50%',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 20,
                    transition: 'all 0.2s',
                    boxShadow: 'var(--shadow-md)',
                }}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'
                        ; (e.currentTarget as HTMLButtonElement).style.color = 'white'
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-secondary)'
                        ; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
                }}
            >
                {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>

            {/* Footer */}
            <div style={{
                padding: '10px 8px',
                borderTop: '1px solid var(--border)',
                fontSize: '10.5px',
                color: 'var(--text-muted)',
                textAlign: 'center',
            }}>
                {collapsed ? '43' : 'ระบบข้อมูล 43 แฟ้ม v1.0'}
            </div>
        </aside>
    )
}
