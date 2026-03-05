import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { ResultSetHeader } from 'mysql2/promise'

type CreateBody = {
    report_name?: string
    sql_command?: string
    pass_key?: string
    pass?: string
}

function isSafeSelect(sql: string): boolean {
    const trimmed = sql.trim()
    if (!trimmed) return false

    // disallow multiple statements
    if (trimmed.includes(';')) return false

    const lower = trimmed.toLowerCase()
    if (lower.startsWith('select')) return true
    if (lower.startsWith('with')) return true

    return false
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null) as CreateBody | null
        const report_name = String(body?.report_name ?? '').trim()
        const sql_command = String(body?.sql_command ?? '').trim()
        const pass_key = String(body?.pass_key ?? '').trim()
        const pass = String(body?.pass ?? '')

        if (pass !== 'admin112233') {
            return NextResponse.json({ success: false, error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 })
        }

        if (!report_name) {
            return NextResponse.json({ success: false, error: 'report_name is required' }, { status: 400 })
        }
        if (!sql_command) {
            return NextResponse.json({ success: false, error: 'sql_command is required' }, { status: 400 })
        }
        if (!pass_key) {
            return NextResponse.json({ success: false, error: 'pass_key is required' }, { status: 400 })
        }
        if (!isSafeSelect(sql_command)) {
            return NextResponse.json({ success: false, error: 'Only single SELECT statements are allowed' }, { status: 400 })
        }

        const conn = await pool.getConnection()
        try {
            const [result] = await conn.execute<ResultSetHeader>(
                `INSERT INTO custom_report (report_name, sql_command, pass_key, is_active, d_update) VALUES (?, ?, ?, 'y', NOW())`,
                [report_name, sql_command, pass_key]
            )

            const insertId = Number(result.insertId || 0)
            return NextResponse.json({ success: true, id: insertId })
        } finally {
            conn.release()
        }
    } catch (err) {
        console.error(err)
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
    }
}
