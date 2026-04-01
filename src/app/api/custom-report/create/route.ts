import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { ResultSetHeader } from 'mysql2/promise'
import { customReportHasPassKeyColumn } from '@/lib/custom-report-schema'

type CreateBody = {
    report_name?: string
    sql_command?: string
    pass_key?: string
}

const BLOCKED_SQL_PATTERN = /\b(insert|update|delete|drop|alter|truncate|create|replace|grant|revoke|call|do|handler|load_file|outfile|dumpfile|sleep|benchmark|information_schema|performance_schema|mysql)\b/i

function isSafeSelect(sql: string): boolean {
    const trimmed = sql.trim()
    if (!trimmed || trimmed.length > 10000) return false

    // disallow multiple statements
    if (trimmed.includes(';')) return false

    // disallow SQL comments
    if (trimmed.includes('--') || trimmed.includes('/*') || trimmed.includes('*/') || trimmed.includes('#')) return false

    // must start with select or with (cte) ... select
    const lower = trimmed.toLowerCase()
    if (!lower.startsWith('select') && !lower.startsWith('with')) return false

    // disallow dangerous keywords/functions and sensitive schemas
    if (BLOCKED_SQL_PATTERN.test(lower)) return false

    return true
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null) as CreateBody | null
        const report_name = String(body?.report_name ?? '').trim()
        const sql_command = String(body?.sql_command ?? '').trim()
        const pass_key = String(body?.pass_key ?? '').trim()

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
            const hasPassKey = await customReportHasPassKeyColumn()
            const [result] = hasPassKey
                ? await conn.execute<ResultSetHeader>(
                    `INSERT INTO custom_report (report_name, sql_command, pass_key, is_active, d_update) VALUES (?, ?, ?, 'y', NOW())`,
                    [report_name, sql_command, pass_key]
                )
                : await conn.execute<ResultSetHeader>(
                    `INSERT INTO custom_report (report_name, sql_command, is_active, d_update) VALUES (?, ?, 'y', NOW())`,
                    [report_name, sql_command]
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
