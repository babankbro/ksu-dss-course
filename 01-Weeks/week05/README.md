# Week 05 — Data Mining I

ชุดสอนฉบับขยายสำหรับบรรยาย 2 ชั่วโมงและปฏิบัติการ 2 ชั่วโมง เน้นการสร้างระบบจำแนกประเภทที่เริ่มจากคำถามธุรกิจ ป้องกัน data leakage และเลือก threshold ตามต้นทุนของข้อผิดพลาด

## ผลลัพธ์การเรียนรู้

ผู้เรียนควรสามารถ:

1. อธิบาย Data Mining ในฐานะ Model Management ของ DSS
2. ใช้ CRISP-DM ครบ 6 ระยะและอธิบายการวนกลับระหว่างระยะ
3. เตรียมข้อมูลโดยไม่ทำให้ข้อมูลทดสอบรั่วเข้าสู่การฝึก
4. อธิบาย Decision Tree, Gini/Entropy, pruning และ Naive Bayes
5. คำนวณ Accuracy, Precision, Recall และ F1 จาก confusion matrix
6. เลือก metric และ threshold ตามต้นทุน False Positive/False Negative
7. ออกแบบ deployment, monitoring และ human oversight สำหรับโมเดล

## ไฟล์ในชุด

- [[Week-05-Expanded-Content|เนื้อหาขยาย]]
- [[Week-05-Questions|คำถาม 10 ข้อพร้อมแนวคำตอบ]]
- [[Lab-01-Classification-Pipeline|Lab 1: Classification Pipeline]]
- [[Lab-02-Cost-Sensitive-Threshold-and-Monitoring|Lab 2: Threshold และ Monitoring]]
- [[References|เอกสารอ้างอิง]]
- `Week-05-Data-Mining-I.pptx` — สไลด์ 20 หน้า

## ลำดับการสอน

| เวลา | กิจกรรม |
|---|---|
| 0–15 นาที | Hook: Accuracy 98% แต่อาจจับเหตุการณ์สำคัญไม่ได้ |
| 15–45 นาที | Data Mining ใน DSS และ CRISP-DM |
| 45–80 นาที | Data preparation, split และ leakage |
| 80–120 นาที | Decision Tree, Naive Bayes และ evaluation |
| 120–175 นาที | Lab 1 |
| 175–225 นาที | Lab 2 |
| 225–240 นาที | นำเสนอ threshold policy และ Future Data Mining |

> โมเดลที่ดีไม่ใช่เพียงโมเดลที่มีคะแนนสูง แต่เป็นระบบตัดสินใจที่มีนิยามข้อมูล ต้นทุนข้อผิดพลาด และหลักฐานตรวจสอบได้
