import { NextResponse } from 'next/server'
import pool from '@/lib/db'

const MAX_ROWS = 2000

function isSafeSelect(sql: string): boolean {
    const trimmed = sql.trim()
    if (!trimmed) return false

    // disallow multiple statements
    if (trimmed.includes(';')) return false

    // must start with select or with (cte) ... select
    const lower = trimmed.toLowerCase()
    if (lower.startsWith('select')) return true
    if (lower.startsWith('with')) return true

    return false
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null) as null | { id?: number; pass_key?: string }
        const id = Number(body?.id)
        const pass_key = String(body?.pass_key ?? '').trim()

        if (!Number.isFinite(id) || id <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
        }
        if (!pass_key) {
            return NextResponse.json({ success: false, error: 'pass_key is required' }, { status: 400 })
        }

        const conn = await pool.getConnection()
        try {
            await conn.execute("SET NAMES 'utf8mb4'")
            const [metaRows] = await conn.execute(
                `SELECT id, report_name, sql_command, pass_key, is_active, d_update FROM custom_report WHERE id = ? LIMIT 1`,
                [id]
            ) as any

            const meta = (metaRows as any[])?.[0]
            if (!meta) {
                return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 })
            }

            if (String(meta.is_active || '').toLowerCase() !== 'y') {
                return NextResponse.json({ success: false, error: 'Report is not active' }, { status: 400 })
            }

            const expectedPassKey = String(meta.pass_key ?? '').trim()
            if (!expectedPassKey) {
                return NextResponse.json({ success: false, error: 'Report pass_key is not configured' }, { status: 400 })
            }
            if (pass_key !== expectedPassKey) {
                return NextResponse.json({ success: false, error: 'pass_key ไม่ถูกต้อง' }, { status: 401 })
            }

            const sql = String(meta.sql_command || '')
            if (!isSafeSelect(sql)) {
                return NextResponse.json({ success: false, error: 'Only single SELECT statements are allowed' }, { status: 400 })
            }

            const limitedSql = `SELECT * FROM ( ${sql} ) t LIMIT ${MAX_ROWS}`
            const [rows, fields] = await conn.query(limitedSql) as any

            const columns: string[] = Array.isArray(fields) ? fields.map((f: any) => f.name) : []

            return NextResponse.json({
                success: true,
                meta: {
                    id: meta.id,
                    report_name: meta.report_name,
                    d_update: meta.d_update,
                },
                columns,
                data: rows,
                rowCount: Array.isArray(rows) ? rows.length : 0,
                maxRows: MAX_ROWS,
            })
        } finally {
            conn.release()
        }
    } catch (err) {
        console.error(err)
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
    }
}
