import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const VALID_TYPES = ['f43', 'f16'] as const

type UploadType = typeof VALID_TYPES[number]

const sanitizeFileName = (name: string) =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '_')
        .replace(/_+/g, '_')

type UploadResult = {
    filename: string
    folder: string
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const type = formData.get('type') as UploadType | null
        const file = formData.get('file')

        if (!type || !VALID_TYPES.includes(type)) {
            return NextResponse.json({ success: false, error: 'ประเภทแฟ้มไม่ถูกต้อง' }, { status: 400 })
        }

        if (!(file instanceof File)) {
            return NextResponse.json({ success: false, error: 'ไม่พบไฟล์ที่อัปโหลด' }, { status: 400 })
        }

        if (!file.name.toLowerCase().endsWith('.zip')) {
            return NextResponse.json({ success: false, error: 'รองรับเฉพาะไฟล์ .zip เท่านั้น' }, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const folderPath = path.join(process.cwd(), 'upload', type)
        await fs.mkdir(folderPath, { recursive: true })

        const safeName = sanitizeFileName(file.name)
        const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
        const filename = `${timestamp}-${safeName}`
        const destination = path.join(folderPath, filename)

        await fs.writeFile(destination, buffer)

        const result: UploadResult = {
            filename,
            folder: `upload/${type}`,
        }

        return NextResponse.json({ success: true, data: result })
    } catch (error) {
        console.error('[UPLOAD]', error)
        return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดระหว่างบันทึกไฟล์' }, { status: 500 })
    }
}
