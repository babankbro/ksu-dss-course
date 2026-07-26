---
title: "Week 05 — Data Mining I: Expanded Content"
tags: [week05, data-mining, crisp-dm, classification]
---

# Data Mining I: จากคำถามธุรกิจสู่ Classification ที่ใช้งานได้

## 1. Data Mining อยู่ตรงไหนใน DSS

Data Mining คือการใช้ข้อมูลและแบบจำลองเพื่อค้นหารูปแบบหรือทำนายผลลัพธ์ที่ยังไม่ทราบ ใน DSS งานนี้อยู่ระหว่าง:

- **Data Management** — จัดหาและควบคุมข้อมูล
- **Model Management** — ฝึก ประเมิน และจัดการโมเดล
- **User Interface** — แสดงผล คำอธิบาย และทางเลือกแก่ผู้ตัดสินใจ

งานหลักประกอบด้วย classification, regression, clustering และ association rules สัปดาห์นี้เน้น **classification**: ทำนายป้ายกำกับ เช่น ผิดนัด/ไม่ผิดนัด ทุจริต/ปกติ หรือเร่งด่วน/ไม่เร่งด่วน

## 2. เริ่มจาก Decision ไม่ใช่ Algorithm

ก่อนเปิด notebook ต้องระบุ:

1. ใครเป็นผู้ใช้ผลทำนาย
2. ต้องตัดสินใจอะไรและภายในเวลาเท่าใด
3. หน่วยที่ถูกจำแนกคืออะไร
4. target ถูกนิยามเมื่อใด
5. ข้อมูลใดมีอยู่จริง ณ เวลาทำนาย
6. False Positive และ False Negative สร้างต้นทุนอะไร
7. ใครมีสิทธิ์ override และบันทึกเหตุผลอย่างไร

ตัวอย่าง “คาดการณ์ลูกค้าผิดนัด” ยังไม่พอ ต้องกำหนดว่า “ผิดนัดเกิน 30 วันภายใน 90 วันหลังอนุมัติ” และคาดการณ์ ณ เวลาใด

## 3. CRISP-DM เป็นวงจร ไม่ใช่น้ำตก

CRISP-DM มี 6 ระยะ:

1. **Business Understanding** — เป้าหมาย ข้อจำกัด success criteria และต้นทุน
2. **Data Understanding** — แหล่งข้อมูล คุณภาพ distribution และความหมาย
3. **Data Preparation** — เลือก record, clean, transform, encode และสร้าง feature
4. **Modeling** — เลือก algorithm ฝึก และปรับ hyperparameter
5. **Evaluation** — ตรวจทั้งคะแนน ความสมเหตุผล และความพร้อมทางธุรกิจ
6. **Deployment** — นำผลไปใช้ สื่อสาร เฝ้าระวัง และวางแผนปรับปรุง

ลูกศรย้อนกลับสำคัญมาก เช่น modeling พบ feature ใช้ไม่ได้จึงย้อนสู่ preparation หรือ evaluation พบว่า metric ไม่ตรงต้นทุนจึงย้อนสู่ business understanding

## 4. Data Understanding: ก่อนแก้ข้อมูลต้องเข้าใจความหมาย

ตรวจอย่างน้อย:

- หนึ่งแถวแทนอะไรและมี duplicate ตาม business key หรือไม่
- target มี prevalence เท่าใด
- missing หมายถึง “ไม่ทราบ”, “ไม่เกี่ยวข้อง” หรือ “ไม่มีเหตุการณ์”
- distribution เปลี่ยนตามเวลา สาขา หรือกลุ่มประชากรหรือไม่
- feature ใดเกิดหลัง outcome
- การเก็บข้อมูลมี selection bias หรือ label bias หรือไม่

ใช้ data dictionary และ target definition เป็นหลักฐานร่วมกับสถิติและกราฟ

## 5. Split ก่อน Fit เพื่อป้องกัน Data Leakage

Data leakage เกิดเมื่อข้อมูลที่ไม่มี ณ เวลาทำนาย หรือข้อมูลจาก test set มีอิทธิพลต่อการฝึก ทำให้คะแนนดูดีเกินจริง

ลำดับปลอดภัย:

```text
raw data
  → split train / validation / test
  → fit imputer / encoder / scaler บน train
  → transform validation/test ด้วยค่าที่เรียนจาก train
  → fit model
  → tune บน validation หรือ cross-validation
  → ประเมิน test ครั้งสุดท้าย
```

กรณีข้อมูลตามเวลา ควรแบ่งตามเวลา ไม่สุ่มอนาคตปนอดีต ส่วนข้อมูลหลาย record ต่อคนควร group split เพื่อไม่ให้คนเดียวกันอยู่ทั้ง train และ test

## 6. Data Preparation ที่ต้องอธิบายเหตุผล

### Cleaning

- missing: ลบ เติมค่ากลาง เติมด้วยโมเดล หรือสร้าง missing indicator
- duplicate: แยก technical duplicate กับเหตุการณ์ซ้ำจริง
- outlier: ตรวจสาเหตุก่อน cap/remove
- inconsistent categories: ทำ mapping ที่ตรวจสอบย้อนกลับได้

### Transformation และ Encoding

- standardization/normalization จำเป็นกับบางโมเดล แต่ tree ไม่ไวต่อ scale
- one-hot เหมาะกับ nominal categories
- ordinal encoding ใช้เมื่อมีลำดับจริง
- target encoding ต้องอยู่ภายใน cross-validation fold เพื่อป้องกัน leakage

### Feature Engineering

Feature ต้องมี **event time** และ **availability time** เช่น `days_since_last_payment` ใช้ได้เฉพาะเมื่อการชำระครั้งล่าสุดเกิดก่อนเวลาทำนาย

## 7. Imbalanced Classes: Accuracy อาจหลอก

ถ้า fraud มี 1% โมเดลที่ทำนาย “ปกติ” ทุกครั้งได้ Accuracy 99% แต่ Recall ของ fraud เป็น 0

แนวทาง:

- ใช้ stratified split
- class/sample weights
- under/over-sampling เฉพาะ train
- ประเมิน Precision–Recall และ confusion matrix
- เลือก threshold จากต้นทุนและ capacity ของทีมตรวจสอบ

## 8. Decision Tree

Decision Tree แบ่งข้อมูลซ้ำด้วยกฎ `feature ≤ threshold` เพื่อให้ node ลูกบริสุทธิ์ขึ้น

### Gini และ Entropy

สำหรับสัดส่วนคลาส \(p_k\):

\[
Gini = 1-\sum_k p_k^2
\]

\[
Entropy = -\sum_k p_k\log_2(p_k)
\]

split ที่ดีทำให้ weighted impurity หลังแบ่งลดลงมาก

### จุดแข็ง

- มองเห็นกฎและเส้นทางทำนาย
- จับ non-linear interaction
- preprocessing ด้าน scaling น้อย

### กับดัก

- tree ลึก overfit
- ข้อมูลเปลี่ยนเล็กน้อยอาจได้โครงสร้างต่างกัน
- probability ใน leaf ขนาดเล็กไม่น่าเชื่อถือ

ควบคุมด้วย `max_depth`, `min_samples_leaf`, pruning และ validation

## 9. Naive Bayes

ใช้ Bayes’ theorem และสมมติว่า feature เป็นอิสระแบบมีเงื่อนไขเมื่อทราบคลาส:

\[
P(y|x_1,\ldots,x_n) \propto P(y)\prod_i P(x_i|y)
\]

ตัวแปรสำคัญ:

- **prior** \(P(y)\)
- **likelihood** \(P(x_i|y)\)
- **posterior** \(P(y|x)\)

ชนิดที่พบบ่อย:

- GaussianNB — continuous feature ที่สมมติ Gaussian ต่อคลาส
- MultinomialNB — counts เช่นคำในเอกสาร
- BernoulliNB — binary features
- ComplementNB — เหมาะกับข้อความที่ class imbalance

Naive Bayes เร็วและเป็น baseline ที่ดี แต่ probability อาจต้อง calibration ก่อนใช้เป็นความเสี่ยงเชิงธุรกิจ

## 10. Confusion Matrix และ Metrics

| | ทำนาย Positive | ทำนาย Negative |
|---|---:|---:|
| จริง Positive | TP | FN |
| จริง Negative | FP | TN |

\[
Accuracy=\frac{TP+TN}{TP+FP+FN+TN}
\]

\[
Precision=\frac{TP}{TP+FP}
\qquad
Recall=\frac{TP}{TP+FN}
\]

\[
F1=2\frac{Precision \times Recall}{Precision+Recall}
\]

- Precision ตอบ “ที่แจ้งเตือนมา ถูกจริงกี่ส่วน”
- Recall ตอบ “เหตุการณ์จริง ถูกจับได้กี่ส่วน”
- F1 สมดุล Precision/Recall แต่ไม่ได้แทนต้นทุนธุรกิจ

## 11. Threshold คือ Policy

โมเดลให้ score แล้ว policy แปลง score เป็นการกระทำ:

```text
score ≥ 0.80 → ระงับและตรวจทันที
0.50–0.79 → ส่ง manual review
score < 0.50 → ผ่านพร้อม monitoring
```

การลด threshold มักเพิ่ม Recall และเพิ่ม FP จึงต้องพิจารณา:

- ต้นทุน FN และ FP
- จำนวนเคสที่ทีมตรวจได้ต่อวัน
- ความรุนแรงของเหตุการณ์
- fairness ของแต่ละ subgroup
- calibration ของ probability

## 12. จาก Evaluation สู่ Deployment

ก่อน deploy ตรวจ:

- test set แยกจริงและสะท้อนเวลาใช้งาน
- baseline และ metric ตรง success criteria
- subgroup performance
- latency และข้อมูลพร้อม ณ เวลาทำนาย
- explanation และ evidence record
- fallback เมื่อข้อมูลขาดหรือระบบล่ม
- owner, version, approval และ rollback

หลัง deploy ต้อง monitor data quality, feature drift, score drift, outcome performance, override rate และผลกระทบต่อผู้ใช้

## 13. Data Mining กับ OLAP

| OLAP | Data Mining |
|---|---|
| สำรวจสิ่งที่เกิดขึ้น | ค้นหารูปแบบ/ทำนายสิ่งที่อาจเกิด |
| ผู้ใช้กำหนดมิติและเส้นทาง | algorithm เรียนรู้กฎจากข้อมูล |
| ผลลัพธ์เป็น aggregate | ผลลัพธ์เป็น pattern, score หรือ class |
| เหมาะกับ descriptive diagnosis | เหมาะกับ predictive/prescriptive support |

ระบบ DSS ที่ดีใช้ร่วมกัน: OLAP ตรวจบริบทและหลักฐาน ส่วน Data Mining จัดลำดับความเสี่ยงหรือโอกาส

## 14. ตัวอย่าง Classification 20 Applications

| # | Application | Positive class | การตัดสินใจที่รองรับ |
|---:|---|---|---|
| 1 | Credit default | ผิดนัดภายใน 90 วัน | อนุมัติ/ขอหลักประกัน |
| 2 | Card fraud | ธุรกรรมทุจริต | ระงับ/ส่งตรวจ |
| 3 | Insurance claim | เคลมน่าสงสัย | จัดลำดับสืบสวน |
| 4 | Hospital triage | ต้องดูแลเร่งด่วน | จัดลำดับผู้ป่วย |
| 5 | Readmission | กลับเข้า รพ. ภายใน 30 วัน | วางแผนติดตาม |
| 6 | Pharmacy safety | ใบสั่งยามีความเสี่ยง | เภสัชกรทบทวน |
| 7 | Telecom churn | มีแนวโน้มยกเลิก | เสนอ retention |
| 8 | Lead qualification | มีแนวโน้มซื้อ | จัดลำดับฝ่ายขาย |
| 9 | Email spam | spam/phishing | กักกันข้อความ |
| 10 | Support routing | เคสเร่งด่วน | จัดทีม/คิว |
| 11 | Cyber intrusion | เหตุการณ์โจมตี | block/escalate |
| 12 | Predictive maintenance | จะเสียภายในช่วงเวลา | วางแผนซ่อม |
| 13 | Manufacturing defect | ชิ้นงานเสีย | ตรวจซ้ำ/คัดทิ้ง |
| 14 | Delivery exception | ส่งล่าช้า | เปลี่ยนเส้นทาง |
| 15 | Energy fault | ความขัดข้องโครงข่าย | dispatch ทีม |
| 16 | Crop disease | พืชมีโรค | ตรวจแปลง/รักษา |
| 17 | Student risk | เสี่ยงไม่ผ่าน | ให้คำปรึกษา |
| 18 | Benefit eligibility | ต้องทบทวนสิทธิ์ | ส่งเจ้าหน้าที่ |
| 19 | Environmental alert | ค่ามลพิษผิดปกติ | แจ้งเตือน/ตรวจสอบ |
| 20 | Employee attrition | มีแนวโน้มลาออก | วิเคราะห์สภาพงาน |

รายการเหล่านี้เป็นแบบฝึกออกแบบ ไม่ใช่การรับรองว่าควรใช้ automation เต็มรูปแบบ งานที่กระทบสิทธิ์ควรมี human review และช่องทางอุทธรณ์

## 15. Future Data Mining

แนวโน้มสำคัญ:

1. **Automated pipeline assistance** — AI ช่วยเสนอ cleaning, feature และ baseline
2. **Decision-aware evaluation** — optimize ตาม cost/capacity ไม่ใช่ metric เดียว
3. **Continuous monitoring** — ตรวจ drift และผลกระทบหลัง deploy
4. **Governed feature/semantic layers** — นิยาม feature และ target ร่วมกัน
5. **Human oversight** — review, override, appeal และ audit trail
6. **Responsible evaluation** — validity, reliability, privacy, explainability และ fairness

AI สามารถช่วยสร้าง candidate pipeline แต่ผู้รับผิดชอบต้องยืนยัน target, event time, leakage, subgroup impact และ deployment policy

## 16. Checklist ก่อนยอมรับ Classification Model

1. คำถามธุรกิจและ action ชัดหรือไม่
2. target มีนิยามและเวลาอ้างอิงหรือไม่
3. feature มีจริง ณ เวลาทำนายหรือไม่
4. split สอดคล้องกับบุคคลและเวลาหรือไม่
5. preprocessing fit เฉพาะ train หรือไม่
6. baseline และ prevalence ถูกแสดงหรือไม่
7. metric สะท้อนต้นทุน FP/FN หรือไม่
8. threshold สอดคล้องกับ capacity หรือไม่
9. subgroup, explanation และสิทธิ์ review พร้อมหรือไม่
10. monitoring, owner และ rollback ชัดหรือไม่
