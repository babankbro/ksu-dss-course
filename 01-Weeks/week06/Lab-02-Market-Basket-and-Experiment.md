# Lab 2 — Market Basket, Rule Validation และ A/B Test

## เป้าหมาย

ค้นหากฎความสัมพันธ์ที่มีหลักฐานเพียงพอ ลดกฎซ้ำซ้อน และเปลี่ยนกฎหนึ่งข้อให้เป็นการทดลองทางธุรกิจ

## ข้อมูลขั้นต่ำ

`transaction_id, customer_id, timestamp, item_id, quantity, status, store/channel`

## งานปฏิบัติ

1. นิยาม basket boundary และเหตุผล เช่น receipt หรือ 30-minute session
2. กรอง returns/cancellations/test items และสร้าง one-hot baskets
3. หา frequent itemsets ด้วย Apriori หรือ FP-Growth
4. สร้าง rules และรายงาน support, count, confidence, lift
5. เปรียบเทียบ threshold อย่างน้อย 3 ชุดและอธิบาย pattern explosion
6. ตัดกฎซ้ำซ้อน/ไม่ action-able และตรวจความเสถียรใน validation period
7. เลือกหนึ่งกฎ พร้อม alternative explanations อย่างน้อย 3 ข้อ
8. ออกแบบ A/B test: unit, randomization, treatment, control, duration
9. กำหนด primary metric เช่น incremental margin และ guardrails อย่างน้อย 3 ตัว
10. ทางเลือกเสริม: ทำ rules แยกตาม cluster จาก Lab 1 แล้วตรวจ sample size

## สิ่งส่งมอบ

- Data dictionary และ basket definition
- ตาราง rules ก่อน/หลัง pruning
- Rule card: evidence, alternative explanations, action
- Experiment plan พร้อม success/stop criteria

## เกณฑ์ประเมิน 20 คะแนน

| หัวข้อ | คะแนน |
|---|---:|
| Basket definition/cleaning | 4 |
| Metrics ถูกต้อง | 4 |
| Threshold และ pruning | 4 |
| Validation/interpretation | 4 |
| Experiment/guardrails | 4 |

