import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    // Default to 2569 if no year is provided
    const yearStr = searchParams.get('year') || '2569'
    const year = parseInt(yearStr, 10)
    const type = searchParams.get('type') || 'visit' // 'visit' or 'epi'

    // Fiscal year parsing
    // E.g., FY 2569 covers 2025-10-01 to 2026-09-30
    const startYear = year - 544
    const endYear = year - 543

    const startDate = `${startYear}1001`
    const endDate = `${endYear}0930`

    try {
        const conn = await pool.getConnection()
        let sql = ''

        if (type === 'epi') {
            sql = `
        SELECT 
          h.hospcode, 
          h.hosname,
          SUBSTRING(e.date_serv, 1, 6) as yyyymm, 
          COUNT(*) as total_count 
        FROM epi e 
        LEFT JOIN c_hos h ON e.hospcode = h.hospcode
        WHERE e.date_serv >= ? AND e.date_serv <= ?
        GROUP BY h.hospcode, h.hosname, yyyymm
        ORDER BY h.hospcode, yyyymm
      `
        } else {
            sql = `
        SELECT 
          h.hospcode, 
          h.hosname,
          SUBSTRING(s.date_serv, 1, 6) as yyyymm, 
          COUNT(*) as total_count 
        FROM service s 
        LEFT JOIN c_hos h ON s.hospcode = h.hospcode
        WHERE s.date_serv >= ? AND s.date_serv <= ?
        GROUP BY h.hospcode, h.hosname, yyyymm
        ORDER BY h.hospcode, yyyymm
      `
        }

        const [rows] = await conn.execute(sql, [startDate, endDate])
        conn.release()

        return NextResponse.json({ success: true, data: rows })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
    }
}
