import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

export async function GET() {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        })

        const [rows] = await conn.execute(`
            SELECT 
                hospcode, 
                hosname, 
                province, 
                latitude, 
                longitude
            FROM c_hos 
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        `)

        await conn.end()
        return NextResponse.json({ success: true, data: rows })
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}
