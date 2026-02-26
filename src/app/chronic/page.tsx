import { FileText } from 'lucide-react';

export default function Page() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '14px' }}>
      <div style={{ width: '68px', height: '68px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
        <FileText size={28} color="var(--text-muted)" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>โรคเรื้อรัง (NCD)</div>
        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>กำลังพัฒนา... เร็วๆ นี้</div>
      </div>
    </div>
  );
}