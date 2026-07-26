# Lab 02 — Cost-sensitive Threshold และ Monitoring

## สถานการณ์

องค์กรใช้โมเดลคัดกรองธุรกรรมเสี่ยง:

- False Negative: ปล่อย fraud ผ่าน ต้นทุนเฉลี่ย 8,000 บาท
- False Positive: ระงับธุรกรรมจริง ต้นทุนบริการ/ความไม่พอใจ 300 บาท
- ทีมตรวจสอบรับได้ไม่เกิน 120 เคสต่อวัน

โมเดลให้ `risk_score` ระหว่าง 0–1 แต่ยังไม่มี threshold policy

## งานส่วน A — เปรียบเทียบ Threshold

ทดลอง threshold อย่างน้อย 0.20, 0.35, 0.50, 0.65 และ 0.80 แล้วคำนวณ:

- TP, FP, FN, TN
- Precision, Recall, F1
- จำนวน alert ต่อวัน
- expected error cost

\[
Expected\ Error\ Cost = 8000(FN)+300(FP)
\]

เลือก threshold ที่ลดต้นทุนภายใต้ข้อจำกัด 120 alerts/day

## งานส่วน B — ออกแบบ 3 ระดับการกระทำ

กำหนด policy:

1. auto-hold
2. manual review
3. pass with monitoring

ระบุ threshold, owner, SLA, evidence ที่ reviewer เห็น และเงื่อนไข override

## งานส่วน C — Subgroup Check

แยก metric ตามอย่างน้อย 2 กลุ่ม เช่น channel, region หรือ customer tenure แล้วตอบ:

- กลุ่มใดมี FPR/FNR สูงผิดปกติ
- ความต่างเกิดจาก prevalence, data quality หรือ model behavior
- ต้องเก็บข้อมูลหรือปรับ policy เพิ่มอย่างไร

## งานส่วน D — Monitoring Plan

ออกแบบตาราง:

| สิ่งที่ติดตาม | Metric | ความถี่ | Trigger | Action | Owner |
|---|---|---|---|---|---|
| Data quality | missing rate | รายวัน | > 5% | fallback | Data owner |
| Score drift | PSI/distribution | รายสัปดาห์ | เกินเกณฑ์ | investigate | Model owner |
| Outcome | Recall/Precision | รายเดือน | ต่ำกว่า SLA | retrain/review | Risk team |
| Operations | alert volume | รายวัน | > 120 | adjust queue | Operations |
| Human review | override rate | รายสัปดาห์ | เพิ่มต่อเนื่อง | audit cases | QA |

## สิ่งที่ส่ง

- threshold comparison table
- cost curve หรือ Precision–Recall plot
- policy 3 ระดับ
- subgroup analysis
- monitoring plan พร้อม owner/trigger/action

## คำถามสรุป

1. Threshold ที่ F1 สูงสุดตรงกับต้นทุนต่ำสุดหรือไม่ เพราะเหตุใด
2. ถ้า FN cost เพิ่มเป็น 20,000 บาท policy เปลี่ยนอย่างไร
3. ถ้าทีมตรวจเพิ่ม capacity ได้สองเท่า threshold ควรเปลี่ยนหรือไม่
4. ใครควรมีสิทธิ์อนุมัติ threshold production
