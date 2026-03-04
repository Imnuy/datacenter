import { NextResponse } from 'next/server'
import pool from '@/lib/db'

const MAX_ROWS = 2000
const ADMIN_PASS = process.env.CUSTOM_REPORT_ADMIN_PASS ?? 'admin112233'
const RUN_PASS = process.env.CUSTOM_REPORT_RUN_PASS ?? ADMIN_PASS
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
        const body = await request.json().catch(() => null) as null | { id?: number; pass?: string }
        const id = Number(body?.id)
        const pass = String(body?.pass ?? '').trim()

        if (!Number.isFinite(id) || id <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
        }

        if (!pass || pass !== RUN_PASS) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const conn = await pool.getConnection()
        try {
            await conn.execute("SET NAMES 'utf8mb4'")
            const [metaRows] = await conn.execute(
                `SELECT id, report_name, sql_command, is_active, d_update FROM custom_report WHERE id = ? LIMIT 1`,
                [id]
            ) as any

            const meta = (metaRows as any[])?.[0]
            if (!meta) {
                return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 })
            }

            if (String(meta.is_active || '').toLowerCase() !== 'y') {
                return NextResponse.json({ success: false, error: 'Report is not active' }, { status: 400 })
            }

            const sql = String(meta.sql_command || '')
            if (!isSafeSelect(sql)) {
                return NextResponse.json({ success: false, error: 'Unsafe SQL blocked by policy' }, { status: 400 })
            }

            const limitedSql = `SELECT * FROM ( ${sql} ) t LIMIT ${MAX_ROWS}`
            const [rows, fields] = await conn.execute(limitedSql) as any

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
