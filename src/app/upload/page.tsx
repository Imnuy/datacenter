'use client'

import { useRef, useState } from 'react'

const uploadConfigs = [
    {
        key: 'f43',
        title: '43 แฟ้ม',
        badge: 'ZIP ONLY',
        description: 'ใช้เทมเพลต 43 แฟ้มมาตรฐาน รวมเป็นไฟล์ .zip ก่อนอัปโหลด',
        tips: ['ขนาดไฟล์แนะนำไม่เกิน 500MB', 'ตั้งชื่อไฟล์ให้สื่อความหมาย เช่น f43-YYYYMM.zip'],
    },
    {
        key: 'f16',
        title: '16 แฟ้ม',
        badge: 'ZIP ONLY',
        description: 'รวมข้อมูล 16 แฟ้มให้ครบถ้วน แล้วบีบอัดเป็น .zip',
        tips: ['ตรวจสอบ encoding เป็น UTF-8 ก่อนบีบอัด', 'ใส่รหัสสถานบริการในชื่อไฟล์ เช่น f16-hcode.zip'],
    },
] as const

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

type UploadStatus = {
    state: UploadState
    message: string
}

const initialStatus: UploadStatus = {
    state: 'idle',
    message: 'เลือกไฟล์ .zip แล้วกดอัปโหลด',
}

function UploadCard({ config }: { config: (typeof uploadConfigs)[number] }) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [status, setStatus] = useState<UploadStatus>(initialStatus)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    const handlePick = () => {
        setStatus((prev) => ({ ...prev, message: 'เลือกไฟล์ .zip แล้วกดอัปโหลด' }))
        inputRef.current?.click()
    }

    const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.name.toLowerCase().endsWith('.zip')) {
            setStatus({ state: 'error', message: 'ต้องเป็นไฟล์ .zip เท่านั้น' })
            event.target.value = ''
            setSelectedFile(null)
            return
        }

        setSelectedFile(file)
        setStatus({ state: 'idle', message: `พร้อมอัปโหลด ${file.name}` })
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            setStatus({ state: 'error', message: 'กรุณาเลือกไฟล์ .zip ก่อน' })
            return
        }

        try {
            setIsUploading(true)
            setStatus({ state: 'uploading', message: `กำลังอัปโหลด ${selectedFile.name} ...` })

            const formData = new FormData()
            formData.append('type', config.key)
            formData.append('file', selectedFile)

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (!response.ok || !result?.success) {
                throw new Error(result?.error ?? 'อัปโหลดไม่สำเร็จ')
            }

            setStatus({
                state: 'success',
                message: `อัปโหลดสำเร็จ: ${result?.data?.filename ?? selectedFile.name}`,
            })
            setSelectedFile(null)
            if (inputRef.current) inputRef.current.value = ''
        } catch (error) {
            setStatus({
                state: 'error',
                message: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดระหว่างอัปโหลด',
            })
        } finally {
            setIsUploading(false)
        }
    }

    const statusColor: Record<UploadState, string> = {
        idle: 'var(--text-muted)',
        uploading: 'var(--accent)',
        success: 'var(--success)',
        error: 'var(--danger)',
    }

    return (
        <section
            style={{
                flex: 1,
                minWidth: '280px',
                padding: '24px',
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(31, 61, 122, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
            }}
        >
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>ประเภทแฟ้ม</p>
                    <h2 style={{ margin: '2px 0 0', fontSize: '20px', color: 'var(--text-primary)' }}>{config.title}</h2>
                </div>
                <span
                    style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: 'var(--accent-light)',
                        color: 'var(--accent)',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                    }}
                >
                    {config.badge}
                </span>
            </header>

            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{config.description}</p>

            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {config.tips.map((tip) => (
                    <li key={tip} style={{ marginBottom: '6px' }}>{tip}</li>
                ))}
            </ul>

            <div
                style={{
                    padding: '18px',
                    border: '1.5px dashed rgba(46, 125, 50, 0.35)',
                    borderRadius: '12px',
                    background: 'rgba(46, 125, 50, 0.06)',
                    textAlign: 'center',
                }}
            >
                <p style={{ margin: 0, fontSize: '13px', color: statusColor[status.state], fontWeight: 500 }}>{status.message}</p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    type="button"
                    onClick={handlePick}
                    style={{
                        flex: 1,
                        border: '1.5px solid var(--accent)',
                        background: '#ffffff',
                        color: 'var(--accent)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 6px 18px rgba(46, 125, 50, 0.08)',
                    }}
                >
                    เลือกไฟล์
                </button>
                <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading}
                    style={{
                        flex: 1,
                        border: '1.5px solid var(--accent)',
                        background: isUploading ? 'var(--accent-light)' : '#ffffff',
                        color: 'var(--accent)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        fontWeight: 600,
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 10px 24px rgba(46, 125, 50, 0.12)',
                    }}
                >
                    {isUploading ? 'กำลังอัปโหลด…' : 'อัปโหลดทันที'}
                </button>
                <input ref={inputRef} type="file" accept=".zip" hidden onChange={handleChange} />
            </div>
        </section>
    )
}

export default function UploadPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>Upload Center</p>
                <h1 style={{ margin: 0, fontSize: '32px', color: 'var(--text-primary)' }}>อัปโหลดข้อมูลแฟ้ม</h1>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                    รองรับ 2 ประเภทแฟ้ม (ZIP เท่านั้น) ระบบจะบันทึกลงโฟลเดอร์ <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '6px' }}>upload/</code>
                </p>
            </div>

            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                {uploadConfigs.map((config) => (
                    <UploadCard key={config.key} config={config} />
                ))}
            </div>
        </div>
    )
}
