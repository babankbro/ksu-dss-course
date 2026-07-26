# Lab 2 — Build a Retail Star Schema with DuckDB

## เป้าหมาย

สร้าง Star Schema จากข้อมูลยอดขายดิบ และพิสูจน์ว่าข้อมูลที่โหลดไม่สูญหายหรือเพิ่มซ้ำ

## เวลา

50 นาที ทำงานเป็นคู่หรือกลุ่มเดิม

## เครื่องมือ

- Python + pandas
- DuckDB
- CSV ยอดขายที่อาจารย์กำหนด หรือสร้างข้อมูลทดสอบอย่างน้อย 30 แถว

## แบบจำลองเป้าหมาย

- `dim_date`
- `dim_product`
- `dim_customer`
- `dim_store`
- `fact_sales`
- `etl_rejects`
- `etl_audit`

## ขั้นตอน

### 1. Profile และ Clean

ตรวจ schema, null, duplicate, รูปแบบวันที่, ค่าติดลบ และสูตร net amount แยกข้อมูลไม่ผ่านไป `etl_rejects`

### 2. สร้าง Dimensions

สร้าง surrogate keys และ unknown member (`key = 0`) สำหรับ dimension ที่ยอมให้ข้อมูลไม่ครบ

### 3. สร้าง Fact

Grain:

> หนึ่งแถวแทนสินค้าหนึ่งรายการในหนึ่งใบเสร็จ ณ เวลาชำระเงิน

Fact ต้องมี foreign keys, receipt number, quantity, gross amount, discount amount และ net amount

### 4. SQL ตัวอย่าง

```sql
CREATE TABLE fact_sales AS
SELECT
    d.date_key,
    p.product_key,
    COALESCE(c.customer_key, 0) AS customer_key,
    s.store_key,
    r.receipt_no,
    r.quantity,
    r.quantity * r.unit_price AS gross_amount,
    r.discount_amount,
    r.quantity * r.unit_price - r.discount_amount AS net_amount
FROM retail_clean r
JOIN dim_date d ON d.full_date = r.sale_date
JOIN dim_product p ON p.product_code = r.product_code
LEFT JOIN dim_customer c ON c.customer_code = r.customer_code
JOIN dim_store s ON s.store_code = r.store_code;
```

### 5. Reconciliation

```sql
SELECT COUNT(*) AS rows, SUM(net_amount) AS net_amount
FROM fact_sales;

SELECT
  (SELECT COUNT(*) FROM retail_raw) AS source_rows,
  (SELECT COUNT(*) FROM fact_sales) AS loaded_rows,
  (SELECT COUNT(*) FROM etl_rejects) AS rejected_rows;
```

พิสูจน์:

```text
source_rows = loaded_rows + rejected_rows
```

### 6. Analytical Query

ตอบคำถามอย่างน้อย 3 ข้อ:

1. ยอดขายรายเดือนตาม category
2. สินค้า 5 อันดับตาม net amount
3. ยอดขายและส่วนลดแยกตาม channel

### 7. Idempotency Test

รัน pipeline ซ้ำ แล้วพิสูจน์ว่า fact ไม่เกิด duplicate เพิ่ม

## สิ่งส่งมอบ

1. ER/Star diagram
2. SQL หรือ notebook
3. ผล reconciliation
4. analytical query 3 ข้อ
5. คำอธิบายวิธีทำให้ pipeline idempotent

## Rubric (20 คะแนน)

| เกณฑ์ | คะแนน |
|---|---:|
| Grain และ schema | 5 |
| ETL/quality/reject handling | 5 |
| Keys และ referential integrity | 3 |
| Reconciliation + idempotency | 5 |
| Analytical queries | 2 |

