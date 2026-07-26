# Week 04 — OLAP and Multidimensional Analysis

ชุดสอนฉบับขยายสำหรับบรรยาย 2 ชั่วโมงและปฏิบัติการ 2 ชั่วโมง เน้นการเปลี่ยนคำถามธุรกิจให้เป็นเส้นทางสำรวจหลายมิติและ SQL ที่ตรวจสอบได้

## ผลลัพธ์การเรียนรู้

ผู้เรียนควรสามารถ:

1. อธิบาย cube, measure, dimension, hierarchy, level และ member
2. ใช้ Roll-up, Drill-down, Slice, Dice และ Pivot อย่างถูกต้อง
3. แยก Drill-down, Drill-through และ Drill-across
4. แปลงคำถามเป็น `GROUP BY`, `ROLLUP`, `CUBE` และ `GROUPING SETS`
5. เลือก MOLAP, ROLAP หรือ HOLAP ตาม latency, scale และ freshness
6. ตรวจ aggregation trap เช่น non-additive measure, NULL และ Simpson’s paradox
7. อธิบาย Future OLAP ที่ใช้ columnar engine, semantic layer และ AI-assisted exploration

## ไฟล์ในชุด

- [[Week-04-Expanded-Content|เนื้อหาขยาย]]
- [[Week-04-Questions|คำถาม 10 ข้อพร้อมแนวคำตอบ]]
- [[Lab-01-OLAP-Operations-and-SQL|Lab 1: OLAP Operations และ SQL]]
- [[Lab-02-Root-Cause-and-Aggregation-Traps|Lab 2: Root Cause และ Aggregation Traps]]
- [[References|เอกสารอ้างอิง]]
- `Week-04-OLAP-and-Multidimensional-Analysis.pptx` — สไลด์ 20 หน้า

## ลำดับการสอน

| เวลา | กิจกรรม |
|---|---|
| 0–15 นาที | Hook: ยอดขายตก — ควรเจาะมิติใดก่อน |
| 15–50 นาที | Cube, dimensions, hierarchies และ measures |
| 50–90 นาที | OLAP operations และ decision trail |
| 90–120 นาที | SQL, architecture และ interpretation traps |
| 120–170 นาที | Lab 1 |
| 170–220 นาที | Lab 2 |
| 220–240 นาที | นำเสนอคำตอบและสรุป Future OLAP |

> OLAP ที่ดีไม่ได้ให้เพียงยอดรวม แต่ช่วยรักษาบริบทของทุกขั้นที่ผู้ใช้เดินจากคำถามแรกไปสู่หลักฐานระดับธุรกรรม

