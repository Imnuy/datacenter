import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'dm-ht-summary'

    try {
        const conn = await pool.getConnection()

        let rows: any[] = []

        if (type === 'dm-ht-summary') {
            // Query DM, HT, DM+HT counts per hospital
            // Using person table and chronic table
            // chronic.chronic contains ICD10 codes: 
            // DM: E10-E14
            // HT: I10-I15

            const sql = `
        SELECT 
          h.hospcode,
          h.hosname,
          SUM(CASE WHEN (c.dm = 1 AND c.ht = 0) THEN 1 ELSE 0 END) as dm_only,
          SUM(CASE WHEN (c.dm = 0 AND c.ht = 1) THEN 1 ELSE 0 END) as ht_only,
          SUM(CASE WHEN (c.dm = 1 AND c.ht = 1) THEN 1 ELSE 0 END) as dm_ht_both,
          COUNT(*) as total_patients
        FROM (
          SELECT 
            p.hospcode,
            p.pid,
            MAX(CASE WHEN (ch.chronic BETWEEN 'E10' AND 'E149') OR (ch.chronic LIKE 'E10%') OR (ch.chronic LIKE 'E11%') OR (ch.chronic LIKE 'E12%') OR (ch.chronic LIKE 'E13%') OR (ch.chronic LIKE 'E14%') THEN 1 ELSE 0 END) as dm,
            MAX(CASE WHEN (ch.chronic BETWEEN 'I10' AND 'I159') OR (ch.chronic LIKE 'I10%') OR (ch.chronic LIKE 'I11%') OR (ch.chronic LIKE 'I12%') OR (ch.chronic LIKE 'I13%') OR (ch.chronic LIKE 'I14%') OR (ch.chronic LIKE 'I15%') THEN 1 ELSE 0 END) as ht
          FROM person p
          INNER JOIN chronic ch ON p.hospcode = ch.hospcode AND p.pid = ch.pid
          WHERE p.typearea IN ('1', '3')
            AND (p.discharge = '9' OR p.discharge IS NULL OR p.discharge = '')
          GROUP BY p.hospcode, p.pid
          HAVING dm = 1 OR ht = 1
        ) c
        RIGHT JOIN c_hos h ON c.hospcode = h.hospcode
        GROUP BY h.hospcode, h.hosname
        ORDER BY h.hospcode
      `
            const [r] = await conn.execute(sql)
            rows = r as any[]
        }

        conn.release()
        return NextResponse.json({ success: true, data: rows })
    } catch (err) {
        console.error(err)
        return NextResponse.json(
            { success: false, error: String(err) },
            { status: 500 }
        )
    }
}
