'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Map as MapIcon, RefreshCw, Navigation } from 'lucide-react'

// Fix for default leaflet marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Hospital {
    hospcode: string
    hosname: string
    latitude: number
    longitude: number
}

export default function MapPage() {
    const [hospitals, setHospitals] = useState<Hospital[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchData = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/hospitals')
            const json = await res.json()
            if (!json.success) throw new Error(json.error)
            setHospitals(json.data)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Calculate center based on all loaded markers, default to Wat Bot, Phitsanulok
    const centerLatitude = hospitals.length > 0
        ? hospitals.reduce((sum, h) => sum + Number(h.latitude), 0) / hospitals.length
        : 17.03201 // Fallback Wat Bot center

    const centerLongitude = hospitals.length > 0
        ? hospitals.reduce((sum, h) => sum + Number(h.longitude), 0) / hospitals.length
        : 100.35023

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px', height: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '21px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        แผนที่หน่วยบริการ
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        แสดงพิกัดที่ตั้งของโรงพยาบาลส่งเสริมสุขภาพตำบลทั้งหมด
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '8px',
                        background: 'var(--accent)', color: 'white', border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '13px', fontWeight: 500,
                        opacity: loading ? 0.7 : 1, transition: 'all 0.18s',
                        boxShadow: 'var(--shadow-sm)',
                    }}
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'กำลังโหลด...' : 'รีเฟรชแผนที่'}
                </button>
            </div>

            {error && (
                <div style={{
                    padding: '14px 16px', borderRadius: '10px',
                    background: '#fff3f3', border: '1px solid #ffcdd2',
                    color: 'var(--danger)', fontSize: '13px',
                }}>
                    ❌ {error}
                </div>
            )}

            {/* Map Container View */}
            <div style={{
                flex: 1, minHeight: '500px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* Overlay Map Header Info */}
                <div style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--bg-primary)', zIndex: 10,
                }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapIcon size={16} /> พิกัดหน่วยบริการในพื้นที่
                    </span>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>
                        ทั้งหมด <strong style={{ color: 'var(--accent)', fontSize: '14px' }}>{hospitals.length}</strong> แห่ง
                    </div>
                </div>

                {loading ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        กำลังโหลดข้อมูลแผนที่...
                    </div>
                ) : (
                    <div style={{ flex: 1, position: 'relative' }}>
                        <MapContainer
                            center={[centerLatitude, centerLongitude]}
                            zoom={11}
                            style={{ height: '100%', width: '100%', zIndex: 1 }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {hospitals.map(hosp => (
                                <Marker key={hosp.hospcode} position={[Number(hosp.latitude), Number(hosp.longitude)]}>
                                    <Popup>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>
                                            {hosp.hosname}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span>รหัสหน่วยบริการ: <strong style={{ color: 'var(--text-primary)' }}>{hosp.hospcode}</strong></span>
                                            <span>ละติจูด: <strong style={{ color: 'var(--text-primary)' }}>{hosp.latitude}</strong></span>
                                            <span>ลองจิจูด: <strong style={{ color: 'var(--text-primary)' }}>{hosp.longitude}</strong></span>
                                        </div>
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.latitude},${hosp.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                                marginTop: '10px', padding: '6px 10px', background: 'var(--accent)',
                                                color: 'white', textDecoration: 'none', borderRadius: '4px',
                                                fontSize: '12px', fontWeight: 500
                                            }}
                                        >
                                            <Navigation size={12} />
                                            นำทางด้วย Google Maps
                                        </a>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                )}
            </div>
        </div>
    )
}
