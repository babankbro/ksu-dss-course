# Lab 2 — Design a Future DSS Architecture

## โจทย์

ออกแบบ Future DSS แบบ multi-agent สำหรับหนึ่งโดเมน:

- ศูนย์บัญชาการน้ำท่วม
- โรงพยาบาลและการจัดเตียง
- smart campus energy
- supply-chain disruption
- cyber incident response

## เวลาและรูปแบบ

- เวลา 45 นาที
- ใช้กลุ่มเดิม

## ข้อกำหนดขั้นต่ำ

ระบบต้องมี:

1. แหล่งข้อมูลอย่างน้อย 3 ชนิด
2. agent อย่างน้อย 3 บทบาท
3. model/simulation และ knowledge/policy
4. orchestration/control plane
5. human approval อย่างน้อย 1 จุด
6. monitoring, audit trace และ rollback
7. ระดับ autonomy ที่อธิบายได้

## ขั้นตอน

### 1. Define the decision (5 นาที)

เขียนประโยค: “เมื่อ ___ ระบบช่วย ___ ตัดสินใจ ___ ภายใน ___ นาที โดยไม่ละเมิด ___”

### 2. Assign agents (10 นาที)

สำหรับแต่ละ agent ระบุ goal, tools/data, output, permission และสิ่งที่ห้ามทำ

### 3. Draw the control plane (15 นาที)

แสดง event flow, orchestration, conflict resolution, policy gate, human approval, action และ feedback

### 4. Test three scenarios (10 นาที)

- ปกติ
- ข้อมูลขัดแย้ง/ไม่ครบ
- agent เสนอ action ที่เกินสิทธิ์

ระบุระบบจะ detect, contain, escalate และ recover อย่างไร

### 5. One-minute board review (5 นาที)

อธิบายว่าเหตุใด autonomy level จึงเหมาะกับความเสี่ยง

## Template ตาราง Agent Contract

| Agent | Goal | Input/Tools | Output | Permission | Guardrail |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

## Rubric (20 คะแนน)

| เกณฑ์ | คะแนน |
|---|---:|
| Decision และ value ชัดเจน | 3 |
| Agent contracts และ orchestration | 5 |
| Data/model/knowledge integration | 4 |
| Governance, approval, audit, rollback | 5 |
| Scenario testing และการนำเสนอ | 3 |

