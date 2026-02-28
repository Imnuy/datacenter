import pool from '@/lib/db'
import type { RowDataPacket } from 'mysql2/promise'
import ReimbursementClient from './ReimbursementClient'

/* ── helper: parse MySQL DECIMAL strings ── */
const num = (v: unknown): number => {
    if (typeof v === 'number') return v
    if (typeof v === 'string') { const n = Number(v); return Number.isNaN(n) ? 0 : n }
    return 0
}

/* ── data fetcher ── */
async function getPageData() {
    const conn = await pool.getConnection()
    try {
        /* distinct fiscal years */
        const [fyRows] = await conn.query<(RowDataPacket & { fiscal_year: string })[]>(
            `SELECT DISTINCT fiscal_year FROM reimbursement ORDER BY fiscal_year DESC`
        )
        const fiscalYears = fyRows.map(r => r.fiscal_year)

        /* distinct hospitals */
        const [hosRows] = await conn.query<(RowDataPacket & { hoscode: string; hosname: string | null })[]>(
            `SELECT DISTINCT r.hoscode, h.hosname
             FROM reimbursement r LEFT JOIN c_hos h ON r.hoscode = h.hospcode
             ORDER BY r.hoscode`
        )
        const hospitals = hosRows.map(r => ({ hoscode: r.hoscode, hosname: r.hosname ?? r.hoscode }))

        /* distinct funds */
        const [fundRows] = await conn.query<(RowDataPacket & { fund_descr: string })[]>(
            `SELECT DISTINCT fund_descr FROM reimbursement WHERE fund_descr <> '' ORDER BY fund_descr`
        )
        const funds = fundRows.map(r => r.fund_descr)

        /* Section 1 — overview by fund_descr per fiscal year */
        const [fundByYearRows] = await conn.query<(RowDataPacket & { fiscal_year: string; fund_descr: string; total: string })[]>(
            `SELECT fiscal_year, fund_descr, COALESCE(SUM(total_amount),0) AS total
             FROM reimbursement GROUP BY fiscal_year, fund_descr ORDER BY fiscal_year DESC, total DESC`
        )
        const fundByYear = fundByYearRows.map(r => ({ fiscal_year: r.fiscal_year, fund_descr: r.fund_descr, total: num(r.total) }))

        /* Section 1 — overview by hoscode per fiscal year */
        const [hosByYearRows] = await conn.query<(RowDataPacket & { fiscal_year: string; hoscode: string; hosname: string | null; total: string })[]>(
            `SELECT r.fiscal_year, r.hoscode, h.hosname, COALESCE(SUM(r.total_amount),0) AS total
             FROM reimbursement r LEFT JOIN c_hos h ON r.hoscode = h.hospcode
             GROUP BY r.fiscal_year, r.hoscode, h.hosname ORDER BY r.fiscal_year DESC, total DESC`
        )
        const hosByYear = hosByYearRows.map(r => ({ fiscal_year: r.fiscal_year, hoscode: r.hoscode, hosname: r.hosname ?? r.hoscode, total: num(r.total) }))

        /* Section 2 — pivot: hoscode × fiscal_year totals */
        const [pivotRows] = await conn.query<(RowDataPacket & { hoscode: string; hosname: string | null; fiscal_year: string; total: string })[]>(
            `SELECT r.hoscode, h.hosname, r.fiscal_year, COALESCE(SUM(r.total_amount),0) AS total
             FROM reimbursement r LEFT JOIN c_hos h ON r.hoscode = h.hospcode
             GROUP BY r.hoscode, h.hosname, r.fiscal_year ORDER BY r.hoscode, r.fiscal_year`
        )
        /* build pivot map */
        const pivotMap = new Map<string, { hoscode: string; hosname: string; [fy: string]: number | string }>()
        for (const r of pivotRows) {
            if (!pivotMap.has(r.hoscode)) {
                pivotMap.set(r.hoscode, { hoscode: r.hoscode, hosname: r.hosname ?? r.hoscode })
            }
            pivotMap.get(r.hoscode)![`fy${r.fiscal_year}`] = num(r.total)
        }
        const pivotData = Array.from(pivotMap.values())

        /* Section 3 — all detail rows */
        const [detailRows] = await conn.query<(RowDataPacket & {
            hoscode: string; hosname: string | null; fiscal_year: string;
            transfer_date: string; fund_descr: string; efund_desc: string; total_amount: string
        })[]>(
            `SELECT r.hoscode, h.hosname, r.fiscal_year, r.transfer_date, r.fund_descr, r.efund_desc, r.total_amount
             FROM reimbursement r LEFT JOIN c_hos h ON r.hoscode = h.hospcode
             ORDER BY r.transfer_date DESC, r.hoscode`
        )
        const details = detailRows.map(r => ({
            hoscode: r.hoscode,
            hosname: r.hosname ?? r.hoscode,
            fiscal_year: r.fiscal_year,
            transfer_date: typeof r.transfer_date === 'object' ? (r.transfer_date as Date).toISOString().slice(0, 10) : String(r.transfer_date),
            fund_descr: r.fund_descr,
            efund_desc: r.efund_desc,
            total_amount: num(r.total_amount),
        }))

        return { fiscalYears, hospitals, funds, fundByYear, hosByYear, pivotData, details }
    } finally {
        conn.release()
    }
}

export default async function ReimbursementPage() {
    const data = await getPageData()
    return <ReimbursementClient data={data} />
}
