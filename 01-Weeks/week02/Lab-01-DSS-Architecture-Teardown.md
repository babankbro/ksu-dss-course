# Lab 1 — DSS Architecture Teardown

## เป้าหมาย

ถอดระบบจริงให้เห็น decision flow, ระบบย่อย 4 ส่วน และจุดล้มเหลวที่ผู้ใช้มองไม่เห็น

## เวลาและรูปแบบ

- เวลา 45 นาที
- กลุ่มละ 4–5 คน
- เลือก 1 ระบบ: อนุมัติสินเชื่อ, Google Maps/route planning, recommender, hospital capacity หรือระบบที่อาจารย์อนุมัติ

## งาน

### 1. Decision framing (5 นาที)

ระบุ decision, decision owner, ผู้ได้รับผลกระทบ, ความถี่ และเวลาสูงสุดที่รอได้

### 2. Architecture map (15 นาที)

วาดแผนภาพที่มี:

- external/internal data sources
- Data, Model, Knowledge และ UI subsystems
- human decision/action
- feedback และ audit log
- ลูกศรพร้อมชื่อข้อมูลหรือข้อความที่ส่ง

### 3. Failure injection (10 นาที)

เลือก 3 เหตุการณ์:

- ข้อมูลช้า 6 ชั่วโมง
- model service ไม่ตอบ
- rule version ไม่ตรงกัน
- ผู้ใช้ override โดยไม่ให้เหตุผล
- network ขาด

สำหรับแต่ละเหตุการณ์ ระบุสิ่งที่ผู้ใช้เห็น ผลกระทบ และ safe fallback

### 4. Redesign (10 นาที)

เพิ่ม control อย่างน้อย 3 อย่าง เช่น freshness badge, circuit breaker, manual fallback, version pinning, approval gate หรือ outcome monitoring

### 5. Pitch (5 นาที)

นำเสนอ 90 วินาที: decision → architecture → failure ที่ร้ายแรงที่สุด → redesign

## สิ่งส่งมอบ

1. Architecture diagram 1 หน้า
2. ตาราง failure analysis
3. ข้อเสนอ redesign 3 รายการ

## Rubric (20 คะแนน)

| เกณฑ์ | คะแนน |
|---|---:|
| Decision framing | 3 |
| ระบบย่อยและ data flow ถูกต้อง | 6 |
| วิเคราะห์ failure chain | 5 |
| Redesign ใช้งานได้จริง | 4 |
| การสื่อสาร | 2 |

