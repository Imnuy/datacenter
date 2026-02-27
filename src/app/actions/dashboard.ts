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

        // ผู้ป่วยโรคเรื้อรัง DM+HT (จำนวนคนไม่ซ้ำ)
        const [chronicRows] = await conn.execute(
            `SELECT COUNT(DISTINCT CONCAT(c.hospcode, c.pid)) as total 
       FROM chronic c 
       INNER JOIN person p ON c.hospcode=p.hospcode AND c.pid=p.pid 
       WHERE p.typearea IN ('1','3') 
         AND (p.discharge='9' OR p.discharge IS NULL OR p.discharge='') 
         AND (c.chronic LIKE 'E1%' OR c.chronic LIKE 'I1%')`
        ) as any[]
        const chronic = Number(chronicRows[0]?.total || 0)

        // LAB (ปีงบ 69)
        const [labRows] = await conn.execute(
            `SELECT COUNT(*) as total FROM labfu WHERE date_serv >= '2025-10-01'`
        ) as any[]
        const lab = Number(labRows[0]?.total || 0)

        // ANC (ปีงบ 69)
        const [ancRows] = await conn.execute(
            `SELECT COUNT(*) as total FROM anc WHERE date_serv >= '2025-10-01'`
        ) as any[]
        const anc = Number(ancRows[0]?.total || 0)

        // วัคซีน EPI (ปีงบ 69)
        const [epiRows] = await conn.execute(
            `SELECT COUNT(*) as total FROM epi WHERE date_serv >= '2025-10-01'`
        ) as any[]
        const epi = Number(epiRows[0]?.total || 0)

        // คลอด (ปีงบ 69)
        const [birthRows] = await conn.execute(
            `SELECT COUNT(*) as total FROM labor WHERE bdate >= '2025-10-01'`
        ) as any[]
        const birth = Number(birthRows[0]?.total || 0)

        return { hospitals, population, houses, opd, chronic, lab, anc, epi, birth }
    } finally {
        conn.release()
    }
}
