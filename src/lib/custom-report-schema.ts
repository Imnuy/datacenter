import pool from '@/lib/db'

let hasPassKeyColumnPromise: Promise<boolean> | null = null

export async function customReportHasPassKeyColumn() {
  if (!hasPassKeyColumnPromise) {
    hasPassKeyColumnPromise = (async () => {
      const conn = await pool.getConnection()
      try {
        const [rows] = await conn.execute(
          `
            SELECT COUNT(*) AS count
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'custom_report'
              AND column_name = 'pass_key'
          `
        )

        const count = Number((rows as Array<{ count?: number | string }>)[0]?.count ?? 0)
        return count > 0
      } finally {
        conn.release()
      }
    })()
  }

  return await hasPassKeyColumnPromise
}
