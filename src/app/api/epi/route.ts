import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
    try {
        const conn = await pool.getConnection()
        const [r] = await conn.execute(`
      SELECT 
        h.hospcode, h.hosname,
        COUNT(*) as total_epi,
        COUNT(DISTINCT CONCAT(e.hospcode, e.pid)) as total_persons
      FROM epi e
      LEFT JOIN c_hos h ON e.hospcode = h.hospcode
      WHERE e.date_serv >= '2025-10-01'
      GROUP BY h.hospcode, h.hosname
      ORDER BY h.hospcode
    `)
        conn.release()
        return NextResponse.json({ success: true, data: r })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
    }
}
