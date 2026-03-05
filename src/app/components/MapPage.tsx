'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Map as MapIcon, RefreshCw } from 'lucide-react'

const { BaseLayer } = LayersControl

interface Hospital {
    hospcode: string
    hosname: string
    latitude: number
    longitude: number
}

// Custom Green Hospital Cross Icon
const getHospitalIcon = () => {
    if (typeof window === 'undefined') return null
    return L.divIcon({
        html: `
            <div style="
                background: white; 
                width: 32px; height: 32px; 
                border-radius: 8px; 
                display: flex; align-items: center; justify-content: center; 
                border: 2.5px solid #2e7d32;
                box-shadow: 0 3px 6px rgba(0,0,0,0.16);
                transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </div>
        `,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
    })
}

// Component: คลิกหมุดเปิด Popup มีปุ่มซูม
function ZoomableMarker({ hosp, icon }: { hosp: Hospital; icon: L.DivIcon | null }) {
    const map = useMap()
    return (
        <Marker
            position={[Number(hosp.latitude), Number(hosp.longitude)]}
            {...(icon ? { icon } : {})}
        >
            <Popup>
                <div style={{ minWidth: '160px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1b5e20', marginBottom: '4px' }}>
                        {hosp.hosname}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                        รหัส: <strong>{hosp.hospcode}</strong>
                    </div>
                    <button
                        onClick={() => {
                            map.flyTo([Number(hosp.latitude), Number(hosp.longitude)], 16, { duration: 1.2 })
                        }}
                        style={{
                            width: '100%',
                            padding: '7px 0',
                            background: '#2e7d32',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                        }}
                    >
                        🔍 ซูมไปที่นี่
                    </button>
                    <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.latitude},${hosp.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            marginTop: '6px',
                            width: '100%',
                            padding: '7px 0',
                            background: '#1565c0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            textDecoration: 'none',
                        }}
                    >
                        🧭 นำทาง Google Maps
                    </a>
                </div>
            </Popup>
        </Marker>
    )
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

    const centerLatitude = hospitals.length > 0
        ? hospitals.reduce((sum, h) => sum + Number(h.latitude), 0) / hospitals.length
        : 17.03201

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
                        แสดงพิกัดที่ตั้งของ รพ.สต. ทั้งหมด (สลับแผนที่มาตรฐาน/ดาวเทียมได้)
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

            <div style={{
                flex: 1, minHeight: '550px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex', flexDirection: 'column',
            }}>
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
                        (รวม <strong style={{ color: 'var(--accent)', fontSize: '14px' }}>{hospitals.length}</strong> แห่ง)
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
                            zoom={12}
                            style={{ height: '100%', width: '100%', zIndex: 1 }}
                        >
                            <LayersControl position="topright">
                                <BaseLayer name="แผนที่ปกติ (OpenStreetMap)">
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                </BaseLayer>
                                <BaseLayer checked name="แผนที่ดาวเทียม (Google Hybrid)">
                                    <TileLayer
                                        attribution='&copy; Google'
                                        url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                                    />
                                </BaseLayer>
                                <BaseLayer name="แผนที่ดาวเทียม (ESRI Imagery)">
                                    <TileLayer
                                        attribution='&copy; ESRI'
                                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                    />
                                </BaseLayer>
                            </LayersControl>

                            {hospitals.map(hosp => (
                                <ZoomableMarker
                                    key={hosp.hospcode}
                                    hosp={hosp}
                                    icon={getHospitalIcon()}
                                />
                            ))}
                        </MapContainer>
                    </div>
                )}
            </div>
        </div>
    )
}
