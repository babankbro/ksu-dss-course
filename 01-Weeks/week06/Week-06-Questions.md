# Week 06 — คำถาม 10 ข้อพร้อมแนวคำตอบ

1. **เหตุใด cluster ที่มี silhouette สูงจึงอาจใช้ธุรกิจไม่ได้?**  
   เพราะ metric วัดเรขาคณิต ไม่ได้ยืนยันความหมาย ความยุติธรรม ความเสถียร หรือความสามารถในการออก action

2. **Scaling เปลี่ยนผล K-Means อย่างไร?**  
   ตัวแปรที่มีช่วงกว้างครอบงำ Euclidean distance; scaling จึงเปลี่ยนน้ำหนักและเส้นแบ่งกลุ่ม

3. **K-Means ทำอะไรในหนึ่งรอบ?**  
   Assign จุดไป centroid ใกล้สุด แล้ว update centroid เป็นค่าเฉลี่ยของสมาชิก

4. **เหตุใด inertia อย่างเดียวเลือก k ไม่ได้?**  
   Inertia ลดลงเมื่อ k เพิ่มเสมอ ต้องอ่าน elbow ร่วมกับ silhouette, stability และจำนวน action ที่ทีมดูแลได้

5. **เมื่อใด Hierarchical Clustering เหมาะกว่า K-Means?**  
   เมื่อต้องการสำรวจโครงสร้างซ้อนระดับและยังไม่แน่ใจจำนวนกลุ่ม โดยยอมรับต้นทุนคำนวณและความไวต่อ linkage

6. **DBSCAN มีข้อได้เปรียบและข้อจำกัดหลักอะไร?**  
   จับกลุ่มรูปร่างอิสระและ noise ได้ แต่ไวต่อ scaling, eps/min_samples และยากเมื่อความหนาแน่นต่างกันมาก

7. **คำนวณ Support, Confidence, Lift เมื่อมี 100 baskets, A=20, B=50, A∩B=15**  
   Support=.15, Confidence=.75, Lift=1.50

8. **ทำไม confidence 92% อาจไม่ดี?**  
   ถ้า B มีฐาน 90% lift≈1.02 จึงแทบไม่เพิ่มข้อมูลจาก baseline

9. **Apriori ต่างจาก FP-Growth อย่างไร?**  
   Apriori prune candidates ด้วย downward closure แต่ยังอาจสร้าง candidate มาก; FP-Growth ใช้ FP-tree และไม่สร้าง candidate แบบเดียวกัน

10. **association rule ที่ lift สูงพิสูจน์เหตุและผลหรือไม่?**  
    ไม่ อาจมี confounder/promotion/selection bias ต้องตรวจความเสถียรและทำ experiment ก่อนอ้างผลของ intervention

