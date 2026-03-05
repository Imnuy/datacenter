import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { ResultSetHeader } from 'mysql2/promise'

type DeleteBody = {
    id?: number
    pass?: string
}

const ADMIN_PASS = process.env.CUSTOM_REPORT_ADMIN_PASS ?? 'admin112233'

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null) as DeleteBody | null
        const id = Number(body?.id)
        const pass = String(body?.pass ?? '')

        if (!pass || pass !== ADMIN_PASS) {
            return NextResponse.json({ success: false, error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 })
        }
        if (!Number.isFinite(id) || id <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
        }

        const conn = await pool.getConnection()
        try {
            const [result] = await conn.execute<ResultSetHeader>(
                'DELETE FROM custom_report WHERE id = ?',
                [id]
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
