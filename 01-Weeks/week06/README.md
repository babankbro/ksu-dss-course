# Week 06 — Data Mining II

ชุดสอนฉบับขยายสำหรับบรรยาย 2 ชั่วโมงและปฏิบัติการ 2 ชั่วโมง ครอบคลุม Clustering และ Association Rules โดยเน้นการแปลง “รูปแบบที่ค้นพบ” ให้เป็นข้อเสนอเชิงการตัดสินใจที่ผ่านการตรวจสอบ

## ผลลัพธ์การเรียนรู้

ผู้เรียนสามารถ:

1. อธิบายข้อจำกัดของ Unsupervised Learning เมื่อไม่มี label อ้างอิง
2. เตรียม feature และเลือก scaling ที่เหมาะกับระยะทาง
3. อธิบาย K-Means, Hierarchical Clustering และ DBSCAN
4. เลือกจำนวนกลุ่มด้วย inertia, silhouette, stability และข้อจำกัดการดำเนินงาน
5. คำนวณ Support, Confidence และ Lift
6. เปรียบเทียบ Apriori กับ FP-Growth
7. แยกความสัมพันธ์ออกจากเหตุและผล และออกแบบการทดลองยืนยัน
8. เชื่อมผลลัพธ์กลับสู่ DSS ด้วย action, owner, capacity และ monitoring

## ไฟล์ในชุด

- [[Week-06-Expanded-Content|เนื้อหาขยาย]]
- [[Week-06-Questions|คำถาม 10 ข้อพร้อมแนวคำตอบ]]
- [[Lab-01-Customer-Segmentation|Lab 1: Customer Segmentation]]
- [[Lab-02-Market-Basket-and-Experiment|Lab 2: Market Basket และ A/B Test]]
- [[References|เอกสารอ้างอิง]]
- `Week-06-Data-Mining-II.pptx` — สไลด์ 25 หน้า

## ลำดับการสอน

| เวลา | กิจกรรม |
|---|---|
| 0–15 นาที | Hook: 3 clusters ไม่ได้แปลว่ามี 3 customer segments |
| 15–70 นาที | Feature space, scaling, K-Means และการเลือก k |
| 70–105 นาที | Hierarchical, DBSCAN และ algorithm fit |
| 105–135 นาที | Association Rules, metrics, Apriori และ FP-Growth |
| 135–195 นาที | Lab 1 |
| 195–235 นาที | Lab 2 |
| 235–240 นาที | สรุป Future Data Mining II และ experiment gate |

> Pattern ที่น่าสนใจเชิงสถิติยังไม่ใช่ decision ที่ควรใช้ จนกว่าจะผ่าน technical validity, domain meaning และ decision value

