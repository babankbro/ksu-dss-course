# คำถามทบทวน Week 02 — DSS Architecture

## คำถาม

1. ระบบย่อยหลัก 4 ส่วนของ DSS คืออะไร และแต่ละส่วนส่งมอบอะไรให้ส่วนถัดไป?
2. Knowledge subsystem ต่างจาก Model subsystem อย่างไร? ยกตัวอย่างจากระบบสินเชื่อ
3. ติดตามเส้นทางคำขออนุมัติสินเชื่อตั้งแต่รับข้อมูลจนถึงบันทึกผลลัพธ์
4. ระบบค้นและสรุปสัญญาเพื่อเสนอประเด็นเสี่ยงเป็น DSS ประเภทใด และอาจผสมประเภทใดบ้าง?
5. เมื่อใดควรใช้ batch architecture แทน real-time architecture?
6. ระบบตรวจโรคพืชในพื้นที่อินเทอร์เน็ตไม่เสถียรควรแบ่งงานระหว่าง edge และ cloud อย่างไร?
7. เหตุใด “accuracy สูง” จึงยังไม่เพียงพอสำหรับ DSS ที่น่าเชื่อถือ?
8. เลือก anti-pattern หนึ่งข้อและอธิบาย failure chain ตั้งแต่สาเหตุถึงผลกระทบ
9. Future DSS แบบ multi-agent ต้องมีองค์ประกอบใดใน control plane อย่างน้อย 4 อย่าง?
10. เลือกหนึ่ง application แล้วเสนอการปรับสถาปัตยกรรมเพื่อเพิ่มทั้งความเร็วและความปลอดภัย

## แนวคำตอบย่อ

1. Data จัดหาและรับรองข้อมูล; Model คำนวณ/จำลอง; Knowledge ใช้กฎและข้อจำกัด; UI ทำให้ผู้ใช้ถาม เปรียบเทียบ อนุมัติ และบันทึกเหตุผล
2. Model ประมาณความเสี่ยงหรือผลลัพธ์จากข้อมูล ส่วน Knowledge บังคับนโยบาย เช่น score บอก probability of default แต่ rule กำหนดว่าเอกสารไม่ครบต้องส่งตรวจ
3. Ingest/validate → feature/model score → policy checks → explanation/UI → human decision → action → audit log → outcome feedback
4. แกนหลักเป็น document-driven อาจผสม knowledge-driven สำหรับข้อกฎหมาย, model-driven สำหรับ scoring และ communication-driven สำหรับการทบทวนร่วม
5. เมื่อการตัดสินใจเป็นรอบ ข้อมูลไม่เปลี่ยนเร็ว ต้องการต้นทุนต่ำและ reproducibility สูง เช่น forecast รายสัปดาห์
6. Edge ทำ preprocessing/inference และเก็บคิวชั่วคราว; cloud ฝึกโมเดล รวมข้อมูล จัดการเวอร์ชันและ monitoring; sync เมื่อเชื่อมต่อ
7. ต้องพิจารณา calibration, latency, fairness, explainability, security, availability, auditability และผลกระทบเมื่อผิด
8. ตัวอย่าง stale-data certainty: pipeline หยุด → UI ไม่เตือน → ผู้ใช้เชื่อ forecast เก่า → สั่งสินค้าผิด → ไม่มี timestamp ทำให้สืบสวนยาก
9. Agent registry/permission, orchestration, policy gate, audit trace, monitoring/evaluation, sandbox, memory provenance, rollback และ human approval
10. คำตอบควรระบุ trade-off เช่น fraud ใช้ edge/stream scoring เพื่อเร็ว แต่จำกัดวงเงิน action, ส่งกรณีเสี่ยงสูงให้มนุษย์ และเก็บ trace เพื่อความปลอดภัย

## Rubric สำหรับข้อ 10 (10 คะแนน)

| เกณฑ์ | คะแนน |
|---|---:|
| ระบุ decision และผู้รับผิดชอบชัดเจน | 2 |
| เชื่อม subsystem และ data flow ถูกต้อง | 3 |
| อธิบาย trade-off ความเร็ว/ความปลอดภัย | 2 |
| มี monitoring, fallback และ audit | 2 |
| สื่อสารกระชับและเป็นระบบ | 1 |

