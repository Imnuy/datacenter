import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASS ?? '',
    database: process.env.DB_NAME ?? 'datacenter',
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const ageMin = searchParams.get('ageMin') ?? '0'
    const ageMax = searchParams.get('ageMax') ?? '150'
    const sex = searchParams.get('sex') ?? ''
    const type = searchParams.get('type') ?? 'all'   // all | age-group | house

    try {
        const conn = await mysql.createConnection(dbConfig)

        let rows: unknown[] = []

        if (type === 'all') {
            // ทั้งหมด + filter อายุ + เพศ
            let sql = `
        SELECT
          TIMESTAMPDIFF(YEAR, birth, CURDATE()) AS age,
          sex,
          typearea,
          COUNT(*) AS total
        FROM person
        WHERE discharge IS NULL OR discharge = ''
          AND TIMESTAMPDIFF(YEAR, birth, CURDATE()) BETWEEN ? AND ?
      `
            const params: (string | number)[] = [Number(ageMin), Number(ageMax)]
            if (sex) { sql += ` AND sex = ?`; params.push(sex) }
            sql += ` GROUP BY age, sex, typearea ORDER BY age`
            const [r] = await conn.execute(sql, params)
            rows = r as unknown[]

        } else if (type === 'age-group') {
            // แบ่งกลุ่มอายุ (เดิม)
            let sql = `
        SELECT
          CASE
            WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) < 1  THEN '< 1 ปี'
            WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) < 6  THEN '1-5 ปี'
            WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) < 15 THEN '6-14 ปี'
            WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) < 25 THEN '15-24 ปี'
            WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) < 35 THEN '25-34 ปี'
            WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) < 45 THEN '35-44 ปี'
            WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) < 55 THEN '45-54 ปี'
            WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) < 65 THEN '55-64 ปี'
            ELSE '65 ปีขึ้นไป'
          END AS age_group,
          sex,
          COUNT(*) AS total
        FROM person
        WHERE (discharge = '9' OR discharge IS NULL OR discharge = '')
          AND TIMESTAMPDIFF(YEAR, birth, CURDATE()) BETWEEN ? AND ?
      `
            const params: (string | number)[] = [Number(ageMin), Number(ageMax)]
            if (sex) { sql += ` AND sex = ?`; params.push(sex) }
            sql += ` GROUP BY age_group, sex ORDER BY FIELD(age_group,'< 1 ปี','1-5 ปี','6-14 ปี','15-24 ปี','25-34 ปี','35-44 ปี','45-54 ปี','55-64 ปี','65 ปีขึ้นไป')`
            const [r] = await conn.execute(sql, params)
            rows = r as unknown[]

        } else if (type === 'hosp-age-5yr') {
            // ประชากรแยกสถานบริการ ช่วงอายุ 5 ปี (Type 1,3 ไม่จำหน่าย)
            const sql = `
        SELECT
          p.hospcode,
          h.hosname,
          CASE WHEN TIMESTAMPDIFF(YEAR, p.birth, CURDATE()) < 5 THEN '0-4'
               WHEN TIMESTAMPDIFF(YEAR, p.birth, CURDATE()) < 10 THEN '5-9'
               WHEN TIMESTAMPDIFF(YEAR, p.birth, CURDATE()) < 15 THEN '10-14'
               WHEN TIMESTAMPDIFF(YEAR, p.birth, CURDATE()) < 20 THEN '15-19'
               WHEN TIMESTAMPDIFF(YEAR, p.birth, CURDATE()) < 25 THEN '20-24'
               WHEN TIMESTAMPDIFF(YEAR, p.birth, CURDATE()) < 30 THEN '25-29'
               WHEN TIMESTAMPDIFF(YEAR, p.birth, CURDATE()) < 35 THEN '30-34'
               WHEN TIMESTAMPDIFF(YEAR, p.birth, CURDATE()) < 40 THEN '35-39'
               WHEN TIMESTAMPDIFF(YEAR, p.birth, CURDATE()) < 45 THEN '40-44'
               WHEN TIMESTAMPDIFF(YEAR, p.birth, CURDATE()) < 50 THEN '45-49'
               WHEN TIMESTAMPDIFF(YEAR, p.birth, CURDATE()) < 55 THEN '50-54'
               WHEN TIMESTAMPDIFF(YEAR, p.birth, CURDATE()) < 60 THEN '55-59'
               WHEN TIMESTAMPDIFF(YEAR, p.birth, CURDATE()) >= 60 THEN '60+'
               ELSE 'Unknown'
          END AS age_group,
          p.sex,
          COUNT(*) as total
        FROM person p
        LEFT JOIN c_hos h ON p.hospcode = h.hospcode
        WHERE p.typearea IN ('1', '3')
          AND (p.discharge = '9' OR p.discharge IS NULL OR p.discharge = '')
        GROUP BY p.hospcode, h.hosname, age_group, p.sex
        ORDER BY p.hospcode, age_group, p.sex
      `
            const [r] = await conn.execute(sql)
            rows = r as unknown[]

        } else if (type === 'house') {
            const [r] = await conn.execute(`SELECT COUNT(*) AS total FROM home`)
            rows = r as unknown[]
        }

        await conn.end()
        return NextResponse.json({ success: true, data: rows })
    } catch (err) {
        console.error(err)
        return NextResponse.json(
            { success: false, error: String(err) },
            { status: 500 }
        )
    }
}
