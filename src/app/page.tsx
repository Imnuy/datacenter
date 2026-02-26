'use client'

import { useState } from 'react'
import Sidebar from './components/Sidebar'
import DashboardOverview from './components/DashboardOverview'
import PopulationPage from './components/PopulationPage'
import { FileText } from 'lucide-react'

const MENU_LABELS: Record<string, string> = {
  dashboard: 'ภาพรวม Dashboard',
  population: 'ข้อมูลประชากร',
  'pop-all': 'ประชากรทั้งหมด',
  'pop-house': 'ทะเบียนบ้าน',
  'pop-age': 'แยกตามช่วงอายุ',
  opd: 'บริการผู้ป่วยนอก (OPD)',
  'opd-visit': 'การให้บริการ OPD',
  'opd-diag': 'การวินิจฉัยโรค OPD',
  'opd-drug': 'การจ่ายยา',
  ipd: 'บริการผู้ป่วยใน (IPD)',
  'ipd-admit': 'การรับไว้รักษา IPD',
  'ipd-diag': 'การวินิจฉัยโรค IPD',
  chronic: 'โรคเรื้อรัง (NCD)',
  'ncd-dm': 'เบาหวาน',
  'ncd-ht': 'ความดันโลหิตสูง',
  mcwh: 'อนามัยแม่และเด็ก',
  epi: 'สร้างเสริมภูมิคุ้มกัน',
  lab: 'ห้องปฏิบัติการ (LAB)',
  report: 'รายงาน',
  'report-monthly': 'รายงานรายเดือน',
  'report-annual': 'รายงานประจำปี',
  settings: 'ตั้งค่าระบบ',
}

function ContentArea({ activeMenu }: { activeMenu: string }) {
  if (activeMenu === 'dashboard') return <DashboardOverview />

  // หน้าประชากร (รวม pop-all, pop-age)
  if (['population', 'pop-all', 'pop-age'].includes(activeMenu)) {
    return <PopulationPage />
  }

  return (
    <div className="animate-fade-in" style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: '14px',
    }}>
      <div style={{
        width: '68px', height: '68px', borderRadius: '16px',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <FileText size={28} color="var(--text-muted)" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
          {MENU_LABELS[activeMenu] ?? activeMenu}
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>กำลังพัฒนา... เร็วๆ นี้</div>
      </div>
    </div>
  )
}

export default function Home() {
  const [activeMenu, setActiveMenu] = useState('dashboard')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />

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
              {MENU_LABELS[activeMenu] ?? activeMenu}
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
          <ContentArea activeMenu={activeMenu} />
        </div>
      </main>
    </div>
  )
}
