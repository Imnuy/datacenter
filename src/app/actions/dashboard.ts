'use server'

import pool from '@/lib/db'

export interface DashboardSummary {
    hospitals: number
    population: number
    houses: number
    opd: number
    chronic: number
    lab: number
    anc: number
    epi: number
    birth: number
    staff: number
    hbv: number
    hcv: number
    hospitalTypes: { name: string, count: number, color: string, percentage: number }[]
    patientAges: { name: string, count: number, percentage: number, color: string }[]
    genderStats: {
        total: number
        male: number
        female: number
        malePercent: number
        femalePercent: number
    }
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
    const conn = await pool.getConnection()
    try {
        // จำนวนหน่วยบริการ
        const [hosRows] = await conn.execute(
            `SELECT COUNT(*) as total FROM c_hos`
        ) as any[]
        const hospitals = Number(hosRows[0]?.total || 0)

        // ประชากรทั้งหมด (type 1,3 ยังไม่ discharge)
        const [popRows] = await conn.execute(
            `SELECT COUNT(*) as total FROM person WHERE typearea IN ('1','3') AND (discharge = '9' OR discharge IS NULL OR discharge = '')`
        ) as any[]
        const population = Number(popRows[0]?.total || 0)

        // หลังคาเรือน
        const [houseRows] = await conn.execute(
            `SELECT COUNT(DISTINCT CONCAT(hospcode, hid)) as total FROM home`
        ) as any[]
        const houses = Number(houseRows[0]?.total || 0)

        // ผู้รับบริการ OPD (ปีงบ 69)
        const [opdRows] = await conn.execute(
            `SELECT COUNT(DISTINCT CONCAT(hospcode, pid, seq)) as total FROM service WHERE date_serv >= '2025-10-01'`
        ) as any[]
        const opd = Number(opdRows[0]?.total || 0)

        // ผู้ป่วยโรคเรื้อรัง DM+HT
        const [chronicRows] = await conn.execute(
            `SELECT COUNT(DISTINCT CONCAT(c.hospcode, c.pid)) as total 
       FROM chronic c 
       INNER JOIN person p ON c.hospcode=p.hospcode AND c.pid=p.pid 
       WHERE p.typearea IN ('1','3') 
         AND (p.discharge='9' OR p.discharge IS NULL OR p.discharge='') 
         AND (c.chronic LIKE 'E1%' OR c.chronic LIKE 'I1%')`
        ) as any[]
        const chronic = Number(chronicRows[0]?.total || 0)

        // LAB, ANC, EPI, Birth, HBV, HCV
        const [[labRows], [ancRows], [epiRows], [birthRows], [hbvRows], [hcvRows]] = await Promise.all([
            conn.execute(`SELECT COUNT(*) as total FROM labfu WHERE date_serv >= '2025-10-01'`),
            conn.execute(`SELECT COUNT(*) as total FROM anc WHERE date_serv >= '2025-10-01'`),
            conn.execute(`SELECT COUNT(*) as total FROM epi WHERE date_serv >= '2025-10-01'`),
            conn.execute(`SELECT COUNT(*) as total FROM labor WHERE bdate >= '2025-10-01'`),
            conn.execute(`SELECT COUNT(*) as total FROM labfu WHERE labtest = '0746299' AND date_serv >= '2025-10-01'`),
            conn.execute(`SELECT COUNT(*) as total FROM labfu WHERE labtest = '0741699' AND date_serv >= '2025-10-01'`)
        ]) as any[]

        const lab = Number(labRows[0]?.total || 0)
        const anc = Number(ancRows[0]?.total || 0)
        const epi = Number(epiRows[0]?.total || 0)
        const birth = Number(birthRows[0]?.total || 0)
        const hbv = Number(hbvRows[0]?.total || 0)
        const hcv = Number(hcvRows[0]?.total || 0)

        // --- เพิ่มเติมสำหรับ Design ใหม่ ---

        // จำนวนบุคลากร
        const [staffRows] = await conn.execute(`SELECT COUNT(*) as total FROM provider`) as any[]
        const staff = Number(staffRows[0]?.total || 0)

        // ประเภทหน่วยบริการ (รวม รพ.สต. และ โรงพยาบาลส่งเสริมสุขภาพตำบล)
        const [hostypeRows] = await conn.execute(`
            SELECT 
                'โรงพยาบาลส่งเสริมสุขภาพตำบล' as hostype_name,
                COUNT(*) as count 
            FROM c_hos 
            WHERE hostype IN ('รพ.สต.', 'โรงพยาบาลส่งเสริมสุขภาพตำบล')
        `) as any[]
        const colors = ['#2DD4BF', '#A3E635', '#FB923C', '#6366f1']
        const hospitalTypes = hostypeRows.map((r: any, i: number) => ({
            name: r.hostype_name,
            count: Number(r.count),
            color: colors[i % colors.length],
            percentage: hospitals > 0 ? Math.round((r.count / hospitals) * 100) : 0
        }))

        // สถิติแยกตามเพศ
        const [genderRows] = await conn.execute(`
            SELECT sex, COUNT(*) as count 
            FROM person 
            WHERE typearea IN ('1','3') AND (discharge = '9' OR discharge IS NULL OR discharge = '')
            GROUP BY sex
        `) as any[]
        let male = 0, female = 0
        genderRows.forEach((r: any) => {
            if (r.sex === '1') male = Number(r.count)
            if (r.sex === '2') female = Number(r.count)
        })
        const totalGender = male + female
        const malePercent = totalGender > 0 ? Math.round((male / totalGender) * 100) : 0
        const femalePercent = totalGender > 0 ? Math.round((female / totalGender) * 100) : 0
        const genderStats = { total: population, male, female, malePercent, femalePercent }

        // ช่วงอายุ
        const [ageRows] = await conn.execute(`
            SELECT 
                CASE 
                    WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) <= 15 THEN '0-15 ปี'
                    WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) <= 30 THEN '16-30 ปี'
                    WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) <= 45 THEN '31-45 ปี'
                    WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) <= 60 THEN '46-60 ปี'
                    WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) <= 75 THEN '61-75 ปี'
                    ELSE '76 ปีขึ้นไป'
                END as age_group,
                COUNT(*) as count,
                CASE 
                    WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) <= 15 THEN 1
                    WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) <= 30 THEN 2
                    WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) <= 45 THEN 3
                    WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) <= 60 THEN 4
                    WHEN TIMESTAMPDIFF(YEAR, birth, CURDATE()) <= 75 THEN 5
                    ELSE 6
                END as sort_order
            FROM person
            WHERE typearea IN ('1','3') AND (discharge = '9' OR discharge IS NULL OR discharge = '')
            GROUP BY age_group, sort_order
            ORDER BY sort_order
        `) as any[]
        const ageColors: Record<string, string> = {
            '0-15 ปี': '#2DD4BF',
            '16-30 ปี': '#10B981',
            '31-45 ปี': '#A3E635',
            '46-60 ปี': '#FACC15',
            '61-75 ปี': '#FB923C',
            '76 ปีขึ้นไป': '#F87171'
        }
        const patientAges = ageRows.map((r: any) => ({
            name: r.age_group,
            count: Number(r.count),
            percentage: population > 0 ? Math.round((r.count / population) * 100) : 0,
            color: ageColors[r.age_group] || '#CBD5E1'
        }))

        return {
            hospitals, population, houses, opd, chronic, lab, anc, epi, birth,
            staff, hbv, hcv,
            hospitalTypes,
            genderStats,
            patientAges,
        }
    } finally {
        conn.release()
    }
}
