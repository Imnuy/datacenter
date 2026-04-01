import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { customReportHasPassKeyColumn } from '@/lib/custom-report-schema'

export async function GET() {
    try {
        const conn = await pool.getConnection()
        try {
            const hasPassKey = await customReportHasPassKeyColumn()
            const [rows] = await conn.execute(
                hasPassKey
                    ? `
                        SELECT id, report_name, sql_command, pass_key, is_active, d_update
                        FROM custom_report
                        ORDER BY id
                    `
                    : `
                        SELECT id, report_name, sql_command, is_active, d_update
                        FROM custom_report
                        ORDER BY id
                    `
            )
            return NextResponse.json({ success: true, data: rows })
        } finally {
            conn.release()
        }
    } catch (err) {
        console.error(err)
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
    }
}
