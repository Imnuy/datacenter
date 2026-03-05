'use client'

import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Plus, Table as TableIcon, Eye, X, Save, Search as SearchIcon, Wrench } from 'lucide-react'
import Swal from 'sweetalert2'

type CustomReportRow = {
    id: number
    report_name: string
    sql_command: string
    pass_key?: string
    is_active: string
    d_update: string | null
}

type RunResponse = {
    success: boolean
    error?: string
    meta?: { id: number; report_name: string; d_update: string | null }
    columns?: string[]
    data?: Record<string, any>[]
    rowCount?: number
    maxRows?: number
}

type ListResponse = {
    success: boolean
    error?: string
    data?: CustomReportRow[]
}

type CreateResponse = {
    success: boolean
    error?: string
    id?: number
}

type BasicResponse = {
    success: boolean
    error?: string
}

type AdminAuthResponse = {
    success: boolean
    error?: string
}

function formatDateTime(input: string | null) {
    if (!input) return '-'
    const d = new Date(input)
    if (Number.isNaN(d.getTime())) return input
    return d.toLocaleString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

export default function CustomReportPage() {
    const [rows, setRows] = useState<CustomReportRow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')

    const [open, setOpen] = useState(false)
    const [running, setRunning] = useState(false)
    const [runError, setRunError] = useState('')
    const [runTitle, setRunTitle] = useState('')
    const [runColumns, setRunColumns] = useState<string[]>([])
    const [runData, setRunData] = useState<Record<string, any>[]>([])
    const [runRowCount, setRunRowCount] = useState<number>(0)
    const [maxRows, setMaxRows] = useState<number>(0)
    const [mounted, setMounted] = useState(false)

    const [createOpen, setCreateOpen] = useState(false)
    const [createSaving, setCreateSaving] = useState(false)
    const [createError, setCreateError] = useState('')
    const [newReportName, setNewReportName] = useState('')
    const [newSqlCommand, setNewSqlCommand] = useState('')
    const [newPassKey, setNewPassKey] = useState('')

    const [editOpen, setEditOpen] = useState(false)
    const [editSaving, setEditSaving] = useState(false)
    const [editError, setEditError] = useState('')
    const [editId, setEditId] = useState<number | null>(null)
    const [editReportName, setEditReportName] = useState('')
    const [editSqlCommand, setEditSqlCommand] = useState('')
    const [editPassKey, setEditPassKey] = useState('')

    const [openToolMenuId, setOpenToolMenuId] = useState<number | null>(null)
    const [toolAuthPass, setToolAuthPass] = useState('')

    const fetchList = async () => {
        setLoading(true); setError('')
        try {
            const res = await fetch('/api/custom-report/list')
            const json = await res.json() as ListResponse
            if (!json.success) throw new Error(json.error)
            setRows((json.data ?? []) as CustomReportRow[])
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e))
        } finally {
            setLoading(false)
        }
    }

    const verifyAdminPass = async (pass: string): Promise<BasicResponse> => {
        const res = await fetch('/api/custom-report/admin-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pass }),
        })
        return await res.json() as BasicResponse
    }

    const confirmOpenCreate = async () => {
        const result = await Swal.fire({
            title: 'กรอกรหัสผ่าน Admin',
            input: 'password',
            inputPlaceholder: 'รหัสผ่าน',
            inputAttributes: {
                autocapitalize: 'off',
                autocorrect: 'off',
            },
            showCancelButton: true,
            confirmButtonText: 'ตกลง',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
            preConfirm: async (value) => {
                if (!value) {
                    Swal.showValidationMessage('กรุณากรอกรหัสผ่าน')
                    return false
                }

                try {
                    const json = await verifyAdminPass(String(value)) as AdminAuthResponse
                    if (!json.success) {
                        Swal.showValidationMessage(json.error || 'รหัสผ่านไม่ถูกต้อง')
                        return false
                    }
                    return 'ok'
                } catch {
                    Swal.showValidationMessage('ไม่สามารถตรวจสอบรหัสผ่านได้')
                    return false
                }
            },
        })

        if (result.isConfirmed) {
            setCreateOpen(true)
        }
    }

    useEffect(() => { fetchList() }, [])

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!open) return
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prevOverflow
        }
    }, [open])

    useEffect(() => {
        if (!editOpen) return
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prevOverflow
        }
    }, [editOpen])

    useEffect(() => {
        if (openToolMenuId === null) return
        const onDocClick = () => setOpenToolMenuId(null)
        document.addEventListener('click', onDocClick)
        return () => document.removeEventListener('click', onDocClick)
    }, [openToolMenuId])

    const activeRows = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return rows
        return rows.filter(r => String(r.report_name || '').toLowerCase().includes(q))
    }, [rows, search])

    const closeModal = () => {
        if (running) return
        setOpen(false)
        setRunError('')
        setRunTitle('')
        setRunColumns([])
        setRunData([])
        setRunRowCount(0)
        setMaxRows(0)
    }

    const closeCreateModal = () => {
        if (createSaving) return
        setCreateOpen(false)
        setCreateError('')
        setNewReportName('')
        setNewSqlCommand('')
        setNewPassKey('')
    }

    const closeEditModal = () => {
        if (editSaving) return
        setEditOpen(false)
        setEditError('')
        setEditId(null)
        setEditReportName('')
        setEditSqlCommand('')
        setEditPassKey('')
    }

    const submitCreate = async () => {
        const report_name = newReportName.trim()
        const sql_command = newSqlCommand.trim()
        const pass_key = newPassKey.trim()

        if (!report_name) {
            setCreateError('กรุณากรอกชื่อรายงาน')
            return
        }
        if (!sql_command) {
            setCreateError('กรุณากรอก sql_command')
            return
        }

        setCreateSaving(true)
        setCreateError('')
        try {
            const res = await fetch('/api/custom-report/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report_name, sql_command, pass_key }),
            })
            const json = await res.json() as CreateResponse
            if (!json.success) throw new Error(json.error || 'Create failed')

            await fetchList()
            closeCreateModal()
        } catch (e: unknown) {
            setCreateError(e instanceof Error ? e.message : String(e))
        } finally {
            setCreateSaving(false)
        }
    }

    const runReport = async (id: number, title: string) => {
        // First check if pass_key is required
        const checkRes = await fetch('/api/custom-report/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, pass_key: '' }),
        })
        const checkJson = await checkRes.json() as RunResponse
        
        let pass_key = ''
        
        // If pass_key is required, prompt user
        if (!checkJson.success && checkJson.error?.includes('pass_key is required')) {
            const result = await Swal.fire({
                title: `กรอก pass_key เพื่อดูรายงาน`,
                text: title,
                input: 'password',
                inputPlaceholder: 'pass_key',
                inputAttributes: {
                    autocapitalize: 'off',
                    autocorrect: 'off',
                },
                showCancelButton: true,
                confirmButtonText: 'เรียกดู',
                cancelButtonText: 'ยกเลิก',
                reverseButtons: true,
                preConfirm: (value) => {
                    if (!String(value ?? '').trim()) {
                        Swal.showValidationMessage('กรุณากรอก pass_key')
                        return false
                    }
                    return String(value).trim()
                },
            })

            if (!result.isConfirmed) return
            pass_key = String(result.value ?? '').trim()
            if (!pass_key) return
        } else if (!checkJson.success) {
            // Other error occurred
            setOpen(true)
            setRunTitle(title)
            setRunError(checkJson.error || 'Unknown error')
            setRunColumns([])
            setRunData([])
            setRunRowCount(0)
            setMaxRows(0)
            return
        }

        setOpen(true)
        setRunTitle(title)
        setRunError('')
        setRunColumns([])
        setRunData([])
        setRunRowCount(0)
        setMaxRows(0)

        setRunning(true)
        try {
            const res = await fetch('/api/custom-report/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, pass_key }),
            })
            const json = await res.json() as RunResponse
            if (!json.success) throw new Error(json.error || 'Run failed')

            setRunColumns(json.columns || [])
            setRunData(json.data || [])
            setRunRowCount(json.rowCount || 0)
            setMaxRows(json.maxRows || 0)
        } catch (e: unknown) {
            setRunError(e instanceof Error ? e.message : String(e))
        } finally {
            setRunning(false)
        }
    }

    const toggleToolMenu = (e: MouseEvent<HTMLButtonElement>, rowId: number) => {
        e.stopPropagation()

        if (openToolMenuId === rowId) {
            setOpenToolMenuId(null)
            return
        }

        setOpenToolMenuId(rowId)
    }

    const requestToolAuth = async (): Promise<string | null> => {
        const result = await Swal.fire({
            title: 'กรอกรหัสผ่าน Admin',
            input: 'password',
            inputPlaceholder: 'รหัสผ่าน',
            inputAttributes: {
                autocapitalize: 'off',
                autocorrect: 'off',
            },
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
            preConfirm: async (value) => {
                const pass = String(value ?? '').trim()
                if (!pass) {
                    Swal.showValidationMessage('กรุณากรอกรหัสผ่าน')
                    return false
                }
                try {
                    const json = await verifyAdminPass(pass)
                    if (!json.success) {
                        Swal.showValidationMessage(json.error || 'รหัสผ่านไม่ถูกต้อง')
                        return false
                    }
                    return pass
                } catch {
                    Swal.showValidationMessage('ไม่สามารถตรวจสอบรหัสผ่านได้')
                    return false
                }
            },
        })

        if (!result.isConfirmed) return null
        const pass = String(result.value ?? '').trim()
        if (!pass) return null
        return pass
    }

    const openEditModal = async (row: CustomReportRow) => {
        setOpenToolMenuId(null)

        const pass = await requestToolAuth()
        if (!pass) return

        setToolAuthPass(pass)
        setEditError('')
        setEditId(row.id)
        setEditReportName(String(row.report_name ?? ''))
        setEditSqlCommand(String(row.sql_command ?? ''))
        setEditPassKey(String(row.pass_key ?? ''))
        setEditOpen(true)
    }

    const submitEdit = async () => {
        const id = Number(editId)
        const report_name = editReportName.trim()
        const sql_command = editSqlCommand.trim()
        const pass_key = editPassKey.trim()

        if (!Number.isFinite(id) || id <= 0) {
            setEditError('ไม่พบรหัสรายงาน')
            return
        }
        if (!toolAuthPass.trim()) {
            setEditError('กรุณายืนยันสิทธิ์ด้วยปุ่ม Tool อีกครั้ง')
            return
        }
        if (!report_name) {
            setEditError('กรุณากรอกชื่อรายงาน')
            return
        }
        if (!sql_command) {
            setEditError('กรุณากรอก sql_command')
            return
        }

        setEditSaving(true)
        setEditError('')
        try {
            const res = await fetch('/api/custom-report/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, report_name, sql_command, pass_key, pass: toolAuthPass }),
            })
            const json = await res.json() as BasicResponse
            if (!json.success) throw new Error(json.error || 'Update failed')

            await fetchList()
            closeEditModal()
            setToolAuthPass('')
        } catch (e: unknown) {
            setEditError(e instanceof Error ? e.message : String(e))
        } finally {
            setEditSaving(false)
        }
    }

    const deleteReport = async (row: CustomReportRow) => {
        setOpenToolMenuId(null)

        const pass = await requestToolAuth()
        if (!pass) return

        const confirm = await Swal.fire({
            icon: 'warning',
            title: 'ยืนยันการลบรายงาน',
            text: `ต้องการลบ "${row.report_name}" ใช่หรือไม่?`,
            showCancelButton: true,
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
        })
        if (!confirm.isConfirmed) return

        try {
            const res = await fetch('/api/custom-report/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: row.id, pass }),
            })
            const json = await res.json() as BasicResponse
            if (!json.success) throw new Error(json.error || 'Delete failed')

            await fetchList()
            setToolAuthPass('')
            await Swal.fire({ icon: 'success', title: 'ลบรายงานแล้ว', timer: 1200, showConfirmButton: false })
        } catch (e: unknown) {
            await Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', text: e instanceof Error ? e.message : String(e) })
        }
    }

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText color="var(--accent)" size={28} /> CUSTOM-Report
                    </h1>
                </div>
                <button onClick={confirmOpenCreate} disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: loading ? 0.7 : 1 }}>
                    <Plus size={16} /> เพิ่ม
                </button>
            </div>

            {error && <div style={{ padding: '16px', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fda4af', color: '#e11d48' }}><strong>Error:</strong> {error}</div>}

            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'visible' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TableIcon size={20} color="var(--accent)" />
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>รายงาน</h2>
                    <div style={{ flex: 1 }} />
                    <div style={{ position: 'relative' }}>
                        <SearchIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อรายงาน..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', fontSize: '14px', minWidth: '240px', outline: 'none' }}
                        />
                    </div>
                </div>
                <div style={{ overflow: 'visible' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--bg-primary)' }}>
                            <tr>
                                {['ลำดับ', 'ชื่อรายงาน', 'อัพเดท', 'Action'].map(h => (
                                    <th key={h} style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: h === 'Action' ? 'center' : 'left' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} style={{ padding: '34px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลด...</td></tr>
                            ) : activeRows.length === 0 ? (
                                <tr><td colSpan={4} style={{ padding: '34px', textAlign: 'center', color: 'var(--text-muted)' }}>ไม่พบข้อมูล</td></tr>
                            ) : activeRows.map((r, idx) => (
                                <tr key={r.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                                    <td style={{ padding: '12px 18px', fontSize: '14px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                                    <td style={{ padding: '12px 18px', fontSize: '14px', fontWeight: 500 }}>{r.report_name}</td>
                                    <td style={{ padding: '12px 18px', fontSize: '14px', color: 'var(--text-muted)' }}>{formatDateTime(r.d_update)}</td>
                                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                            <button
                                                onClick={() => runReport(r.id, r.report_name)}
                                                disabled={String(r.is_active || '').toLowerCase() !== 'y'}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                                    padding: '8px 12px', borderRadius: '10px',
                                                    border: '1px solid var(--border)',
                                                    background: 'white', cursor: 'pointer',
                                                    fontSize: '13px', color: 'var(--accent)',
                                                    opacity: String(r.is_active || '').toLowerCase() !== 'y' ? 0.5 : 1
                                                }}
                                            >
                                                <Eye size={16} /> [เรียกดู]
                                            </button>

                                            <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => toggleToolMenu(e, r.id)}
                                                    style={{
                                                        width: '34px', height: '34px',
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        borderRadius: '10px', border: '1px solid var(--border)',
                                                        background: 'white', cursor: 'pointer', color: 'var(--text-primary)'
                                                    }}
                                                    title="เครื่องมือ"
                                                >
                                                    <Wrench size={16} />
                                                </button>

                                                {openToolMenuId === r.id && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        right: 0,
                                                        top: '40px',
                                                        minWidth: '130px',
                                                        background: 'white',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: '10px',
                                                        boxShadow: 'var(--shadow-md)',
                                                        overflow: 'hidden',
                                                        zIndex: 10,
                                                    }}>
                                                        <button
                                                            onClick={() => openEditModal(r)}
                                                            style={{ width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', background: 'white', cursor: 'pointer', fontSize: '13px' }}
                                                        >
                                                            แก้ไข
                                                        </button>
                                                        <button
                                                            onClick={() => deleteReport(r)}
                                                            style={{ width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', background: '#fff7f7', cursor: 'pointer', fontSize: '13px', color: '#dc2626' }}
                                                        >
                                                            ลบ
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {mounted && open && createPortal(
                <div
                    role="dialog"
                    aria-modal="true"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.40)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        zIndex: 2147483647,
                    }}
                    onMouseDown={(e) => {
                        if (e.currentTarget === e.target) closeModal()
                    }}
                >
                    <div style={{
                        width: 'min(1200px, 100%)',
                        maxHeight: '85vh',
                        background: 'white',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <div style={{
                            padding: '14px 16px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'var(--bg-secondary)'
                        }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {runTitle || 'CUSTOM-Report'}
                            </div>
                            <button onClick={closeModal} disabled={running}
                                style={{
                                    width: '34px', height: '34px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '10px', border: '1px solid var(--border)',
                                    background: 'white', cursor: running ? 'not-allowed' : 'pointer',
                                    opacity: running ? 0.6 : 1
                                }}>
                                <X size={18} color="var(--text-muted)" />
                            </button>
                        </div>

                        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                {running ? 'กำลังรันคำสั่ง...' : (runColumns.length ? `แสดง ${runRowCount.toLocaleString()} แถว` : 'พร้อมแสดงผล')}
                                {maxRows ? ` (จำกัดสูงสุด ${maxRows.toLocaleString()} แถว)` : ''}
                            </div>
                        </div>

                        <div style={{ padding: '16px', overflowY: 'auto' }}>
                            {runError && (
                                <div style={{ padding: '14px', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fda4af', color: '#e11d48', marginBottom: '12px' }}>
                                    <strong>Error:</strong> {runError}
                                </div>
                            )}

                            {running && (
                                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดผลลัพธ์...</div>
                            )}

                            {!running && !runError && runColumns.length === 0 && (
                                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>ไม่พบคอลัมน์ผลลัพธ์</div>
                            )}

                            {!running && runColumns.length > 0 && (
                                <div style={{ overflowX: 'auto', marginBottom: '8px' }}>
                                    <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                {runColumns.map(c => (
                                                    <th key={c} style={{
                                                        position: 'sticky', top: 0,
                                                        background: 'var(--bg-primary)',
                                                        borderBottom: '1px solid var(--border)',
                                                        padding: '10px 12px',
                                                        fontSize: '12.5px',
                                                        color: 'var(--text-muted)',
                                                        textAlign: 'left',
                                                        whiteSpace: 'nowrap'
                                                    }}>{c}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {runData.length === 0 ? (
                                                <tr><td colSpan={runColumns.length} style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)' }}>ไม่พบข้อมูล</td></tr>
                                            ) : runData.map((r, i) => (
                                                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                                                    {runColumns.map(col => (
                                                        <td key={col} style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                                            {r?.[col] === null || r?.[col] === undefined ? '' : String(r[col])}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {mounted && createOpen && createPortal(
                <div
                    role="dialog"
                    aria-modal="true"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.40)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        zIndex: 2147483647,
                    }}
                    onMouseDown={(e) => {
                        if (e.currentTarget === e.target) closeCreateModal()
                    }}
                >
                    <div style={{
                        width: 'min(900px, 100%)',
                        maxHeight: '85vh',
                        background: 'white',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <div style={{
                            padding: '14px 16px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'var(--bg-secondary)'
                        }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                เพิ่มรายงานใหม่
                            </div>
                            <button onClick={closeCreateModal} disabled={createSaving}
                                style={{
                                    width: '34px', height: '34px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '10px', border: '1px solid var(--border)',
                                    background: 'white', cursor: createSaving ? 'not-allowed' : 'pointer',
                                    opacity: createSaving ? 0.6 : 1
                                }}>
                                <X size={18} color="var(--text-muted)" />
                            </button>
                        </div>

                        <div style={{ padding: '16px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {createError && (
                                <div style={{ padding: '14px', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fda4af', color: '#e11d48' }}>
                                    <strong>Error:</strong> {createError}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>report_name *</div>
                                <input
                                    value={newReportName}
                                    onChange={(e) => setNewReportName(e.target.value)}
                                    placeholder="ชื่อรายงาน"
                                    disabled={createSaving}
                                    style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white', fontSize: '14px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>pass_key (ไม่ระบุก็ได้)</div>
                                <input
                                    type="password"
                                    value={newPassKey}
                                    onChange={(e) => setNewPassKey(e.target.value)}
                                    placeholder="รหัสผ่านสำหรับเรียกดูรายงาน (ถ้าต้องการควบคุมการเข้าถึง)"
                                    disabled={createSaving}
                                    style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white', fontSize: '14px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>sql_command * (เฉพาะ SELECT)</div>
                                <textarea
                                    value={newSqlCommand}
                                    onChange={(e) => setNewSqlCommand(e.target.value)}
                                    placeholder="เช่น: select 1 as a, 2 as b"
                                    disabled={createSaving}
                                    rows={8}
                                    style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white', fontSize: '14px', outline: 'none', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
                                />
                            </div>

                            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                                ระบบจะบันทึก is_active = 'y' และ d_update = NOW() อัตโนมัติ
                            </div>
                        </div>

                        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--bg-secondary)' }}>
                            <button
                                onClick={closeCreateModal}
                                disabled={createSaving}
                                style={{
                                    padding: '9px 14px', borderRadius: '10px',
                                    border: '1px solid var(--border)', background: 'white',
                                    cursor: createSaving ? 'not-allowed' : 'pointer',
                                    fontSize: '13.5px', color: 'var(--text-muted)'
                                }}
                            >
                                ปิด
                            </button>
                            <button
                                onClick={submitCreate}
                                disabled={createSaving}
                                style={{
                                    padding: '9px 14px', borderRadius: '10px',
                                    border: 'none', background: 'var(--accent)',
                                    cursor: createSaving ? 'not-allowed' : 'pointer',
                                    fontSize: '13.5px', color: 'white',
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    opacity: createSaving ? 0.75 : 1
                                }}
                            >
                                <Save size={16} /> {createSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {mounted && editOpen && createPortal(
                <div
                    role="dialog"
                    aria-modal="true"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.40)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        zIndex: 2147483647,
                    }}
                    onMouseDown={(e) => {
                        if (e.currentTarget === e.target) closeEditModal()
                    }}
                >
                    <div style={{
                        width: 'min(900px, 100%)',
                        maxHeight: '85vh',
                        background: 'white',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <div style={{
                            padding: '14px 16px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'var(--bg-secondary)'
                        }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                แก้ไขรายงาน
                            </div>
                            <button onClick={closeEditModal} disabled={editSaving}
                                style={{
                                    width: '34px', height: '34px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '10px', border: '1px solid var(--border)',
                                    background: 'white', cursor: editSaving ? 'not-allowed' : 'pointer',
                                    opacity: editSaving ? 0.6 : 1
                                }}>
                                <X size={18} color="var(--text-muted)" />
                            </button>
                        </div>

                        <div style={{ padding: '16px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {editError && (
                                <div style={{ padding: '14px', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fda4af', color: '#e11d48' }}>
                                    <strong>Error:</strong> {editError}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>report_name *</div>
                                <input
                                    value={editReportName}
                                    onChange={(e) => setEditReportName(e.target.value)}
                                    placeholder="ชื่อรายงาน"
                                    disabled={editSaving}
                                    style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white', fontSize: '14px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>pass_key (ไม่ระบุก็ได้)</div>
                                <input
                                    type="password"
                                    value={editPassKey}
                                    onChange={(e) => setEditPassKey(e.target.value)}
                                    placeholder="รหัสผ่านสำหรับเรียกดูรายงาน (ถ้าต้องการควบคุมการเข้าถึง)"
                                    disabled={editSaving}
                                    style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white', fontSize: '14px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>sql_command * (เฉพาะ SELECT)</div>
                                <textarea
                                    value={editSqlCommand}
                                    onChange={(e) => setEditSqlCommand(e.target.value)}
                                    placeholder="เช่น: select 1 as a, 2 as b"
                                    disabled={editSaving}
                                    rows={8}
                                    style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white', fontSize: '14px', outline: 'none', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
                                />
                            </div>
                        </div>

                        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--bg-secondary)' }}>
                            <button
                                onClick={closeEditModal}
                                disabled={editSaving}
                                style={{
                                    padding: '9px 14px', borderRadius: '10px',
                                    border: '1px solid var(--border)', background: 'white',
                                    cursor: editSaving ? 'not-allowed' : 'pointer',
                                    fontSize: '13.5px', color: 'var(--text-muted)'
                                }}
                            >
                                ปิด
                            </button>
                            <button
                                onClick={submitEdit}
                                disabled={editSaving}
                                style={{
                                    padding: '9px 14px', borderRadius: '10px',
                                    border: 'none', background: 'var(--accent)',
                                    cursor: editSaving ? 'not-allowed' : 'pointer',
                                    fontSize: '13.5px', color: 'white',
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    opacity: editSaving ? 0.75 : 1
                                }}
                            >
                                <Save size={16} /> {editSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
