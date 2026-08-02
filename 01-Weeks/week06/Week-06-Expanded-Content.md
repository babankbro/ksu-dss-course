# Week 06 — Data Mining II: Clustering และ Association Rules

## 1. แนวคิดใหญ่: ค้นพบรูปแบบ ≠ พร้อมตัดสินใจ

Unsupervised Learning ทำงานกับข้อมูลที่ไม่มี label เป้าหมาย จึงไม่มีคำตอบเฉลยว่า “กลุ่มใดถูก” หรือ “กฎใดจริง” การประเมินต้องใช้หลักฐาน 3 ชั้นร่วมกัน:

1. **Technical validity** — กลุ่มเกาะกันและแยกจากกันหรือไม่ กฎเกิดมากพอหรือไม่
2. **Domain meaning** — feature, หน่วยวิเคราะห์ และช่วงเวลาสะท้อนพฤติกรรมจริงหรือไม่
3. **Decision value** — องค์กรมี action, owner, capacity และหลักฐานเชิงทดลองหรือไม่

กระบวนการที่ปลอดภัยคือ `Decision question → Unit of analysis → Feature/transaction definition → Pattern discovery → Validation → Action/experiment → Monitoring`

## 2. Feature space คือแบบจำลองของความคล้าย

อัลกอริทึมไม่รู้จัก “ลูกค้า” แต่เห็นเวกเตอร์ตัวเลข หากใช้ RFM:

- **Recency**: จำนวนวันตั้งแต่ซื้อครั้งล่าสุด ณ snapshot date เดียวกัน
- **Frequency**: จำนวนธุรกรรมที่เข้าเกณฑ์ ไม่ใช่จำนวนบรรทัดสินค้า
- **Monetary**: ยอดสุทธิหลังคืน/ยกเลิก และควรตรวจ outlier

ต้องระบุหน่วยวิเคราะห์, time window, treatment ของ missing/returns และเหตุผลของทุก feature ก่อนคำนวณระยะทาง

## 3. Scaling เปลี่ยนเรขาคณิต

K-Means ใช้ Euclidean distance และ squared distance ใน objective หาก Monetary อยู่หลักหมื่นแต่ Frequency อยู่หลักสิบ Monetary จะครอบงำผลโดยปริยาย แนวปฏิบัติทั่วไปคือ:

- ใช้ log transform กับตัวแปรเบ้มาก เช่น Monetary/Frequency
- ใช้ StandardScaler เมื่อหน่วยต่างกันและต้องการน้ำหนักใกล้เคียงกัน
- ใช้ RobustScaler เมื่อ outlier รุนแรง
- บันทึก pipeline เดียวกันสำหรับข้อมูลใหม่

อย่า “normalize ทุกอย่าง” โดยอัตโนมัติ เพราะ scaling คือการกำหนดน้ำหนักเชิงนโยบายด้วย

## 4. K-Means

### 4.1 ขั้นตอน

1. เลือก centroid เริ่มต้นจำนวน k
2. Assign แต่ละจุดไป centroid ที่ใกล้ที่สุด
3. Update centroid เป็นค่าเฉลี่ยของสมาชิก
4. ทำซ้ำจน centroid เคลื่อนที่ต่ำกว่า tolerance หรือครบจำนวนรอบ

Objective คือการลด within-cluster sum of squares หรือ inertia:

`Σ_i min_j ||x_i − μ_j||²`

K-Means เหมาะกับกลุ่มที่ค่อนข้าง convex/isotropic และขนาดใกล้กัน ผลไวต่อ scaling, outlier และ initialization จึงควรใช้ k-means++, หลาย restarts และกำหนด random seed เพื่อทำซ้ำได้

### 4.2 เลือก k อย่างมีเหตุผล

- **Elbow**: inertia ลดลงเสมอเมื่อ k เพิ่ม จึงมองหาจุดที่ผลตอบแทนส่วนเพิ่มเริ่มต่ำ
- **Silhouette**: `s=(b-a)/max(a,b)` โดย a คือระยะเฉลี่ยในกลุ่มตน และ b คือระยะเฉลี่ยไปกลุ่มที่ใกล้ที่สุด ค่าใกล้ 1 ดี, ใกล้ 0 คาบเส้นแบ่ง, ติดลบอาจอยู่ผิดกลุ่ม
- **Stability**: เปรียบเทียบผลหลาย seed, bootstrap sample และหลายช่วงเวลา
- **Manageability**: จำนวนกลุ่มต้องไม่เกินความสามารถของทีมในการออกแบบและดูแล action

### 4.3 Profiling ก่อนตั้งชื่อ

ตรวจ centroid, median/IQR, ขนาดกลุ่ม, categorical distribution, outlier และตัวอย่างสมาชิก แล้วตั้งชื่อเชิงพรรณนา เช่น “ซื้อถี่–มูลค่ากลาง–เพิ่งซื้อ” หลีกเลี่ยงการตีตราเจตนาหรือคุณค่าของบุคคล

## 5. Hierarchical Clustering

Agglomerative clustering เริ่มจากแต่ละจุดเป็นหนึ่งกลุ่มแล้วค่อยรวมกัน แสดงผลเป็น dendrogram การตัดต้นไม้ที่ระดับต่างกันทำให้จำนวนกลุ่มต่างกัน Linkage สำคัญ:

- Ward ลดความแปรปรวนภายในกลุ่มและใช้ Euclidean distance
- Complete ใช้ระยะไกลสุดระหว่างคู่สมาชิก
- Average ใช้ระยะเฉลี่ย
- Single ใช้ระยะใกล้สุด แต่อาจเกิด chaining

ข้อดีคือเห็นโครงสร้างซ้อนระดับและใช้สำรวจจำนวนกลุ่มได้ ข้อจำกัดคือไวต่อ linkage/scaling และมีต้นทุนสูงเมื่อข้อมูลใหญ่มาก

## 6. DBSCAN

DBSCAN นิยามกลุ่มจากบริเวณหนาแน่นด้วย `eps` และ `min_samples`:

- จับกลุ่มรูปทรงอิสระ
- ไม่ต้องกำหนดจำนวนกลุ่มล่วงหน้า
- ระบุจุด noise ได้

แต่ผลไวต่อ scale และค่าพารามิเตอร์ และทำงานยากเมื่อแต่ละกลุ่มมีความหนาแน่นต่างกันมาก ควรทดลอง sensitivity และตรวจสัดส่วน noise

## 7. เลือกอัลกอริทึมให้ตรงคำถาม

| เงื่อนไข | K-Means | Hierarchical | DBSCAN |
|---|---|---|---|
| ต้องให้กลุ่มกับข้อมูลใหม่ง่าย | เด่น | ต้องออกแบบเพิ่ม | ไม่ใช่จุดเด่น |
| ต้องเห็นโครงสร้างซ้อนระดับ | ไม่ | เด่น | บางส่วน |
| รูปร่างกลุ่มไม่เป็นทรงกลม | อ่อน | ขึ้นกับ linkage | เด่น |
| ต้องแยก noise | อ่อน | อ่อน | เด่น |
| ข้อมูลใหญ่มาก | เด่น/MiniBatch | ต้องระวัง | ขึ้นกับ index/พารามิเตอร์ |

## 8. Association Rules

### 8.1 นิยามธุรกรรมก่อนหา pattern

หนึ่ง basket อาจเป็นใบเสร็จ, session, ผู้ป่วยหนึ่ง episode หรือเครื่องจักรหนึ่ง time window การเปลี่ยนขอบเขต basket เปลี่ยนความหมายของกฎ ต้องกรอง cancellation/returns, duplicate, test item และสินค้าที่ไม่สามารถ action ได้

### 8.2 เมตริกหลัก

สำหรับกฎ `A → B`:

- `Support(A→B)=P(A∩B)` — กฎครอบคลุมข้อมูลทั้งหมดเท่าไร
- `Confidence(A→B)=P(B|A)=Support(A∩B)/Support(A)`
- `Lift(A→B)=Confidence(A→B)/Support(B)`

ตัวอย่าง 100 baskets: A พบ 20, B พบ 50, A∩B พบ 15

- Support = 15/100 = 0.15
- Confidence = 15/20 = 0.75
- Lift = 0.75/0.50 = 1.50

Lift > 1 คือพบร่วมกันมากกว่าฐานคาดหมาย แต่ยังไม่ใช่เหตุและผล ต้องรายงาน count และช่วงเวลาด้วยเพื่อไม่ให้กฎ rare item ดูเกินจริง

### 8.3 Confidence สูงอาจไร้ค่า

ถ้า B อยู่ใน 90% ของทุก basket กฎ A→B ที่ confidence 92% ดูสูง แต่ lift = 0.92/0.90 ≈ 1.02 แทบไม่เพิ่มข้อมูลจากฐานเดิม จึงต้องอ่าน support, confidence และ lift พร้อมกัน

## 9. Apriori และ FP-Growth

**Apriori** ใช้ downward-closure/anti-monotone: ถ้า itemset ไม่ frequent แล้ว supersets ของมันย่อมไม่ frequent จึง prune candidate ได้ แต่ยังอาจสร้าง candidate จำนวนมากและสแกนข้อมูลหลายรอบ

**FP-Growth** บีบธุรกรรมเป็น FP-tree และหา frequent patterns โดยไม่สร้าง candidate แบบ Apriori เหมาะเมื่อข้อมูลแน่นหรือใหญ่ แต่การตีความและ pruning rules หลังขุดยังจำเป็น

## 10. จากกฎสู่การทดลอง

กฎ `{ผ้าอ้อม}→{เบียร์}` ที่ lift 2.1 อาจเกิดจาก time-of-day, promotion, household composition หรือ selection bias ไม่ควรย้ายชั้นวางทันที ขั้นตอนที่รับผิดชอบ:

1. ตรวจ count, period, returns, store mix และความเสถียรตามเวลา
2. เขียน alternative explanations
3. ระบุ intervention เช่น recommendation หรือ bundle
4. สุ่ม A/B test และกำหนด primary metric เช่น incremental margin
5. ตั้ง guardrail เช่น return rate, complaint, stockout และ fairness
6. deploy เมื่อผลเพิ่มมูลค่าเหนือ baseline และ monitor ต่อเนื่อง

## 11. การผสาน Clustering กับ Association Rules

สามารถทำ basket analysis ภายใน segment เพื่อค้นหากฎเฉพาะกลุ่ม แต่ต้องระวัง sample size ลดลง, multiple comparisons และกฎที่ไม่เสถียร วิธีที่ดีคือแบ่ง discovery/validation period และยืนยัน uplift ด้วย experiment

## 12. ตัวอย่าง 20 Applications

| # | Application | Pattern | Decision ที่สนับสนุน |
|---:|---|---|---|
| 1 | Customer RFM | กลุ่ม recency-frequency-value | campaign/retention |
| 2 | Bank branches | รูปแบบบริการสาขา | staffing/format |
| 3 | Patient pathways | เส้นทางการรับบริการ | care coordination |
| 4 | Student learning | รูปแบบ engagement | tutoring/support |
| 5 | Machine states | operating regimes | maintenance |
| 6 | Traffic | รูปแบบ congestion | signal/route plan |
| 7 | Energy load | load profiles | demand response |
| 8 | Satellite land use | spectral groups | survey prioritization |
| 9 | Documents | topic clusters | search/knowledge routing |
| 10 | Cyber events | event clusters/noise | incident triage |
| 11 | Retail basket | item co-occurrence | bundle/layout test |
| 12 | Web navigation | page/session patterns | UX experiment |
| 13 | Telecom services | plan/add-on bundles | next-best-offer |
| 14 | Clinical co-occurrence | symptom/test sets | pathway review |
| 15 | Insurance claims | code combinations | audit prioritization |
| 16 | Spare parts | parts used together | inventory kits |
| 17 | Course enrollment | subjects taken together | timetable design |
| 18 | Tourism itinerary | destination bundles | package experiment |
| 19 | Fraud events | suspicious sequences | investigation queue |
| 20 | Public services | co-demand by area | integrated service design |

ตัวอย่างทั้งหมดเป็นแบบออกแบบเชิงการสอน ต้องตรวจสิทธิ ความเป็นส่วนตัว ความเหมาะสม และผลกระทบก่อนใช้จริง

## 13. Future Data Mining II

- AI assistant จะช่วยเสนอ feature, k, eps, thresholds และสรุป cluster/rules ได้เร็วขึ้น
- ความได้เปรียบจะย้ายจาก “หา pattern ได้” ไปสู่ “พิสูจน์ pattern และเปลี่ยนเป็น decision ที่วัด uplift ได้”
- ระบบต้องมี lineage ของข้อมูล/feature, reproducibility, stability/drift monitoring และ human oversight
- cluster identity เปลี่ยนตามเวลา จึงต้องมี policy สำหรับ re-fit, mapping และ retirement
- กฎที่ deploy ต้องมี owner, experiment record, guardrails และ rollback

แนวทางกำกับตาม NIST AI RMF คือจัดการความเสี่ยงผ่าน Govern, Map, Measure และ Manage ตลอดวงจรชีวิต

## 14. Checklist ก่อนส่งผลให้ผู้ตัดสินใจ

- [ ] นิยาม unit of analysis และ time window ชัดเจน
- [ ] Scaling/feature weights มีเหตุผลและทำซ้ำได้
- [ ] เปรียบเทียบ algorithm/baseline มากกว่าหนึ่งทาง
- [ ] รายงาน internal metric + stability + domain interpretation
- [ ] กฎมี support/count, confidence, lift และ validation period
- [ ] ระบุ alternative explanations และไม่อ้าง causality เกินหลักฐาน
- [ ] มี action, owner, capacity, experiment, guardrails และ monitoring

