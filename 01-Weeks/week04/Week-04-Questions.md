# คำถามทบทวน Week 04 — OLAP

## คำถาม

1. Measure, Dimension, Hierarchy, Level, Member และ Cell ต่างกันอย่างไร?
2. Roll-up กับ Drill-down เปลี่ยนระดับรายละเอียดอย่างไร?
3. Slice กับ Dice แตกต่างกันอย่างไร? ยกตัวอย่างจากยอดขาย
4. Drill-down, Drill-through และ Drill-across ต่างกันอย่างไร?
5. `ROLLUP(year, quarter, month)` สร้าง grouping sets ใดบ้าง?
6. `CUBE(region, category, channel)` สร้างกี่ grouping sets และเพราะเหตุใด?
7. เมื่อใดควรเลือก `GROUPING SETS` แทน `CUBE`?
8. เปรียบเทียบ MOLAP, ROLAP และ HOLAP ในด้าน latency, scale และ freshness
9. อธิบาย aggregation trap สองชนิดและวิธีตรวจจับ
10. Future OLAP ที่ใช้ AI ต้องแสดงหลักฐานและ guardrails ใดบ้าง?

## แนวคำตอบย่อ

1. Measure คือค่าที่วิเคราะห์; Dimension คือบริบท; Hierarchy คือลำดับ; Level คือชั้น; Member คือค่าในชั้น; Cell คือ measure ณ จุดตัดของสมาชิก
2. Roll-up รวมจากละเอียดไปสรุป ส่วน Drill-down เคลื่อนจากสรุปไปละเอียดตาม hierarchy
3. Slice fix หนึ่งมิติ เช่น year=2026; Dice จำกัดหลายมิติ/สมาชิก เช่น year=2026, region=NE, category in A/B
4. Drill-down เปลี่ยน level; Drill-through ไป detail rows/page; Drill-across เทียบ measure จากหลาย fact ผ่าน conformed dimensions
5. `(year,quarter,month)`, `(year,quarter)`, `(year)`, `()`
6. 8 ชุด เพราะ `2^3`
7. เมื่อทราบเฉพาะ combination ที่ต้องใช้ ต้องการลด computation และลด subtotal ที่ไม่เกี่ยวข้อง
8. MOLAP เร็วแต่ refresh/storage สูง; ROLAP scale/freshness ดีแต่พึ่ง query optimization; HOLAP ผสมข้อดีและเพิ่มความซับซ้อน
9. เช่น balance บวกข้ามเวลาไม่ได้; average-of-averages ต้องถ่วงน้ำหนัก; subtotal NULL ต้องแยกด้วย `GROUPING_ID`
10. metric definition, filter context, SQL/query, hierarchy path, lineage, permission, uncertainty, evidence rows และ human verification

## Rubric ข้อ 10 (10 คะแนน)

| เกณฑ์ | คะแนน |
|---|---:|
| มี semantic/metric definition | 2 |
| แสดง query และ filter context | 2 |
| มี lineage และ evidence | 2 |
| มี access control และ privacy | 2 |
| มี human verification และข้อจำกัด | 2 |

