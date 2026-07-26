---
title: "W9 — Predictive Modeling ด้วย Machine Learning"
tags: [week, part-3-models]
week: 9
part: "Part III — ชั้นตัวแบบ"
clo: [4]
exam: final
---

# 📘 สัปดาห์ที่ 9 — การสร้างตัวแบบเชิงพยากรณ์ด้วยการเรียนรู้ของเครื่อง

⬅️ [[Week-08-Midterm-Exam]] | ➡️ [[Week-10-Optimization-and-Prescriptive]]

## 🎯 จุดประสงค์การเรียนรู้
1. แยกแยะการวิเคราะห์เชิงพรรณนา เชิงพยากรณ์ และเชิงให้คำแนะนำได้อย่างชัดเจน
2. เลือกอัลกอริทึม ML ให้เหมาะกับลักษณะข้อมูลและข้อกำหนดด้านการอธิบายได้
3. ประเมินโมเดลด้วยเมตริกที่ถูกต้อง และวินิจฉัยปัญหา overfitting/underfitting
4. อธิบายบทบาทของ NLP และ Sentiment Analysis ในการพยากรณ์พฤติกรรมลูกค้า

## 📖 เนื้อหาบรรยาย (2 ชม.)

### ช่วงที่ 1 (25 นาที) — ระดับของการวิเคราะห์
→ [[Predictive-Analytics]]

| ระดับ | คำถาม | ผลผลิต | ตัวอย่างเทคนิค |
|---|---|---|---|
| Descriptive | เกิดอะไรขึ้น? | รายงาน, dashboard | [[OLAP]], สถิติเชิงพรรณนา |
| Diagnostic | ทำไมจึงเกิด? | คำอธิบายสาเหตุ | drill-down, [[Bayesian-Networks\|causal analysis]] |
| **Predictive** | จะเกิดอะไรขึ้น? | การพยากรณ์, คะแนนความน่าจะเป็น | ML, time series |
| **Prescriptive** | ควรทำอย่างไร? | ข้อเสนอแนะการกระทำ | [[Optimization-and-Operations-Research\|Optimization]], simulation |

- จุดเชื่อมต่อระหว่าง **วิทยาการข้อมูล (Data Science)** และ **วิทยาการจัดการ (Management Science)** — DSS ที่สมบูรณ์ต้องมีทั้งสองฝั่ง

### ช่วงที่ 2 (40 นาที) — อัลกอริทึมสำหรับความสัมพันธ์ไม่เชิงเส้น
→ [[Machine-Learning-for-DSS]]
- **Random Forest** — ensemble ของ decision trees, bagging, feature importance ที่ตีความได้ระดับหนึ่ง
- **Gradient Boosting (XGBoost/LightGBM)** — มาตรฐานปฏิบัติสำหรับข้อมูลตาราง
- **Support Vector Machines (SVM)** — margin, kernel trick สำหรับความสัมพันธ์ไม่เชิงเส้น
- **Neural Networks / Deep Learning** — เมื่อใดคุ้มค่าและเมื่อใดเกินความจำเป็น
- 🔑 **การแลกเปลี่ยนระหว่างความแม่นยำกับความอธิบายได้ (Accuracy–Interpretability trade-off)** — ใน DSS สำหรับโดเมนที่มีข้อบังคับ (การแพทย์ การเงิน) ความอธิบายได้อาจสำคัญกว่าความแม่นยำ 2% → เชื่อมสู่ [[ANFIS]] (W13) และ [[Explainable-AI-and-Governance]] (W15)

### ช่วงที่ 3 (30 นาที) — NLP และการวิเคราะห์ข้อความ
- การแปลงข้อความเป็นเวกเตอร์: Bag-of-Words → TF-IDF → Word Embeddings → Transformer-based
- **Sentiment Analysis** เพื่อพยากรณ์พฤติกรรมลูกค้าจากรีวิวและโซเชียลมีเดีย
- Text Analytics ในฐานะ "เซ็นเซอร์" ตรวจจับสัญญาณความเสี่ยง (เช่น ข่าวเกี่ยวกับซัพพลายเออร์) → กรณีศึกษาใน [[Week-15-Decision-Intelligence-and-Agentic-AI]]

### ช่วงที่ 4 (25 นาที) — การประเมินและการตรวจสอบความถูกต้อง
→ [[Model-Evaluation-Metrics]]
- Regression: RMSE, MAE, MAPE, R² — และเหตุใด RMSE ลงโทษความผิดพลาดใหญ่มากกว่า MAE
- Classification: Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC (ใช้เมื่อข้อมูลไม่สมดุลมาก)
- **Cross-validation** และ **time-series split** (ห้ามสุ่มแบ่งข้อมูลอนุกรมเวลา — เป็น data leakage)
- การวินิจฉัย: learning curve, bias-variance trade-off
- **Model drift** — โมเดลเสื่อมสภาพเมื่อโลกเปลี่ยน → นำไปสู่ [[DecisionOps-and-MLOps]]

## 🔬 ปฏิบัติการ (2 ชม.)
[[Lab-07-Predictive-Model-and-Metrics]] — พยากรณ์การเลิกใช้บริการ (churn) เปรียบเทียบ Logistic Regression / Random Forest / SVM ด้วย cross-validation แล้วเลือกโมเดลโดยให้เหตุผลที่ **ไม่ใช่แค่ค่าเมตริกสูงสุด** (ต้องพิจารณาความอธิบายได้และต้นทุนของความผิดพลาดแต่ละประเภท)

## 🏭 กรณีศึกษา
บริษัทโลจิสติกส์ใช้ ML พยากรณ์ปริมาณพัสดุรายวัน — อภิปราย: การพยากรณ์ที่แม่นยำมีค่าอย่างไรถ้ายังไม่มีระบบตัดสินใจว่าจะจัดรถกี่คัน? (เกริ่นสู่ W10 ที่จะนำผลพยากรณ์ไปเข้าตัวแบบ optimization)

## 📌 กิจกรรมสำคัญ
> [!todo] ปล่อยโจทย์งานกลุ่ม
> [[Group-Project]] — Mini-DSS Prototype (25%) · ส่ง Proposal สัปดาห์ที่ 10

## ✅ ตรวจสอบความเข้าใจตนเอง
- [ ] อธิบายความต่างของ predictive กับ prescriptive ได้พร้อมตัวอย่าง
- [ ] เลือกเมตริกที่ถูกต้องจากคำอธิบายบริบททางธุรกิจ
- [ ] ระบุได้ว่ากรณีใดห้ามใช้ random train-test split

> [!exam] ความสำคัญต่อการสอบ
> **ปลายภาคส่วน B และ C** — คำนวณเมตริก, เลือกอัลกอริทึมพร้อมเหตุผล, วินิจฉัย overfitting จาก learning curve ที่ให้มา

---
**แนวคิดหลัก:** [[Predictive-Analytics]] · [[Machine-Learning-for-DSS]] · [[Model-Evaluation-Metrics]]
