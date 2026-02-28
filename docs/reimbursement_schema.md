# พจนานุกรมข้อมูล (Data Dictionary) - ตาราง reimbursement

ตาราง `reimbursement` ในฐานข้อมูล `f43db` ใช้สำหรับจัดเก็บและจัดการข้อมูลการโอนเงินงบกองทุนจากระบบ Smart Money Transfer ของ สปสช. (NHSO)

## โครงสร้างตาราง (Table Schema)

| ชื่อฟิลด์ (Field Name) | ข้อมูลที่เก็บ (Data Source)       | ประเภทข้อมูล (Data Type) | รายละเอียด (Description)                                                                        |
| :--------------------- | :-------------------------------- | :----------------------- | :---------------------------------------------------------------------------------------------- |
| `id`                   | -                                 | `INT`                    | รหัสอ้างอิงลำดับรายการ (Primary Key, Auto Increment)                                            |
| `hoscode`              | รหัสหน่วยบริการ (`vndrNo`)        | `VARCHAR(5)`             | รหัสหน่วยบริการ 5 หลัก (มีการตัดเลข 0 ด้านหน้าออกเพื่อให้เหลือ 5 หลัก) **(Part of Unique Key)** |
| `fiscal_year`          | ปีงบประมาณ                        | `VARCHAR(4)`             | ปีงบประมาณ พ.ศ. ของข้อมูลการโอนเงิน                                                             |
| `transfer_date`        | วันที่โอน (`runDt`)               | `DATE`                   | วันที่เกิดการโอนเงินเข้าบัญชีหน่วยบริการ **(Part of Unique Key)**                               |
| `batch_no`             | Batch No. (`batchNo`)             | `VARCHAR(50)`            | รหัสชุดข้อมูลการโอนเงิน **(Part of Unique Key)**                                                |
| `ref_doc_no`           | งวด/เลขที่เบิกจ่าย (`refDocNo`)   | `VARCHAR(100)`           | เลขที่เอกสารอ้างอิงการเบิกจ่ายจากระบบ สปสช. **(Part of Unique Key)**                            |
| `fund_group_descr`     | กองทุนย่อย (`fundGroupDescr`)     | `VARCHAR(255)`           | ชื่อกลุ่มกองทุนหลัก                                                                             |
| `fund_descr`           | กองทุน (`fundDescr`)              | `VARCHAR(255)`           | ชื่อกองทุน/ประเภทบริการ **(Part of Unique Key)**                                                |
| `efund_desc`           | กองทุนย่อยเฉพาะด้าน (`efundDesc`) | `VARCHAR(255)`           | ชื่อกองทุนระดับย่อยสุด (เช่น บริการควบคุมป้องกันและรักษา... ฯลฯ) **(Part of Unique Key)**       |
| `amount`               | จำนวนเงิน (`amount`)              | `DECIMAL(15, 2)`         | จำนวนเงินรวมทั้งหมดตามสิทธิ                                                                     |
| `wait_amount`          | ชะลอการโอน (`wait`)               | `DECIMAL(15, 2)`         | ยอดเงินชะลอการจ่าย                                                                              |
| `bond_amount`          | หลักประกันสัญญา (`bond`)          | `DECIMAL(15, 2)`         | ยอดเงินหักเป็นหลักประกันสัญญา                                                                   |
| `vat_amount`           | ภาษี (`vat`)                      | `DECIMAL(15, 2)`         | ยอดหักภาษี                                                                                      |
| `deduct_amount`        | รายการหักจากยอดโอน (`odbt`)       | `DECIMAL(15, 2)`         | รายการหักอื่นๆ อัตโนมัติจากยอดโอน                                                               |
| `total_amount`         | เงินโอนเข้าบัญชี (`total`)        | `DECIMAL(15, 2)`         | ยอดเงินสุทธิที่ได้รับการโอนเข้าบัญชีธนาคาร (amount ลบรายการหักต่างๆ)                            |
| `bank_name`            | ธนาคาร (`bankNm`)                 | `VARCHAR(255)`           | ชื่อธนาคารที่รับโอน                                                                             |
| `budget_source`        | สิทธิ์ (`budgetSource`)           | `VARCHAR(255)`           | แหล่งที่มาของงบประมาณ / สิทธิ์                                                                  |
| `moph_id`              | รหัส MOPH (`mophId`)              | `VARCHAR(50)`            | รหัสอ้างอิงบัญชีมาตรฐานของกระทรวงสาธารณสุข                                                      |
| `moph_desc`            | คำอธิบาย MOPH (`mophDesc`)        | `VARCHAR(255)`           | คำอธิบายรายการบัญชีของกระทรวงสาธารณสุข                                                          |
| `payment_status`       | สถานะการจ่าย (`pmntStts`)         | `VARCHAR(100)`           | สถานะของการจ่ายเงิน                                                                             |
| `created_at`           | System Timestamp                  | `TIMESTAMP`              | วันที่และเวลาที่บันทึกข้อมูลเข้าระบบครั้งแรก (Default: CURRENT_TIMESTAMP)                       |
| `updated_at`           | System Timestamp                  | `TIMESTAMP`              | วันที่และเวลาที่มีการแก้ไขข้อมูลล่าสุด (อัปเดตอัตโนมัติเมื่อทำ Upsert)                          |

---

## 📌 กลไกป้องกันความซ้ำซ้อน (Upsert Strategy)

ตารางนี้ใช้กลไกของ MySQL (Insert On Duplicate Key Update) เพื่อควบคุมให้ข้อมูลไม่ซ้ำซ้อนกันเวลาดึงข้อมูลใหม่ หากข้อมูลตรงกับ **Composite Unique Key** ทั้ง 6 ช่อง จะทำการ _อัปเดตยอดเงิน_ แทนการบันทึกบรรทัดใหม่:

**คอลัมน์ที่เป็น Unique Key (6 คอลัมน์):**

1. `hoscode`
2. `transfer_date`
3. `batch_no`
4. `ref_doc_no`
5. `fund_descr`
6. `efund_desc`

> **หมายเหตุ:** คอลัมน์เหล่านี้ไม่ได้รับอนุญาตให้เป็นค่า `NULL` โดยจะถูกแทนที่ด้วย `""` (Empty String) ในกรณีที่ API ส่งค่าว่างมา เพื่อให้ Database สามารถตรวจสอบความซ้ำซ้อนได้อย่างถูกต้อง
