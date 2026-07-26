# Lab 1 — Data Quality and Grain Contract

## เป้าหมาย

ทำความเข้าใจข้อมูลดิบก่อนออกแบบคลังข้อมูล และเปลี่ยนความคาดหวังด้านคุณภาพให้เป็นกฎที่ทดสอบได้

## เวลา

45 นาที กลุ่มละ 4–5 คน

## สถานการณ์

ร้านค้ารวมยอดขายจาก POS, Mobile App และ Marketplace แต่พบปัญหา:

- รหัสสินค้า `P-101`, `P101` และ `101` หมายถึงสินค้าเดียวกัน
- วันที่ใช้ทั้ง `2026-07-01` และ `01/07/2026`
- บางรายการไม่มี customer
- receipt line ซ้ำหลัง pipeline retry
- จำนวน × ราคา − ส่วนลดไม่เท่ากับ net amount
- รายการคืนสินค้าบางระบบใช้ quantity ติดลบ บางระบบใช้ transaction type

## งาน

### 1. เขียน Grain Contract

เติมข้อความ:

> หนึ่งแถวใน fact table แทน ______ ของ ______ ณ ______

ระบุ business key และเหตุการณ์ที่ไม่ควรอยู่ใน grain เดียวกัน

### 2. สร้าง Data-Quality Rules

สร้างอย่างน้อย 8 กฎ ครอบคลุม:

- completeness
- uniqueness
- validity
- consistency
- timeliness
- referential integrity

แต่ละกฎต้องมี threshold, owner และ action: accept, warn, quarantine หรือ stop

### 3. Source-to-Target Mapping

| Source field | Target field | Transformation | Reject condition |
|---|---|---|---|
|  |  |  |  |

### 4. Reconciliation Plan

กำหนด control totals อย่างน้อย 4 ค่า และสมการที่ต้องเป็นจริงหลังโหลด

### 5. Failure Review

เลือกหนึ่งปัญหาและอธิบาย failure chain ตั้งแต่ข้อมูลดิบ → fact → KPI → การตัดสินใจ

## สิ่งส่งมอบ

1. Grain Contract
2. Data-quality rules 8 ข้อ
3. Source-to-target mapping
4. Reconciliation plan
5. Failure chain

## Rubric (20 คะแนน)

| เกณฑ์ | คะแนน |
|---|---:|
| Grain และ business key | 4 |
| กฎคุณภาพทดสอบได้ | 6 |
| Mapping และมาตรฐานข้อมูล | 4 |
| Reconciliation | 4 |
| การสื่อสาร | 2 |

