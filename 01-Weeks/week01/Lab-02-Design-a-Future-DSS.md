---
title: "Lab 02 — Design a Future DSS"
tags: [week-01, lab, future-dss, architecture]
duration: "120 minutes"
---

# Lab 02 — ออกแบบ Future DSS ที่ฉลาดและรับผิดชอบ

## เป้าหมาย

- ออกแบบแนวคิด DSS จากปัญหาในชีวิตจริง
- ระบุ data, model, knowledge, interface และ feedback
- กำหนดระดับ autonomy และ guardrails

## เลือกหนึ่งโดเมน

- โรงพยาบาล
- เกษตรแม่นยำ
- โลจิสติกส์
- การจัดการภัยพิบัติ
- พลังงาน
- การศึกษา
- เมืองอัจฉริยะ
- Cybersecurity

## ขั้นตอน

### 1. Decision Canvas (25 นาที)

ระบุ:

- ผู้ตัดสินใจ
- การตัดสินใจ
- ความถี่และ deadline
- เป้าหมาย
- constraints
- ความเสียหายเมื่อผิดพลาด
- ผู้ได้รับผลกระทบ

### 2. ออกแบบระบบย่อย (35 นาที)

สร้างแผนภาพที่มี:

- **Data:** แหล่งข้อมูล คุณภาพ ความเป็นส่วนตัว
- **Model:** prediction, optimization, simulation หรือ scoring
- **Knowledge:** กฎ นโยบาย ความรู้ผู้เชี่ยวชาญ
- **Interface:** สิ่งที่ผู้ใช้เห็น ปรับ และอนุมัติ
- **Feedback:** outcome, monitoring และการเรียนรู้

### 3. Autonomy Ladder (25 นาที)

เลือกระดับและให้เหตุผล:

| ระดับ | ความสามารถ |
|---:|---|
| 0 | แสดงข้อมูล |
| 1 | เตือนและจัดลำดับ |
| 2 | เสนอทางเลือก |
| 3 | แนะนำทางเลือกหนึ่ง |
| 4 | ลงมือทำหลังมนุษย์อนุมัติ |
| 5 | ลงมือทำอัตโนมัติภายใต้ขอบเขต |

### 4. Guardrail Design (20 นาที)

กำหนดอย่างน้อย 6 รายการ:

- สิทธิ์เข้าถึง
- approval gate
- confidence threshold
- human override
- safe fallback
- audit trail
- bias/privacy/security test
- monitoring และ incident response

### 5. Pitch (15 นาที)

นำเสนอ 3 นาที:

1. ปัญหาและผู้ตัดสินใจ
2. วิธีที่ DSS ช่วย
3. ระดับ autonomy
4. ความเสี่ยงสำคัญที่สุดและ guardrail

## ผลส่ง

- Decision Canvas 1 หน้า
- Architecture diagram 1 ภาพ
- Autonomy + guardrail table
- Pitch 3 นาที

## Rubric 10 คะแนน

| เกณฑ์ | คะแนน |
|---|---:|
| กรอบการตัดสินใจชัดเจน | 2 |
| ระบบย่อยครบและเชื่อมโยง | 3 |
| เลือกเทคนิคเหมาะกับปัญหา | 2 |
| Autonomy และ guardrails สมเหตุสมผล | 2 |
| การนำเสนอ | 1 |

