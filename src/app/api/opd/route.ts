import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'visit-summary'

    try {
        const conn = await pool.getConnection()
        let rows: any[] = []

        if (type === 'visit-summary') {
            const [r] = await conn.execute(`
        SELECT 
          h.hospcode, h.hosname,
          COUNT(DISTINCT CONCAT(s.hospcode, s.pid, s.seq)) as total_visit,
          COUNT(DISTINCT CONCAT(s.hospcode, s.pid)) as total_patients
        FROM service s
        LEFT JOIN c_hos h ON s.hospcode = h.hospcode
        WHERE s.date_serv >= '2025-10-01'
        GROUP BY h.hospcode, h.hosname
        ORDER BY h.hospcode
      `)
            rows = r as any[]
        } else if (type === 'diag-summary') {
            const [r] = await conn.execute(`
        SELECT 
          h.hospcode, h.hosname,
          d.diagcode,
          COUNT(*) as total
        FROM diagnosis_opd d
        LEFT JOIN c_hos h ON d.hospcode = h.hospcode
        WHERE d.date_serv >= '20251001' AND d.diagtype = '1'
        GROUP BY h.hospcode, h.hosname, d.diagcode
        ORDER BY total DESC
        LIMIT 200
      `)
            rows = r as any[]
        } else if (type === 'drug-summary') {
            const [r] = await conn.execute(`
        SELECT 
          h.hospcode, h.hosname,
          COUNT(*) as total_dispense,
          COUNT(DISTINCT CONCAT(dr.hospcode, dr.pid, dr.seq)) as total_visit
        FROM drug_opd dr
        LEFT JOIN c_hos h ON dr.hospcode = h.hospcode
        WHERE dr.date_serv >= '20251001'
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
