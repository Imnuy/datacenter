import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { ResultSetHeader } from 'mysql2/promise'

type CreateBody = {
    report_name?: string
    sql_command?: string
    pass_key?: string
    pass?: string
}

const ADMIN_PASS = process.env.CUSTOM_REPORT_ADMIN_PASS ?? 'admin112233'
const DEFAULT_ALLOWED_TABLES = 'reimbursement,c_hos,person,home,service,diagnosis_opd,drug_opd,epi,labfu,anc,chronic,labor,custom_report'
const ALLOWED_TABLES = new Set(
    String(process.env.CUSTOM_REPORT_ALLOWED_TABLES ?? DEFAULT_ALLOWED_TABLES)
        .split(',')
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean)
)

const BLOCKED_SQL_PATTERN = /\b(insert|update|delete|drop|alter|truncate|create|replace|grant|revoke|call|do|handler|load_file|outfile|dumpfile|sleep|benchmark|information_schema|performance_schema|mysql)\b/i

function extractTableNames(sql: string): string[] {
    const tables = new Set<string>()
    const re = /\b(?:from|join)\s+([`"\w.]+)/gi
    let m: RegExpExecArray | null = null
    while ((m = re.exec(sql)) !== null) {
        const raw = String(m[1] ?? '').trim()
        if (!raw) continue
        const normalized = raw.replace(/[`"]/g, '').split('.').pop()?.toLowerCase() ?? ''
        if (normalized) tables.add(normalized)
    }
    return Array.from(tables)
}

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

    const tables = extractTableNames(trimmed)
    if (tables.length === 0) return false

    // every referenced table must be allowlisted
    if (tables.some((t) => !ALLOWED_TABLES.has(t))) return false

    return true
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null) as CreateBody | null
        const report_name = String(body?.report_name ?? '').trim()
        const sql_command = String(body?.sql_command ?? '').trim()
        const pass_key = String(body?.pass_key ?? '').trim()
        const pass = String(body?.pass ?? '')

        if (!pass || pass !== ADMIN_PASS) {
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
            return NextResponse.json({ success: false, error: 'Unsafe SQL blocked by policy' }, { status: 400 })
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
