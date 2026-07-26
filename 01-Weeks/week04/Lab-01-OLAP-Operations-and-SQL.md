# Lab 1 — OLAP Operations and SQL

## เป้าหมาย

แปลงคำถามธุรกิจเป็นลำดับ OLAP operations และ SQL ที่ให้ผลลัพธ์ตรวจสอบได้

## เวลา

50 นาที ใช้ Retail Star Schema จาก Week 03

## งาน

ตอบคำถาม 8 ข้อ:

1. ยอดขายรายเดือนของปีล่าสุด
2. ยอดขายรายไตรมาสและยอดรวมทั้งปี
3. ไตรมาสที่ต่ำที่สุดลดลงเพราะเดือนใด
4. ดูเฉพาะภาคอีสานและหมวดเครื่องดื่ม
5. เปรียบเทียบช่องทาง Store/Mobile/Marketplace รายจังหวัด
6. เทียบยอดขายกับยอดคืนสินค้าตาม category
7. เปิด receipt lines ที่ทำให้ยอดคืนสินค้าสูงสุด
8. สร้าง subtotal เฉพาะ `(region,category)`, `(region,channel)`, `(category)` และ grand total

## สำหรับแต่ละข้อให้ส่ง

| Business question | Operation sequence | SQL | Grain of result | Validation |
|---|---|---|---|---|
|  |  |  |  |  |

## SQL ที่ควรใช้

- `GROUP BY`
- `ROLLUP`
- `CUBE`
- `GROUPING SETS`
- `GROUPING_ID`
- `PIVOT` หรือ conditional aggregation
- window function อย่างน้อยหนึ่งข้อ

## Validation

- รวม subtotal กลับมาเท่ากับ grand total
- ตรวจไม่ให้ subtotal rows ปะปนกับ NULL จริง
- เปรียบเทียบ sample cell กับ query ที่ filter โดยตรง
- บันทึก filter context ทุกคำตอบ

## Rubric (20 คะแนน)

| เกณฑ์ | คะแนน |
|---|---:|
| Mapping คำถามกับ operation | 5 |
| SQL ถูกต้อง | 6 |
| Result grain และ context | 3 |
| Validation | 4 |
| การอธิบาย | 2 |

