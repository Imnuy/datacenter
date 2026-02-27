import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
    try {
        const conn = await pool.getConnection()
        const [rows] = await conn.execute(`
            SELECT id, report_name, sql_command, is_active, d_update
            FROM custom_report
            ORDER BY id
        `)
        conn.release()
        return NextResponse.json({ success: true, data: rows })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
    }
}
