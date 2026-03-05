# Workflow: สร้าง Pull Request สำหรับ Cascade

## 1. ตรวจสอบสถานะ repo
```powershell
# แสดง branch ปัจจุบันและไฟล์ที่เปลี่ยน
git status -sb
```
- ถ้ามีไฟล์ที่ไม่ต้องการใน PR ให้จัดการก่อน (ลบ/checkout)
- ยืนยันว่าอยู่บน branch งาน เช่น `tehn/custom`

## 2. จัดกลุ่มไฟล์ที่ต้อง commit
```powershell
git add -A
# หรือเลือกเฉพาะไฟล์
# git add path/to/file.tsx
```
- ฝั่ง Windows ให้ระวัง CRLF warning เฉย ๆ (ไม่ต้องตกใจ)

## 3. สร้าง commit พร้อมข้อความสั้นและชัด
```powershell
git commit -m "feat: short summary"
```
- ถ้าไม่มีไฟล์ staged จะ fail ให้กลับไป stage ใหม่
- ใช้ prefix ตามประเภทงาน (feat, fix, chore, docs, refactor, etc.)

## 4. ตรวจสอบก่อน push
```powershell
git status -sb
```
- ควรเห็นว่า clean (`## branch` อย่างเดียว)
- ถ้ายังมีไฟล์ค้างให้ commit เพิ่มหรือ checkout

## 5. Push ขึ้น remote branch
```powershell
git push origin <branch-name>
```
- ถ้าเป็น branch ใหม่ remote จะสร้างให้ทันที
- ถ้ามี error (เช่น rejected) ต้อง pull/rebase ตามขั้นตอนปกติ

## 6. เตรียมข้อมูลสำหรับ PR
รวบรวมข้อมูลเหล่านี้ไว้ในคำตอบหรือ description:
- 📌 Summary หลัก: ฟีเจอร์/บั๊กที่แก้, API/UI ที่กระทบ
- 🧪 Testing: รายการคำสั่ง/ขั้นตอนที่รันจริง (เช่น Chrome MCP flow, docker exec, unit test)
- 🔐 Config/Env: ถ้ามี env ใหม่หรือต้องตั้งค่าอะไรเพิ่มให้ระบุ

## 7. เปิดลิงก์สร้าง PR
หลัง push เสร็จ Git จะพิมพ์ลิงก์ให้กด เช่น:
```
https://github.com/<org>/<repo>/pull/new/<branch>
```
ถ้าไม่ขึ้น ใช้รูปแบบ: `https://github.com/Imnuy/datacenter/pull/new/<branch>`

## 8. กรอกฟอร์ม PR
- Title: ตรงกับ commit หลักหรือสรุปสั้น ๆ
- Description: วาง summary + testing steps ตามข้อ 6
- Assign/Label/Reviewer ตาม workflow ทีม (ถ้ามี)

## 9. ตอบกลับผู้ใช้
- แจ้งว่า push แล้วบน branch ไหน
- ให้ลิงก์สร้าง PR
- แนบสรุปการเปลี่ยนแปลงและผลทดสอบ

> หมายเหตุ: ขั้นตอนนี้เป็นคู่มือสำหรับ Cascade เพื่อทำ PR ผ่าน terminal บน workspace นี้ ถ้ามี repo ใหม่ให้ปรับชื่อ branch/remote ตามจริง
