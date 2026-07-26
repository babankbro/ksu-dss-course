# Lab 2 — Root Cause and Aggregation Traps

## สถานการณ์

Dashboard แจ้งว่า Conversion Rate รวมเพิ่มจาก 18% เป็น 20% แต่ Conversion Rate ของทั้ง Mobile และ Desktop ลดลง

## เป้าหมาย

ใช้ OLAP ตรวจ root cause และพิสูจน์ว่าแนวโน้มรวมอาจกลับทิศจากแนวโน้มย่อย

## เวลา

50 นาที กลุ่มละ 4–5 คน

## งาน

### 1. สร้างข้อมูลทดสอบ

สร้างข้อมูลสองช่วงเวลา แยก Mobile/Desktop โดยกำหนด sessions และ conversions ให้:

- conversion rate ของแต่ละ device ลดลง
- conversion rate รวมเพิ่มขึ้นเนื่องจากสัดส่วน traffic เปลี่ยน

### 2. วิเคราะห์เส้นทาง

1. Roll-up ดู rate รวม
2. Drill-down ตาม device
3. Slice แต่ละ period
4. Pivot period × device
5. คำนวณ weighted rate จาก `SUM(conversions)/SUM(sessions)`

### 3. เปรียบเทียบสูตร

พิสูจน์ความต่างระหว่าง:

```sql
AVG(conversion_rate)
```

กับ:

```sql
SUM(conversions) / SUM(sessions)
```

### 4. สร้าง Decision Trail

บันทึก starting claim, operations, filters, SQL, evidence และข้อสรุปที่แก้ไขแล้ว

### 5. Guardrail Design

เสนออย่างน้อย 4 guardrails:

- เตือน average-of-averages
- แสดง denominator
- แสดง subgroup comparison
- บันทึก filter context
- ตรวจ Simpson’s paradox
- บังคับ metric จาก semantic layer

## สิ่งส่งมอบ

1. Dataset และ SQL
2. Pivot table
3. Decision trail
4. คำอธิบาย paradox
5. Guardrails 4 ข้อ

## Rubric (20 คะแนน)

| เกณฑ์ | คะแนน |
|---|---:|
| Dataset แสดง paradox ได้จริง | 5 |
| OLAP operations และ SQL | 5 |
| weighted calculation | 4 |
| Decision trail | 3 |
| Guardrails | 3 |

