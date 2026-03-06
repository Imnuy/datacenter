import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
    try {
        const conn = await pool.getConnection()

        const [rows] = await conn.execute(`
            SELECT 
                hospcode, 
                hosname
            FROM c_hos 
            ORDER BY hospcode ASC
        `)

        conn.release()
        return NextResponse.json({ success: true, data: rows })
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}
