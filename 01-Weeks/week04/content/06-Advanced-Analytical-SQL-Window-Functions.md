---
title: "บทที่ 6: การวิเคราะห์ขั้นสูงด้วย Window Functions"
---

# 6. การวิเคราะห์ขั้นสูงด้วย Window Functions (Advanced Analytical SQL)

แม้ว่า `GROUP BY`, `ROLLUP`, และ `CUBE` จะทรงพลังในการหาผลรวม (Aggregation) แต่มันก็มีข้อจำกัดอย่างหนึ่งคือ **"มันจะยุบข้อมูลลง (Collapse rows)"** เสมอ 
หากผู้บริหารต้องการเปรียบเทียบข้อมูล เช่น **"ดูยอดขายเดือนนี้ เทียบกับเดือนที่แล้ว (Year-over-Year / Month-over-Month)"** ลำพังแค่ `GROUP BY` จะทำไม่ได้ เราจึงต้องใช้ไม้ตายที่เรียกว่า **Window Functions**

## 6.1 Window Functions คืออะไร?
Window Functions คือฟังก์ชันที่ใช้คำนวณข้อมูลข้ามบรรทัด (Rows) ที่เกี่ยวข้องกัน โดยที่ **ไม่ไปยุบรวมบรรทัดนั้นให้หายไป** (หน้าต่างข้อมูล - Window)

## 6.2 ฟังก์ชันยอดฮิตสำหรับการทำรายงาน OLAP (BI Dashboards)

**1. ยอดเทียบเดือนก่อนหน้า (LAG / LEAD):**
* ใช้สำหรับเปรียบเทียบอัตราการเติบโต
```sql
SELECT
  month,
  SUM(net_sales) AS current_sales,
  LAG(SUM(net_sales), 1) OVER (ORDER BY month) AS prev_month_sales
FROM sales
GROUP BY month;
```
*ผลลัพธ์:* ระบบจะดึงยอดขายของเดือนที่แล้ว มาแปะไว้เป็นคอลัมน์คู่กับยอดของเดือนปัจจุบัน เพื่อให้เอาไปลบกันหาเปอร์เซ็นต์ Growth ได้ง่ายๆ บน Dashboard

**2. การจัดอันดับ (RANK / DENSE_RANK):**
* ใช้สำหรับสร้างรายงาน "Top 5 สาขาที่ขายดีที่สุดในแต่ละภาค"
```sql
SELECT
  region, branch_name, sales,
  RANK() OVER (PARTITION BY region ORDER BY sales DESC) as branch_rank
FROM branch_sales;
```
*การทำงาน:* `PARTITION BY` จะทำหน้าที่เหมือนตัวกรอบ (Window) รีเซ็ตตัวนับใหม่ทุกครั้งที่ขึ้นภูมิภาคใหม่ ทำให้เราได้อันดับ 1,2,3 ของภาคเหนือ แล้วพอขึ้นภาคอีสาน ก็จะเริ่มนับ 1,2,3 ใหม่อีกครั้ง

**3. ยอดสะสมตั้งแต่ต้นปี (YTD - Year-To-Date) หรือ Moving Average:**
* ใช้สำหรับดูกระแสเงินสดสะสม หรือ เส้นค่าเฉลี่ยเคลื่อนที่ (Moving Average) 3 เดือน
```sql
SELECT
  date, sales,
  SUM(sales) OVER (
      ORDER BY date 
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS ytd_sales
FROM daily_sales;
```
*การทำงาน:* ระบบจะกวาดสายตาจากอดีต (`UNBOUNDED PRECEDING`) ลงมาบวกสะสมเรื่อยๆ จนถึงแถวปัจจุบัน (`CURRENT ROW`) ทำให้เกิดยอดทบต้นเป็นขั้นบันได

## 6.3 ประโยชน์เชิงสถาปัตยกรรม
การผลักภาระการคำนวณระดับสูงเหล่านี้ไปให้ Data Warehouse จัดการผ่าน Window Functions ช่วยลดภาระการทำงานของคอมพิวเตอร์ผู้ใช้ปลายทาง (BI Tools อย่าง Tableau หรือ Power BI จะไม่ต้องมากินแรมเครื่องผู้ใช้เพื่อบวกเลขเอง) 
นี่คือแก่นของการทำ **Push-down computing** ในสถาปัตยกรรมข้อมูลยุคใหม่
