import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
    try {
        const conn = await pool.getConnection()
        const [r] = await conn.execute(`
      SELECT 
        h.hospcode, h.hosname,
        COUNT(DISTINCT CONCAT(a.hospcode, a.pid, a.seq)) as anc_count,
        COUNT(DISTINCT CONCAT(a.hospcode, a.pid)) as mothers
      FROM anc a
      LEFT JOIN c_hos h ON a.hospcode = h.hospcode
      WHERE a.date_serv >= '20251001'
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
