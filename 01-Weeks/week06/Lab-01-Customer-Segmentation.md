# Lab 1 — Customer Segmentation ที่ตรวจสอบได้

## เป้าหมาย

สร้าง RFM segmentation ด้วย K-Means แล้วพิสูจน์ว่ากลุ่มมีความเสถียร ตีความได้ และเชื่อมกับ action ที่ทีมทำได้จริง

## ข้อมูลขั้นต่ำ

`customer_id, invoice_id, invoice_date, quantity, unit_price, status, category`

## งานปฏิบัติ

1. กำหนด snapshot date และ observation window พร้อมเหตุผล
2. กรอง cancellation/return และสร้าง Recency, Frequency, Monetary ต่อ customer
3. ตรวจ missing, duplicate, outlier และ skew; ทดลอง `log1p` กับ F/M
4. สร้าง pipeline สำหรับ transform + StandardScaler
5. ทดลอง K-Means `k=2..8` ด้วย seed อย่างน้อย 10 ค่า
6. รายงาน inertia, silhouette, ขนาดกลุ่ม และ stability ระหว่าง seed
7. Profile กลุ่มด้วย median/IQR และ categorical distribution ก่อนตั้งชื่อ
8. เลือก k โดยอธิบาย technical evidence + operational capacity
9. เสนอ action หนึ่งรายการต่อกลุ่ม พร้อม owner, KPI และข้อจำกัด
10. ระบุ feature ที่อาจสร้างผลกระทบไม่เหมาะสมและแนวทางตรวจสอบ

## สิ่งส่งมอบ

- Notebook/script ที่รันซ้ำได้
- ตารางเปรียบเทียบ `k=2..8`
- Cluster profile และภาพอย่างน้อย 2 แบบ
- Decision memo 1 หน้า: segment → action → KPI → risk

## เกณฑ์ประเมิน 20 คะแนน

| หัวข้อ | คะแนน |
|---|---:|
| นิยามข้อมูล/RFM ถูกต้อง | 4 |
| Pipeline และ scaling | 4 |
| เปรียบเทียบ k/metric | 4 |
| Stability และ profiling | 4 |
| Action, KPI, risk | 4 |

