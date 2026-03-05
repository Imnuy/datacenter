import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { ResultSetHeader } from 'mysql2/promise'

type UpdateBody = {
    id?: number
    report_name?: string
    sql_command?: string
    pass_key?: string
    pass?: string
}

const ADMIN_PASS = process.env.CUSTOM_REPORT_ADMIN_PASS ?? 'admin112233'
const BLOCKED_SQL_PATTERN = /\b(insert|update|delete|drop|alter|truncate|create|replace|grant|revoke|call|do|handler|load_file|outfile|dumpfile|sleep|benchmark|information_schema|performance_schema|mysql)\b/i

function isSafeSelect(sql: string): boolean {
    const trimmed = sql.trim()
    if (!trimmed || trimmed.length > 10000) return false
    if (trimmed.includes(';')) return false
    if (trimmed.includes('--') || trimmed.includes('/*') || trimmed.includes('*/') || trimmed.includes('#')) return false

    const lower = trimmed.toLowerCase()
    if (!lower.startsWith('select') && !lower.startsWith('with')) return false
    if (BLOCKED_SQL_PATTERN.test(lower)) return false

    return true
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null) as UpdateBody | null
        const id = Number(body?.id)
        const report_name = String(body?.report_name ?? '').trim()
        const sql_command = String(body?.sql_command ?? '').trim()
        const pass_key = String(body?.pass_key ?? '').trim()
        const pass = String(body?.pass ?? '')

        if (!pass || pass !== ADMIN_PASS) {
            return NextResponse.json({ success: false, error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 })
        }
        if (!Number.isFinite(id) || id <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
        }
        if (!report_name) {
            return NextResponse.json({ success: false, error: 'report_name is required' }, { status: 400 })
        }
        if (!sql_command) {
            return NextResponse.json({ success: false, error: 'sql_command is required' }, { status: 400 })
        }
        if (!isSafeSelect(sql_command)) {
            return NextResponse.json({ success: false, error: 'Unsafe SQL blocked by policy' }, { status: 400 })
        }

        const conn = await pool.getConnection()
        try {
            const [result] = await conn.execute<ResultSetHeader>(
                `UPDATE custom_report
                 SET report_name = ?, sql_command = ?, pass_key = ?, d_update = NOW()
                 WHERE id = ?`,
                [report_name, sql_command, pass_key, id]
            )

            if (!result.affectedRows) {
                return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 })
            }

            return NextResponse.json({ success: true })
        } finally {
            conn.release()
        }
    } catch (err) {
        console.error(err)
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
    }
}
