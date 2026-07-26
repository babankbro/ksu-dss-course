---
title: "บทที่ 5: การเขียน SQL สำหรับ OLAP (Grouping Extensions)"
---

# 5. การเขียน SQL สำหรับ OLAP (Grouping Extensions)

ในอดีต การจะสร้างลูกบาศก์ข้อมูล (Cube) ต้องใช้ซอฟต์แวร์เฉพาะทาง (เช่น MS SQL Server Analysis Services) แต่ปัจจุบัน ภาษา SQL มาตรฐานได้อัปเกรดตัวเองให้รองรับฟังก์ชัน OLAP ได้โดยตรง ทำให้ Data Analyst สามารถเขียนโค้ดคิวรีสไลซ์ข้อมูลได้อย่างรวดเร็ว

## 5.1 พื้นฐาน: GROUP BY
การจัดกลุ่มหาผลรวมทั่วไป:
```sql
SELECT year, region, SUM(net_sales) AS sales
FROM sales
GROUP BY year, region;
```
*ผลลัพธ์:* จะได้เฉพาะยอดขายแยกตาม "ปี" คู่กับ "ภูมิภาค" เท่านั้น แต่จะไม่ได้ "ยอดรวมทั้งหมดของปี (Total Year)" ติดมาด้วย

## 5.2 ฟังก์ชัน ROLLUP (การม้วนขึ้นตามลำดับชั้น)
หากเราต้องการทั้ง รายเดือน, รายไตรมาส, และ รายปี ในคิวรีเดียว:
```sql
SELECT year, quarter, month, SUM(net_sales) AS sales
FROM sales
GROUP BY ROLLUP (year, quarter, month);
```
*การทำงาน:* `ROLLUP` จะสร้างผลรวมตามลำดับ (Hierarchy) จากขวาไปซ้าย โดยอัตโนมัติ:
1. `(year, quarter, month)` - ยอดระดับเดือน
2. `(year, quarter)` - ยอดรวมระดับไตรมาส
3. `(year)` - ยอดรวมระดับปี
4. `()` - ยอดรวมทั้งหมด (Grand Total)

## 5.3 ฟังก์ชัน CUBE (การสร้างจุดตัดทุกมิติ)
หากเราต้องการทุกจุดตัดที่เป็นไปได้ในโลกนี้ (เอาไว้สร้างลูกบาศก์):
```sql
SELECT region, category, channel, SUM(net_sales) AS sales
FROM sales
GROUP BY CUBE (region, category, channel);
```
*การทำงาน:* `CUBE` จะประมวลผลทุก Combination ที่เป็นไปได้ทั้งหมด (เท่ากับ $2^3$ = 8 รูปแบบ) ตั้งแต่:
ยอดรายภูมิภาค, ยอดรายหมวดหมู่, ยอดภูมิภาค+หมวดหมู่, ยอดช่องทางอย่างเดียว, ไปจนถึงยอดรวม Grand Total 
*(คำเตือน: หากใส่คอลัมน์ใน CUBE เยอะเกินไป ฐานข้อมูลอาจค้างตายเพราะ Combinations ทวีคูณเป็นหลายล้านแบบ!)*

## 5.4 ฟังก์ชัน GROUPING SETS (การเลือกเอาเฉพาะมิติที่ต้องการ)
หาก `CUBE` มันใหญ่เกินไป และเราไม่อยากได้ครบทุกแบบ:
```sql
SELECT region, category, channel, SUM(net_sales) AS sales
FROM sales
GROUP BY GROUPING SETS (
  (region, category),   -- ขอยอด ภูมิภาค คู่ หมวดหมู่
  (region, channel),    -- ขอยอด ภูมิภาค คู่ ช่องทาง
  (category),           -- ขอยอด รวมหมวดหมู่อย่างเดียว
  ()                    -- ขอยอด Grand total
);
```
*การทำงาน:* นักวิเคราะห์จะเป็นคนเจาะจงเองเลยว่าต้องการดูระดับไหนบ้าง ช่วยประหยัดเวลา CPU ของฐานข้อมูลได้อย่างมหาศาล

## 5.5 การแยกแยะ NULL ด้วย GROUPING_ID
* **ปัญหา:** เวลา `ROLLUP` มันบวกยอดรวมระดับประเทศ (Grand Total) ช่องของ `region` จะแสดงคำว่า `NULL` (เพื่อสื่อว่าไม่ได้แยกตามภูมิภาคนะ) แต่ถ้าในฐานข้อมูลเรา ดันมีสาขาที่ลืมกรอกภาคอยู่แล้ว (เป็น NULL ของจริง) เราจะแยกออกได้อย่างไร?
* **ทางแก้:** ใช้ `GROUPING_ID()`
```sql
SELECT
  region, category,
  GROUPING_ID(region, category) AS level_id,
  SUM(net_sales) AS sales
FROM sales
GROUP BY CUBE(region, category);
```
ฟังก์ชันนี้จะบอกรหัสตัวเลข ทำให้แยกระหว่าง "ข้อมูลว่างเปล่าจริงๆ" กับ "ช่องว่างที่เกิดจากการรวม Grand Total" ได้อย่างชัดเจน
