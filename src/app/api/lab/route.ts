import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'lab-summary'

    try {
        const conn = await pool.getConnection()
        let rows: any[] = []

        if (type === 'lab-summary') {
            const [r] = await conn.execute(`
        SELECT 
          h.hospcode, h.hosname,
          COUNT(*) as total_lab,
          COUNT(DISTINCT CONCAT(l.hospcode, l.pid)) as total_patients
        FROM labfu l
        LEFT JOIN c_hos h ON l.hospcode = h.hospcode
        WHERE l.date_serv >= '2025-10-01'
        GROUP BY h.hospcode, h.hosname
        ORDER BY h.hospcode
      `)
            rows = r as any[]
        }

        conn.release()
        return NextResponse.json({ success: true, data: rows })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
    }
}
