# 43 แฟ้ม Datacenter Dashboard

ระบบรายงานข้อมูลสุขภาพสำหรับอำเภอวัดโบสถ์ พัฒนาด้วย Next.js (App Router) + TypeScript รันบน Bun และเชื่อมต่อฐานข้อมูล MariaDB 43 แฟ้ม

## Tech Stack

- Next.js 14 (App Router) + React 18
- TypeScript, Tailwind-in-JSX (inline styles + design tokens)
- Bun (package manager/runtime)
- MariaDB 10.6 (Docker) + mysql2/promise
- SweetAlert2, Lucide Icons สำหรับ UI interaction

## Core Features

1. **Dashboard Modules** – หน้ารวมข้อมูล OPD, NCD, MCWH, Map ฯลฯ
2. **Custom Reports** – ผู้ใช้สร้าง SQL-based report ได้ พร้อม pass key สำหรับการ run รายงาน
3. **Admin Guarded Actions** – การเพิ่ม/แก้ไข/ลบ custom report ต้องยืนยันรหัส `CUSTOM_REPORT_ADMIN_PASS`
4. **Dockerized Database** – มี container `mariadb` สำหรับ dev/test พร้อม charset utf8mb4 เพื่อรองรับภาษาไทย

## Getting Started

### 1. ติดตั้ง Dependency

```bash
bun install
```

> โปรเจ็กต์ถูกออกแบบให้ใช้ Bun เป็นหลัก (นายสั่ง `bun dev`, `bun lint` ฯลฯ ได้) แต่ npm/yarn ก็ใช้ได้หากจำเป็น

### 2. ตั้งค่า Environment

คัดลอก `.env.example` → `.env` แล้วใส่ค่าจริง

| Variable | Description |
| --- | --- |
| `DB_HOST` / `DB_PORT` | host/port ของ MariaDB (ค่า dev เริ่มต้นคือคอนเทนเนอร์ `mariadb` บน 3306) |
| `DB_USER` / `DB_PASS` / `DB_NAME` | credential ของฐานข้อมูล 43 แฟ้ม |
| `CUSTOM_REPORT_ADMIN_PASS` | รหัส admin สำหรับ create/edit/delete custom reports |

> ฐานข้อมูล dev ที่ใช้ใน repo นี้ดูรายละเอียดเพิ่มเติมได้ที่ `db.md`

### 3. รันฐานข้อมูลด้วย Docker (dev)

```bash
# ตัวอย่างการ exec เข้า container ปัจจุบัน
docker exec -it mariadb mariadb -u root -p112233 f43db
```

หากยังไม่มี container ให้สร้างจาก image `mariadb:10.6.23-ubi9` แล้ว map port 3306

### 4. รัน Dev Server

```bash
bun dev
# หรือ npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) เพื่อทดสอบ UI (Chrome MCP ถูกใช้ในการ automation อยู่แล้ว)

## Useful Scripts

| Command | Description |
| --- | --- |
| `bun dev` | รัน Next.js dev server |
| `bun build` | สร้าง production build |
| `bun lint` | รัน ESLint/TypeScript check |

## Working with Custom Reports

- UI: `/custom-report`
- Admin actions (edit/delete/create) จะ trigger modal ขอ admin pass
- API ที่เกี่ยวข้องอยู่ใน `src/app/api/custom-report/*`
- การตรวจสอบ pass key สำหรับการ run รายงานทำผ่าน API `/api/custom-report/run`

## Documentation

- `docs/pr-workflow-guide.md` – คู่มือสำหรับ Cascade/ผู้ร่วมพัฒนาในการสร้าง PR ให้ถูกขั้นตอน
- `docs/reimbursement_schema.md` – โครงสร้างตาราง reimbursement และ unique key logic

## Contribution Workflow

1. สร้าง branch จาก `tehn/custom` หรือ mainline ที่กำหนด
2. ทำงาน → `git status -sb` → `git add -A` → `git commit -m "feat: ..."`
3. `git push origin <branch>` แล้วเปิด PR ผ่านลิงก์ `https://github.com/Imnuy/datacenter/pull/new/<branch>`
4. ระบุ summary + testing blocks ตามที่อธิบายใน `docs/pr-workflow-guide.md`

## Troubleshooting

- **ภาษาไทยกลายเป็น ???**: ตรวจสอบ charset ของ connection ให้เป็น `utf8mb4`. เวลา exec DB ให้สั่ง `SET NAMES utf8mb4;`
- **Admin pass ผิด**: ตรวจ env `CUSTOM_REPORT_ADMIN_PASS` ทั้งฝั่ง frontend (prompt) และ API
- **Dropdown custom report ถูกกรอบตัด**: ตรวจว่ามีการตั้ง `overflow: visible` ให้ container ตามที่แก้ใน `src/app/custom-report/page.tsx`

---

หากต้องการรายละเอียดเพิ่มเติม/คู่มืออื่น ๆ แจ้งผ่าน issues หรืออัปเดตในโฟลเดอร์ `docs/` ได้เลย
