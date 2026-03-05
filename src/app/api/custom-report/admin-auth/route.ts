import { NextResponse } from 'next/server'

type Body = {
    pass?: string
}

const ADMIN_PASS = process.env.CUSTOM_REPORT_ADMIN_PASS ?? 'admin112233'

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null) as Body | null
        const pass = String(body?.pass ?? '')

        if (!pass || pass !== ADMIN_PASS) {
            return NextResponse.json({ success: false, error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
    }
}
