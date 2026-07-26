# Week 03 — Data Management and Data Warehouse

ชุดสอนฉบับขยายสำหรับบรรยาย 2 ชั่วโมงและปฏิบัติการ 2 ชั่วโมง เน้นการเปลี่ยนข้อมูลธุรกรรมให้เป็นข้อมูลเชิงวิเคราะห์ที่เชื่อถือได้

## ผลลัพธ์การเรียนรู้

เมื่อจบบทเรียน ผู้เรียนควรสามารถ:

1. อธิบายเหตุผลที่แยก OLTP ออกจาก analytical workload
2. เขียน grain statement ก่อนออกแบบ fact table
3. จำแนก fact, dimension, measure และ surrogate key
4. ออกแบบ Star Schema และเลือกใช้ Snowflake อย่างมีเหตุผล
5. ออกแบบ ETL/ELT พร้อม data-quality checks และ reconciliation
6. เลือก Data Warehouse, Data Mart, Data Lake หรือ Lakehouse ให้เหมาะกับงาน
7. อธิบาย Future Data Architecture ที่มี lineage, semantic layer, data products และ AI consumption

## ไฟล์ในชุด

- [[Week-03-Expanded-Content|เนื้อหาขยาย]]
- [[Week-03-Questions|คำถาม 10 ข้อพร้อมแนวคำตอบ]]
- [[Lab-01-Data-Quality-and-Grain-Contract|Lab 1: Data Quality และ Grain Contract]]
- [[Lab-02-Build-a-Retail-Star-Schema|Lab 2: สร้าง Retail Star Schema]]
- [[References|เอกสารอ้างอิง]]
- `Week-03-Data-Management-and-Warehouse.pptx` — สไลด์ 20 หน้า

## ลำดับการสอนที่แนะนำ

| เวลา | กิจกรรม |
|---|---|
| 0–15 นาที | โจทย์เปิด: ทำไมยอดขายจากสองรายงานไม่เท่ากัน |
| 15–45 นาที | OLTP, analytical workload และคุณลักษณะคลังข้อมูล |
| 45–80 นาที | ETL/ELT, data quality และ reconciliation |
| 80–120 นาที | Grain, fact/dimension, Star/Snowflake และ SCD |
| 120–165 นาที | Lab 1 |
| 165–215 นาที | Lab 2 |
| 215–240 นาที | นำเสนอแบบจำลองและทบทวน Future Data Architecture |

> หลักสำคัญ: ก่อนสร้างตาราง ให้ตอบให้ได้ว่า “หนึ่งแถวหมายถึงเหตุการณ์อะไร” และ “ยอดใดต้องเท่ากับต้นทาง”

