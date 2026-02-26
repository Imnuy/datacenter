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
                ;[rows] = await conn.execute(sql, params)

        } else if (type === 'age-group') {
            // แบ่งกลุ่มอายุ
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
        WHERE (discharge IS NULL OR discharge = '')
          AND TIMESTAMPDIFF(YEAR, birth, CURDATE()) BETWEEN ? AND ?
      `
            const params: (string | number)[] = [Number(ageMin), Number(ageMax)]
            if (sex) { sql += ` AND sex = ?`; params.push(sex) }
            sql += ` GROUP BY age_group, sex ORDER BY FIELD(age_group,'< 1 ปี','1-5 ปี','6-14 ปี','15-24 ปี','25-34 ปี','35-44 ปี','45-54 ปี','55-64 ปี','65 ปีขึ้นไป')`
                ;[rows] = await conn.execute(sql, params)

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
