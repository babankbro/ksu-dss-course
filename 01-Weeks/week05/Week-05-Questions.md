# Week 05 — คำถาม 10 ข้อพร้อมแนวคำตอบ

## 1. เพราะเหตุใด Data Mining project จึงต้องเริ่มจาก Business Understanding?

**แนวคำตอบ:** เพราะ target, success metric, ต้นทุนข้อผิดพลาดและ action ต้องมาจากการตัดสินใจทางธุรกิจ หากนิยามเหล่านี้ผิด โมเดลแม่นเพียงใดก็ไม่แก้ปัญหาที่ต้องการ

## 2. ระบุ CRISP-DM ทั้ง 6 ระยะและยกตัวอย่างการวนกลับหนึ่งกรณี

**แนวคำตอบ:** Business Understanding, Data Understanding, Data Preparation, Modeling, Evaluation, Deployment ตัวอย่าง: evaluation พบว่า Recall ไม่พอ จึงย้อนกลับไปปรับ target/feature หรือ modeling

## 3. Data leakage คืออะไร และเหตุใดจึงทำให้คะแนนดีเกินจริง?

**แนวคำตอบ:** การใช้ข้อมูลที่ไม่มี ณ เวลาทำนายหรือข้อมูล test ในการเรียนรู้ ทำให้โมเดลเห็นคำใบ้จากอนาคตและไม่สามารถทำซ้ำคะแนนนั้นกับข้อมูลใหม่

## 4. เหตุใดต้อง split ก่อน fit imputer, scaler หรือ encoder?

**แนวคำตอบ:** เพื่อให้สถิติและ vocabulary ของ preprocessing มาจาก train เท่านั้น แล้วใช้ transformation เดิมกับ validation/test

## 5. Decision Tree เลือก split อย่างไร?

**แนวคำตอบ:** เลือก feature/threshold ที่ลด weighted impurity เช่น Gini หรือ Entropy ได้มากที่สุด แล้วแบ่งซ้ำจนถึง stopping rule

## 6. วิธีลด overfitting ของ Decision Tree มีอะไรบ้าง?

**แนวคำตอบ:** จำกัด `max_depth`, เพิ่ม `min_samples_leaf`, pruning, cross-validation และลด feature ที่เป็น noise/leakage

## 7. สมมติฐาน “naive” ของ Naive Bayes คืออะไร?

**แนวคำตอบ:** feature แต่ละตัวเป็นอิสระต่อกันแบบมีเงื่อนไขเมื่อทราบคลาส แม้ไม่จริงทั้งหมดก็เป็น baseline ที่เร็วและมีประโยชน์

## 8. ถ้า TP=40, FP=10, FN=20, TN=930 จงคำนวณ Precision และ Recall

**แนวคำตอบ:** Precision = 40/(40+10) = 0.80; Recall = 40/(40+20) ≈ 0.667

## 9. เหตุใด Accuracy อาจไม่เหมาะกับ fraud detection?

**แนวคำตอบ:** positive class มีน้อย โมเดลทำนาย negative ทุกครั้งอาจ Accuracy สูงแต่จับ fraud ไม่ได้ ต้องดู Recall, Precision, PR curve และต้นทุน

## 10. Threshold ควรถูกเลือกจากอะไร?

**แนวคำตอบ:** ต้นทุน FP/FN, capacity การตรวจสอบ, severity, calibration, subgroup impact และ policy ขององค์กร ไม่ควรใช้ 0.5 โดยอัตโนมัติ
