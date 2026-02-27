import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const hospcode = searchParams.get('hospcode')
    const yyyymm = searchParams.get('yyyymm')
    const pass = searchParams.get('pass')
    const type = searchParams.get('type') || 'epi'

    if (!hospcode || !yyyymm || !pass) {
        return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    // Validate password
    if (pass !== `${hospcode}112233`) {
        return NextResponse.json({ success: false, error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

    try {
        const conn = await pool.getConnection()

        if (type === 'epi') {
            const sql = `
        SELECT 
          e.hospcode,
          e.pid,
          p.name, 
          p.lname, 
          p.cid, 
          e.vaccinetype, 
          e.date_serv
        FROM epi e
        LEFT JOIN person p ON e.hospcode = p.hospcode AND e.pid = p.pid
        WHERE e.hospcode = ? AND SUBSTRING(e.date_serv, 1, 6) = ?
        ORDER BY e.date_serv
      `
            const [rows] = await conn.execute(sql, [hospcode, yyyymm]) as any[]

            // Censor data
            const censoredRows = rows.map((r: any) => {
                let censorName = r.name || ''
                let censorLname = r.lname ? (r.lname.substring(0, 1) + '***') : ''

                let censorCid = r.cid || ''
                if (censorCid && censorCid.length === 13) {
                    censorCid = `${censorCid[0]}-XXXX-XXXXX-${censorCid[11]}-${censorCid[12]}`
                } else if (censorCid) {
                    censorCid = 'X'.repeat(censorCid.length)
                }

                return {
                    'HOSPCODE': r.hospcode || '',
                    'PID': r.pid || '',
                    'ชื่อ': censorName,
                    'นามสกุล': censorLname,
                    'เลขบัตรประชาชน': censorCid,
                    'รหัสวัคซีน': r.vaccinetype || '',
                    'วันที่รับบริการ': r.date_serv || ''
                }
            })

            conn.release()
            return NextResponse.json({ success: true, data: censoredRows })
        } else if (type === 'visit') {
            const sql = `
        SELECT 
          s.hospcode,
          s.pid,
          p.name, 
          p.lname, 
          p.cid, 
          s.chiefcomp, 
          s.date_serv
        FROM service s
        LEFT JOIN person p ON s.hospcode = p.hospcode AND s.pid = p.pid
        WHERE s.hospcode = ? AND SUBSTRING(s.date_serv, 1, 6) = ?
        ORDER BY s.date_serv
      `
            const [rows] = await conn.execute(sql, [hospcode, yyyymm]) as any[]

            // Censor data
            const censoredRows = rows.map((r: any) => {
                let censorName = r.name || ''
                let censorLname = r.lname ? (r.lname.substring(0, 1) + '***') : ''

                let censorCid = r.cid || ''
                if (censorCid && censorCid.length === 13) {
                    censorCid = `${censorCid[0]}-XXXX-XXXXX-${censorCid[11]}-${censorCid[12]}`
                } else if (censorCid) {
                    censorCid = 'X'.repeat(censorCid.length)
                }

                return {
                    'HOSPCODE': r.hospcode || '',
                    'PID': r.pid || '',
                    'ชื่อ': censorName,
                    'นามสกุล': censorLname,
                    'เลขบัตรประชาชน': censorCid,
                    'อาการสำคัญ': r.chiefcomp || '',
                    'วันที่รับบริการ': r.date_serv || ''
                }
            })

            conn.release()
            return NextResponse.json({ success: true, data: censoredRows })
        }

        conn.release()
        return NextResponse.json({ success: false, error: 'Unsupported type' }, { status: 400 })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
    }
}
