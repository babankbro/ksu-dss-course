# คำถามทบทวน Week 03 — Data Management and Data Warehouse

## คำถาม

1. เพราะเหตุใดจึงไม่ควรรัน analytical query ขนาดใหญ่บนระบบ OLTP โดยตรง?
2. อธิบายคุณลักษณะ Subject-oriented, Integrated, Time-variant และ Non-volatile พร้อมตัวอย่าง
3. ETL กับ ELT ต่างกันที่ลำดับและความรับผิดชอบอย่างไร?
4. เขียน grain statement สำหรับ fact table ของการจัดส่งสินค้าหนึ่งตาราง
5. Fact table ต่างจาก Dimension table อย่างไร และ surrogate key มีประโยชน์อะไร?
6. ยอดคงเหลือบัญชีเป็น additive, semi-additive หรือ non-additive measure? เพราะเหตุใด?
7. เมื่อที่อยู่ลูกค้าเปลี่ยน ควรเลือก SCD Type 1 หรือ Type 2 ภายใต้เงื่อนไขใด?
8. Star Schema กับ Snowflake Schema มี trade-off อย่างไร?
9. ออกแบบ reconciliation checks อย่างน้อย 4 ข้อสำหรับ pipeline ยอดขาย
10. Future Data Architecture ต้องเพิ่มองค์ประกอบใดเพื่อให้ BI, ML และ AI ใช้ข้อมูลร่วมกันอย่างเชื่อถือได้?

## แนวคำตอบย่อ

1. OLTP เน้น transaction สั้นและ concurrent write ส่วน analytical query scan/join/aggregate ข้อมูลมาก อาจแย่งทรัพยากรและกระทบระบบปฏิบัติการ
2. จัดตามเรื่องธุรกิจ; รวมรหัส/หน่วยให้ตรง; เก็บประวัติตามเวลา; รักษาข้อมูลที่โหลดแล้วอย่างควบคุมและตรวจสอบได้
3. ETL แปลงก่อนโหลดเข้าเป้าหมาย; ELT โหลด raw ก่อนแล้วแปลงในแพลตฟอร์ม ทั้งคู่ยังต้องมี validation, lineage และ governance
4. ตัวอย่าง: “หนึ่งแถวแทนหนึ่ง shipment milestone ของหนึ่ง shipment ณ เวลาที่เหตุการณ์ถูกยืนยัน”
5. Fact เก็บเหตุการณ์ คีย์ และ measures; Dimension เก็บบริบทพรรณนา; surrogate key แยก warehouse identity จาก key ต้นทางและรองรับประวัติ Type 2
6. Semi-additive เพราะรวมยอดข้ามบัญชีได้ แต่การบวกยอดเดียวกันข้ามวันทำให้เกิด double counting
7. Type 1 เมื่อแก้ข้อมูลผิดและไม่ต้องรักษาประวัติ; Type 2 เมื่อการวิเคราะห์ต้องสะท้อนคุณลักษณะ ณ เวลาที่เหตุการณ์เกิด
8. Star query ง่ายและ join น้อย; Snowflake ลดความซ้ำของ hierarchy แต่เพิ่ม join และความซับซ้อน
9. row count, distinct receipt count, sum net amount, min/max date, rejected total, unknown keys และ duplicate business keys
10. governed quality layers, catalog/lineage, semantic layer, data-product ownership, privacy controls, freshness SLA และ interfaces สำหรับ structured/unstructured/vector data

## Rubric ข้อ 10 (10 คะแนน)

| เกณฑ์ | คะแนน |
|---|---:|
| อธิบาย consumer ทั้ง BI, ML และ AI | 2 |
| มี quality, lineage และ semantic definition | 3 |
| มี owner, access และ privacy | 2 |
| มี freshness/monitoring/recovery | 2 |
| สื่อสารชัดเจน | 1 |

