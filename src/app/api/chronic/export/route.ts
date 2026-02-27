import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const hospcode = searchParams.get('hospcode')
    const pass = searchParams.get('pass')
    const type = searchParams.get('type') || 'dm-ht'
    const filter = searchParams.get('filter') || 'all'

    if (!hospcode || !pass) {
        return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    // Validate password
    if (pass !== `${hospcode}112233`) {
        return NextResponse.json({ success: false, error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

    try {
        const conn = await pool.getConnection()

        if (type === 'dm-ht') {
            const sql = `
        SELECT 
          p.hospcode,
          p.pid,
          p.name,
          p.lname,
          p.cid,
          p.sex,
          c.dm,
          c.ht,
          c.dm_code,
          c.ht_code,
          c.dm_date,
          c.ht_date
        FROM (
          SELECT 
            ch.hospcode,
            ch.pid,
            MAX(CASE WHEN (ch.chronic BETWEEN 'E10' AND 'E149') OR (ch.chronic LIKE 'E10%') OR (ch.chronic LIKE 'E11%') OR (ch.chronic LIKE 'E12%') OR (ch.chronic LIKE 'E13%') OR (ch.chronic LIKE 'E14%') THEN 1 ELSE 0 END) as dm,
            MAX(CASE WHEN (ch.chronic BETWEEN 'I10' AND 'I159') OR (ch.chronic LIKE 'I10%') OR (ch.chronic LIKE 'I11%') OR (ch.chronic LIKE 'I12%') OR (ch.chronic LIKE 'I13%') OR (ch.chronic LIKE 'I14%') OR (ch.chronic LIKE 'I15%') THEN 1 ELSE 0 END) as ht,
            MAX(CASE WHEN (ch.chronic BETWEEN 'E10' AND 'E149') OR (ch.chronic LIKE 'E10%') OR (ch.chronic LIKE 'E11%') OR (ch.chronic LIKE 'E12%') OR (ch.chronic LIKE 'E13%') OR (ch.chronic LIKE 'E14%') THEN ch.chronic ELSE NULL END) as dm_code,
            MAX(CASE WHEN (ch.chronic BETWEEN 'I10' AND 'I159') OR (ch.chronic LIKE 'I10%') OR (ch.chronic LIKE 'I11%') OR (ch.chronic LIKE 'I12%') OR (ch.chronic LIKE 'I13%') OR (ch.chronic LIKE 'I14%') OR (ch.chronic LIKE 'I15%') THEN ch.chronic ELSE NULL END) as ht_code,
            MIN(CASE WHEN (ch.chronic BETWEEN 'E10' AND 'E149') OR (ch.chronic LIKE 'E10%') OR (ch.chronic LIKE 'E11%') OR (ch.chronic LIKE 'E12%') OR (ch.chronic LIKE 'E13%') OR (ch.chronic LIKE 'E14%') THEN ch.date_diag ELSE NULL END) as dm_date,
            MIN(CASE WHEN (ch.chronic BETWEEN 'I10' AND 'I159') OR (ch.chronic LIKE 'I10%') OR (ch.chronic LIKE 'I11%') OR (ch.chronic LIKE 'I12%') OR (ch.chronic LIKE 'I13%') OR (ch.chronic LIKE 'I14%') OR (ch.chronic LIKE 'I15%') THEN ch.date_diag ELSE NULL END) as ht_date
          FROM chronic ch
          WHERE ch.hospcode = ?
          GROUP BY ch.hospcode, ch.pid
          HAVING dm = 1 OR ht = 1
        ) c
        INNER JOIN person p ON c.hospcode = p.hospcode AND c.pid = p.pid
        WHERE p.typearea IN ('1', '3')
          AND (p.discharge = '9' OR p.discharge IS NULL OR p.discharge = '')
      `

            const [rows] = await conn.execute(sql, [hospcode]) as any[]

            // Filter by condition if needed
            let filteredRows = rows
            if (filter === 'dm_only') {
                filteredRows = rows.filter((r: any) => r.dm === 1 && r.ht === 0)
            } else if (filter === 'ht_only') {
                filteredRows = rows.filter((r: any) => r.dm === 0 && r.ht === 1)
            } else if (filter === 'both') {
                filteredRows = rows.filter((r: any) => r.dm === 1 && r.ht === 1)
            }

            const formatThaiShortDate = (dateStr: string) => {
                if (!dateStr || String(dateStr).trim() === '') return '-';
                const cleanDate = String(dateStr).replace(/-/g, '').replace(/\//g, '');
                if (cleanDate.length !== 8) return dateStr;

                let year = parseInt(cleanDate.substring(0, 4), 10);
                const month = parseInt(cleanDate.substring(4, 6), 10);
                const day = parseInt(cleanDate.substring(6, 8), 10);

                if (year < 2400) year += 543;

                const thaiYear = year.toString(); // แบบ 4 หลัก
                const padDay = day.toString().padStart(2, '0'); // เลขวันที่ 2 หลัก

                const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

                if (month < 1 || month > 12) return dateStr;

                return `${padDay} ${months[month - 1]} ${thaiYear}`;
            }

            // Censor data
            const censoredRows = filteredRows.map((r: any) => {
                let censorName = r.name || ''
                let censorLname = r.lname ? (r.lname.substring(0, 1) + '***') : ''

                let censorCid = r.cid || ''
                if (censorCid && censorCid.length === 13) {
                    censorCid = `${censorCid[0]}-XXXX-XXXXX-${censorCid[11]}-${censorCid[12]}`
                } else if (censorCid) {
                    censorCid = 'X'.repeat(censorCid.length)
                }

                let diseaseStatus = ''
                let diseaseCode = ''
                let diagDate = ''

                if (r.dm === 1 && r.ht === 1) {
                    diseaseStatus = 'เบาหวานและความดัน'
                    diseaseCode = `${r.dm_code || ''}, ${r.ht_code || ''}`
                    diagDate = `${formatThaiShortDate(r.dm_date)}, ${formatThaiShortDate(r.ht_date)}`
                } else if (r.dm === 1) {
                    diseaseStatus = 'เบาหวานอย่างเดียว'
                    diseaseCode = r.dm_code || ''
                    diagDate = formatThaiShortDate(r.dm_date)
                } else if (r.ht === 1) {
                    diseaseStatus = 'ความดันอย่างเดียว'
                    diseaseCode = r.ht_code || ''
                    diagDate = formatThaiShortDate(r.ht_date)
                }

                const sexText = r.sex === '1' ? 'ชาย' : r.sex === '2' ? 'หญิง' : 'ไม่ระบุ'

                return {
                    'HOSPCODE': r.hospcode || '',
                    'PID': r.pid || '',
                    'ชื่อ': censorName,
                    'นามสกุล': censorLname,
                    'เลขบัตรประชาชน': censorCid,
                    'เพศ': sexText,
                    'โรคระดับบุคคล': diseaseStatus,
                    'รหัสโรค': diseaseCode,
                    'วันขึ้นทะเบียน': diagDate
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
