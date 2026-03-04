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
    } else if (type === 'top-diag') {
      const year = searchParams.get('year') ?? '2568'
      const hospcode = searchParams.get('hospcode') ?? ''

      // แปลงปีงบประมาณไทย -> ช่วง date_serv
      // ปีงบ 2569 = 1 ต.ค. 2568 (พ.ศ.) = 1 ต.ค. 2025 (ค.ศ.) → 30 ก.ย. 2026 (ค.ศ.)
      const buddhistYear = parseInt(year)
      const startDate = `${buddhistYear - 543 - 1}1001`  // ต.ค. ปีที่แล้ว (ค.ศ.)
      const endDate = `${buddhistYear - 543}0930`       // ก.ย. ปีนี้ (ค.ศ.)

      const hosFilter = hospcode ? `AND d.hospcode = ?` : ''
      const params: any[] = hospcode ? [startDate, endDate, hospcode] : [startDate, endDate]

      const [r] = await conn.execute(`
                SELECT hospcode, hosname, diagcode, total, rn
                FROM (
                    SELECT 
                        h.hospcode,
                        h.hosname,
                        d.diagcode,
                        COUNT(*) as total,
                        ROW_NUMBER() OVER (PARTITION BY d.hospcode ORDER BY COUNT(*) DESC) AS rn
                    FROM diagnosis_opd d
                    LEFT JOIN c_hos h ON d.hospcode = h.hospcode
                    WHERE d.diagtype = '1'
                      AND d.diagcode NOT LIKE 'Z%'
                      AND d.date_serv >= ?
                      AND d.date_serv <= ?
                      ${hosFilter}
                    GROUP BY d.hospcode, h.hosname, d.diagcode
                ) ranked
                WHERE rn <= 10
                ORDER BY hospcode, total DESC
            `, params)
      rows = r as any[]
    } else if (type === 'top-diag-district') {
      const year = searchParams.get('year') ?? '2569'
      const buddhistYear = parseInt(year)
      const startDate = `${buddhistYear - 543 - 1}1001`
      const endDate = `${buddhistYear - 543}0930`

      const [r] = await conn.execute(`
        SELECT diagcode, COUNT(*) as total
        FROM diagnosis_opd
        WHERE diagtype = '1'
          AND diagcode NOT LIKE 'Z%'
          AND date_serv >= ?
          AND date_serv <= ?
        GROUP BY diagcode
        ORDER BY total DESC
        LIMIT 10
      `, [startDate, endDate])
      rows = r as any[]
    } else if (type === 'top-drug') {
      const year = searchParams.get('year') ?? '2568'
      const hospcode = searchParams.get('hospcode') ?? ''

      const buddhistYear = parseInt(year)
      const startDate = `${buddhistYear - 543 - 1}1001`
      const endDate = `${buddhistYear - 543}0930`

      const hosFilter = hospcode ? `AND dr.hospcode = ?` : ''
      const params: any[] = hospcode ? [startDate, endDate, hospcode] : [startDate, endDate]

      const [r] = await conn.execute(`
        SELECT hospcode, hosname, didstd, dname, total, rn
        FROM (
          SELECT
            h.hospcode,
            h.hosname,
            dr.didstd,
            MAX(dr.dname) as dname,
            COUNT(*) as total,
            ROW_NUMBER() OVER (PARTITION BY dr.hospcode ORDER BY COUNT(*) DESC) AS rn
          FROM drug_opd dr
          LEFT JOIN c_hos h ON dr.hospcode = h.hospcode
          WHERE dr.date_serv >= ?
            AND dr.date_serv <= ?
            ${hosFilter}
          GROUP BY dr.hospcode, h.hosname, dr.didstd
        ) ranked
        WHERE rn <= 10
        ORDER BY hospcode, total DESC
      `, params)
      rows = r as any[]
    } else if (type === 'top-drug-district') {
      const year = searchParams.get('year') ?? '2569'
      const buddhistYear = parseInt(year)
      const startDate = `${buddhistYear - 543 - 1}1001`
      const endDate = `${buddhistYear - 543}0930`

      const [r] = await conn.execute(`
        SELECT didstd, MAX(dname) as dname, COUNT(*) as total
        FROM drug_opd
        WHERE date_serv >= ?
          AND date_serv <= ?
        GROUP BY didstd
        ORDER BY total DESC
        LIMIT 10
      `, [startDate, endDate])
      rows = r as any[]
    }

    conn.release()
    return NextResponse.json({ success: true, data: rows })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
