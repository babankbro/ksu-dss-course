# Lab 01 — Classification Pipeline ที่ป้องกัน Leakage

## เป้าหมาย

สร้าง pipeline จำแนกความเสี่ยงผิดนัด เปรียบเทียบ Decision Tree กับ Naive Bayes และอธิบายผลด้วย confusion matrix

## ชุดข้อมูลที่ต้องมี

แต่ละแถวแทนผู้สมัครหนึ่งราย ณ วันที่ตัดสินใจ:

- `application_date`
- `customer_id`
- `age`
- `monthly_income`
- `debt_ratio`
- `late_payments_12m`
- `employment_type`
- `region`
- `default_90d` — target

เพิ่มตัวแปร `days_after_application_to_first_late_payment` เพื่อใช้เป็นตัวอย่าง leakage แต่ห้ามใช้ฝึกจริง

## งาน

1. เขียน business question, unit of analysis, prediction time และ target definition
2. ตรวจ missing, duplicate, distribution และ class prevalence
3. แบ่ง train/test โดย stratify target และอธิบายว่าเหตุใดต้อง split ก่อน fit preprocessing
4. สร้าง numeric pipeline: imputation และ scaling
5. สร้าง categorical pipeline: imputation และ one-hot encoding
6. รวมด้วย `ColumnTransformer`
7. ฝึก Decision Tree อย่างน้อย 2 ค่า `max_depth`
8. ฝึก GaussianNB หรือ ComplementNB ตาม representation ที่เลือก
9. แสดง confusion matrix, Accuracy, Precision, Recall และ F1
10. เลือกโมเดลโดยอ้างอิงต้นทุน FP/FN ไม่ใช่คะแนนเดียว
11. พิสูจน์ว่า feature ตัวอย่าง leakage ทำให้คะแนนดูดีเกินจริง แล้วถอดออก
12. บันทึก pipeline, feature list, split rule และ random seed

## โครงร่างโค้ด

```python
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier

numeric_pipe = Pipeline([
    ("impute", SimpleImputer(strategy="median")),
    ("scale", StandardScaler())
])

category_pipe = Pipeline([
    ("impute", SimpleImputer(strategy="most_frequent")),
    ("encode", OneHotEncoder(handle_unknown="ignore"))
])

prep = ColumnTransformer([
    ("num", numeric_pipe, numeric_features),
    ("cat", category_pipe, categorical_features)
])

model = Pipeline([
    ("prep", prep),
    ("clf", DecisionTreeClassifier(max_depth=4, random_state=42))
])
```

## สิ่งที่ส่ง

- notebook/script ที่ทำซ้ำได้
- confusion matrix ของแต่ละโมเดล
- ตาราง metric และ baseline
- leakage audit 1 หน้า
- ข้อเสนอ deployment action 3–5 บรรทัด

## เกณฑ์ประเมิน

| ด้าน | คะแนน |
|---|---:|
| นิยามปัญหาและ target | 20 |
| split/preprocessing ถูกต้อง | 25 |
| โมเดลและการทำซ้ำ | 20 |
| metric และการตีความ | 20 |
| leakage audit และข้อเสนอ | 15 |
