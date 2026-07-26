import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT="D:/work/KSU/Lecture/DSS/01-Weeks/week05";
const OUT=path.join(ROOT,"Week-05-Data-Mining-I.pptx");
const RENDER=path.join(ROOT,".build","artifact-renders");
const ASSETS=path.join(ROOT,"assets");
const C={white:"#FFFFFF",ink:"#111318",muted:"#56606B",panel:"#EDF0F2",rule:"#B8BCC4",blue:"#246BCE",pale:"#DFF3FC",amber:"#F2A93B",red:"#C84B4B",green:"#23836B",dark:"#19212A"};
const FONT="Noto Sans Thai";
const deck=Presentation.create({slideSize:{width:1280,height:720}});

function shape(s,n,l,t,w,h,fill=C.panel,g="rect",stroke="none",sw=0){return s.shapes.add({geometry:g,name:n,position:{left:l,top:t,width:w,height:h},fill,line:{style:"solid",fill:stroke,width:sw}});}
function txt(s,n,text,l,t,w,h,size=24,color=C.ink,bold=false,align="left",valign="top"){const b=s.shapes.add({geometry:"textbox",name:n,position:{left:l,top:t,width:w,height:h},fill:"none",line:{style:"solid",fill:"none",width:0}});b.text=text;b.text.style={fontSize:size,typeface:FONT,color,bold,alignment:align,verticalAlignment:valign};return b;}
function title(s,text,n,kicker="DECISION SUPPORT SYSTEMS • WEEK 05"){txt(s,`k-${n}`,kicker,42,30,900,28,17,C.blue,true);txt(s,`t-${n}`,text,42,70,1195,72,42,C.ink,true);shape(s,`r-${n}`,42,154,1196,2,C.rule);}
function footer(s,n){txt(s,`fl-${n}`,"KSU • Data Mining I",42,676,520,20,13,C.muted);txt(s,`fn-${n}`,String(n).padStart(2,"0"),1180,676,58,20,13,C.muted,false,"right");}
function sources(s,items,note=""){s.speakerNotes.textFrame.setText(`${note}${note?"\n\n":""}[Sources]\n${items.map(x=>`- ${x}`).join("\n")}`);s.speakerNotes.setVisible(true);}
async function bytes(n){return new Uint8Array(await fs.readFile(path.join(ASSETS,n)));}
function image(s,b,alt,l,t,w,h,fit="cover"){return s.images.add({blob:b,contentType:"image/png",alt,fit,position:{left:l,top:t,width:w,height:h},geometry:"rect"});}
function bullets(s,items,l,t,w,row=58,size=24,accent=C.blue){items.forEach((v,i)=>{shape(s,`bd-${t}-${i}`,l,t+i*row+11,11,11,accent,"ellipse");txt(s,`bt-${t}-${i}`,v,l+27,t+i*row,w-27,row,size,C.ink);});}
function card(s,n,head,body,l,t,w,h,fill=C.panel,accent=C.blue){shape(s,n,l,t,w,h,fill);shape(s,`${n}-a`,l,t,8,h,accent);txt(s,`${n}-h`,head,l+27,t+20,w-48,36,24,accent,true);txt(s,`${n}-b`,body,l+27,t+74,w-48,h-90,20,C.ink);}
function arrow(s,n,l,t,w=54,h=34,color=C.blue){shape(s,n,l,t,w,h,color,"rightArrow");}
const cover=await bytes("data-mining-cover.png");
const crisp=await bytes("crisp-dm-cycle.png");
const apps=await bytes("data-mining-20-applications.png");
const future=await bytes("future-data-mining.png");

// 1
{
 const s=deck.slides.add();s.background.fill="#F7F9FB";image(s,cover,"นักวิเคราะห์ตรวจเส้นทางการจำแนกข้อมูลเป็นสองผลลัพธ์",0,0,1280,720);shape(s,"fade",0,0,660,720,"#F8FAFC");
 txt(s,"ck","WEEK 05 • CRISP-DM & CLASSIFICATION",48,52,600,34,19,C.blue,true);
 txt(s,"ct","Data Mining I",48,165,600,80,62,C.ink,true);
 txt(s,"cs","Process • Preparation • Models • Metrics",48,305,585,48,26,C.ink);
 txt(s,"cq","จากคะแนนโมเดล → นโยบาย → การตัดสินใจ",48,480,580,44,24,C.red,true);
 txt(s,"cc","รายวิชาระบบสนับสนุนการตัดสินใจ • KSU",48,630,560,28,18,C.muted);
 sources(s,["Generated illustration: OpenAI ImageGen, 2026 (assets/data-mining-cover.png)."],"เปิดด้วยคำถาม: โมเดล Accuracy 98% ใช้งานได้เลยหรือไม่?");
}

// 2
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"10 คำถามที่จะพาเราจากข้อมูลไปสู่การตัดสินใจ",2);footer(s,2);
 const l=["1 ปัญหาธุรกิจและ action คืออะไร?","2 Target และ prediction time ชัดไหม?","3 CRISP-DM วนกลับตรงไหน?","4 Split ก่อน fit เพราะอะไร?","5 Leakage ซ่อนอยู่ใน feature ใด?"];
 const r=["6 Tree เลือก split อย่างไร?","7 ป้องกัน overfit อย่างไร?","8 Naive Bayes สมมติอะไร?","9 Metric ใดตรงต้นทุน FP/FN?","10 Threshold และ monitoring ใครรับผิดชอบ?"];
 shape(s,"ql",52,202,560,400,C.panel);shape(s,"qr",668,202,560,400,C.pale);
 txt(s,"qlt",l.join("\n"),86,234,500,330,25,C.ink,true);txt(s,"qrt",r.join("\n"),702,234,500,330,25,C.ink,true);
 sources(s,["Week-05-Questions.md in this teaching package."],"ให้ผู้เรียนเลือกหนึ่งคำถามเป็น learning target");
}

// 3
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Accuracy 98% อาจหมายถึงโมเดลไม่จับ Positive เลย",3);footer(s,3);
 txt(s,"big","98%",65,215,310,105,74,C.blue,true);txt(s,"sub","Accuracy",65,325,280,44,27,C.muted,true);
 shape(s,"base",430,205,760,305,C.panel);txt(s,"bh","ข้อมูล 10,000 รายการ • Positive 2%",470,240,680,42,29,C.ink,true);
 txt(s,"bb","โมเดลทำนาย Negative ทุกครั้ง\n\nTN = 9,800     FN = 200\nTP = 0             FP = 0",470,325,500,145,28,C.ink,true);
 txt(s,"rec","Recall = 0%",970,350,180,60,38,C.red,true,"center");
 txt(s,"claim","Metric ต้องตอบความเสียหายของการตัดสินใจ ไม่ใช่เพียงคะแนนรวม",135,565,1010,44,27,C.red,true,"center");
 sources(s,["Scenario synthesized for instruction; no empirical result claimed.","scikit-learn, metrics and scoring, https://scikit-learn.org/stable/modules/model_evaluation.html"],"ให้ผู้เรียนคำนวณ confusion matrix ของ baseline ที่ทำนายคลาสใหญ่เสมอ");
}

// 4
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Classification ใน DSS เชื่อม Score กับ Action ผ่าน Policy",4);footer(s,4);
 const f=[["DATA","ข้อมูล ณ เวลาทำนาย"],["MODEL","risk score / class"],["POLICY","threshold + cost"],["ACTION","ผ่าน • ตรวจ • ระงับ"],["EVIDENCE","เหตุผลและผลจริง"]];
 f.forEach((v,i)=>{const x=38+i*249;shape(s,`f-${i}`,x,235,205,230,i===2?C.pale:C.panel);txt(s,`fh-${i}`,v[0],x+18,275,169,32,23,i===2?C.red:C.blue,true);txt(s,`fb-${i}`,v[1],x+18,350,169,70,22,C.ink,true);if(i<4)arrow(s,`fa-${i}`,x+200,330,48,30);});
 txt(s,"audit","ผู้รับผิดชอบต้องมองเห็นนิยามข้อมูล รุ่นโมเดล threshold และผลลัพธ์จริง",125,550,1030,52,25,C.ink,true,"center");
 sources(s,["Course Week-05 source note and expanded content in this vault.","NIST AI RMF Core, https://airc.nist.gov/airmf-resources/airmf/5-sec-core/"],"ย้ำว่าโมเดลไม่ใช่ decision policy ทั้งระบบ");
}

// 5
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"CRISP-DM เป็นวงจรเรียนรู้ ไม่ใช่ขั้นตอนทางเดียว",5);footer(s,5);
 image(s,crisp,"หกระยะของ CRISP-DM เชื่อมเป็นวงจร",70,180,1140,470,"contain");
 sources(s,["IBM, CRISP-DM Help Overview, https://www.ibm.com/docs/en/spss-modeler/18.6.0?topic=dm-crisp-help-overview","Generated illustration: OpenAI ImageGen, 2026 (assets/crisp-dm-cycle.png)."],"ให้ผู้เรียนบอกว่าภาพแต่ละสถานีแทน phase ใดและลูกศรย้อนกลับมีความหมายอย่างไร");
}

// 6
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"แต่ละ Phase ต้องทิ้ง Deliverable ที่ตรวจสอบได้",6);footer(s,6);
 const p=[["1 BUSINESS","objective • action • cost"],["2 DATA","dictionary • quality • bias"],["3 PREP","split • transforms • features"],["4 MODEL","baseline • parameters • version"],["5 EVALUATE","metrics • subgroup • readiness"],["6 DEPLOY","policy • monitoring • rollback"]];
 p.forEach((v,i)=>{const col=i%3,row=Math.floor(i/3);card(s,`p-${i}`,v[0],v[1],54+col*408,205+row*180,360,142,row?C.pale:C.panel,i===4?C.red:C.blue);});
 txt(s,"loop","พบปัญหาเมื่อใด ต้องย้อนกลับไปแก้ phase ที่สร้างสาเหตุ",200,585,880,40,25,C.red,true,"center");
 sources(s,["IBM, CRISP-DM View, https://www.ibm.com/docs/en/spss-modeler/19.0.0?topic=projects-crisp-dm-view","IBM, Deployment Overview, https://www.ibm.com/docs/en/spss-modeler/18.6.0?topic=deployment-overview"],"เชื่อม phase กับ artifact ที่นักศึกษาต้องส่งใน Lab");
}

// 7
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Target ต้องผูกกับเวลา มิฉะนั้น Feature จะเห็นอนาคต",7);footer(s,7);
 shape(s,"line",90,370,1100,5,C.rule);
 const e=[["T−90","ประวัติที่ใช้ได้"],["T0","เวลาทำนาย"],["T+30","ช่วงสังเกต"],["T+90","Target finalized"]];
 e.forEach((v,i)=>{const x=90+i*350;shape(s,`dot-${i}`,x,353,36,36,i===1?C.red:C.blue,"ellipse");txt(s,`et-${i}`,v[0],x-45,275,125,38,27,i===1?C.red:C.blue,true,"center");txt(s,`eb-${i}`,v[1],x-80,420,195,60,23,C.ink,true,"center");});
 txt(s,"bad","Feature ที่เกิดหลัง T0 = คำใบ้จากอนาคต",300,540,680,44,29,C.red,true,"center");
 sources(s,["scikit-learn, common pitfalls and data leakage, https://scikit-learn.org/stable/common_pitfalls.html"],"ให้ผู้เรียนระบุ event time และ availability time ของตัวแปรการชำระเงิน");
}

// 8
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Split ก่อน Fit คือกฎพื้นฐานในการป้องกัน Leakage",8);footer(s,8);
 const steps=[["RAW","ข้อมูลทั้งหมด"],["SPLIT","train • valid • test"],["FIT PREP","เรียนจาก train"],["TRANSFORM","ใช้กฎเดิมกับทุกชุด"],["FIT MODEL","ฝึกและประเมิน"]];
 steps.forEach((v,i)=>{const x=38+i*249;shape(s,`s-${i}`,x,235,205,230,i===2?C.pale:C.panel);txt(s,`sh-${i}`,v[0],x+18,275,169,32,22,i===2?C.red:C.blue,true);txt(s,`sb-${i}`,v[1],x+18,350,169,60,21,C.ink,true);if(i<4)arrow(s,`sa-${i}`,x+200,330,48,30);});
 txt(s,"never","ห้าม fit imputer, scaler, encoder หรือ feature selector ด้วย test data",155,555,970,44,26,C.red,true,"center");
 sources(s,["scikit-learn, common pitfalls and recommended practices, https://scikit-learn.org/stable/common_pitfalls.html","scikit-learn, pipelines and composite estimators, https://scikit-learn.org/stable/modules/compose.html"],"แยก fit กับ transform ให้ชัดเจน");
}

// 9
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Pipeline ผูก Preprocessing กับ Model ให้ทำซ้ำได้",9);footer(s,9);
 shape(s,"code",52,205,640,365,C.dark);txt(s,"sql","Pipeline([\n  ('prep', ColumnTransformer([\n    ('num', impute_scale, numeric),\n    ('cat', impute_onehot, category)\n  ])),\n  ('clf', DecisionTreeClassifier())\n])",82,242,580,275,24,C.white,true);
 shape(s,"why",750,205,480,365,C.pale);txt(s,"wh","PIPELINE GUARDRAILS",785,238,390,36,25,C.blue,true);
 txt(s,"wb","• fit ตามลำดับเดียวกัน\n• cross-validation ไม่รั่ว\n• tune ทุก step ร่วมกัน\n• บันทึก config/version\n• deploy transformation เดิม",785,315,390,205,24,C.ink,true);
 sources(s,["scikit-learn, pipelines and composite estimators, https://scikit-learn.org/stable/modules/compose.html"],"ตัวอย่างโค้ดเป็นโครงร่าง ไม่ใช่ผลทดลอง");
}

// 10
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Data Preparation ทุกขั้นต้องมีเหตุผลและหลักฐาน",10);footer(s,10);
 const a=[["MISSING","ลบ • เติม • indicator"],["ENCODING","one-hot • ordinal"],["SCALE","standardize เมื่อจำเป็น"],["OUTLIER","ตรวจสาเหตุก่อนตัด"],["FEATURE","event time ต้อง ≤ T0"],["IMBALANCE","weight/resample เฉพาะ train"]];
 a.forEach((v,i)=>{const col=i%3,row=Math.floor(i/3);card(s,`a-${i}`,v[0],v[1],54+col*408,205+row*180,360,142,row?C.pale:C.panel,i===4?C.red:C.blue);});
 sources(s,["IBM, Understanding and preparing data, https://www.ibm.com/docs/en/ws-and-kc?topic=modeler-understanding-preparing-data","scikit-learn, preprocessing data, https://scikit-learn.org/stable/modules/preprocessing.html","scikit-learn, imputation, https://scikit-learn.org/stable/modules/impute.html"],"ถามว่าการเติมค่าเฉลี่ยเหมาะกับ missing ทุกชนิดหรือไม่");
}

// 11
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"ข้อมูลไม่สมดุลบังคับให้เราดู Beyond Accuracy",11);footer(s,11);
 shape(s,"dist",60,205,510,370,C.panel);txt(s,"dh","10,000 CASES",95,240,300,38,28,C.blue,true);
 shape(s,"neg",95,335,390,80,C.blue);shape(s,"pos",485,335,20,80,C.red);
 txt(s,"nl","Negative 98%",95,440,220,34,24,C.blue,true);txt(s,"pl","Positive 2%",330,440,175,34,24,C.red,true,"right");
 shape(s,"guide",650,205,570,370,C.pale);txt(s,"gh","EVALUATION CHECK",685,240,400,38,26,C.blue,true);
 txt(s,"gb","• แสดง prevalence และ baseline\n• ใช้ stratified/group/time split\n• ดู Precision–Recall\n• resample เฉพาะ train\n• ตรวจ alert capacity",685,320,450,205,25,C.ink,true);
 sources(s,["scikit-learn, decision tree practical tips, https://scikit-learn.org/stable/modules/tree.html","scikit-learn, metrics and scoring, https://scikit-learn.org/stable/modules/model_evaluation.html"],"เชื่อม class imbalance กับต้นทุนการปฏิบัติงาน");
}

// 12
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Decision Tree แปลงข้อมูลเป็นกฎที่มองเห็นเส้นทางได้",12);footer(s,12);
 shape(s,"stem",638,295,5,38,C.blue);shape(s,"branch",381,330,520,5,C.blue);
 shape(s,"leftarr",360,330,42,60,C.blue,"downArrow");shape(s,"rightarr",878,330,42,60,C.blue,"downArrow");
 shape(s,"root",475,205,330,95,C.pale);txt(s,"rt","late_payments > 2?",500,235,280,34,27,C.blue,true,"center");
 txt(s,"yes","YES",315,342,70,28,19,C.red,true,"center");txt(s,"no","NO",895,342,70,28,19,C.green,true,"center");
 shape(s,"left",150,380,380,150,C.panel);txt(s,"lt","debt_ratio > 0.45?",185,410,310,38,25,C.blue,true,"center");txt(s,"lb","YES → high risk",185,470,310,32,24,C.red,true,"center");
 shape(s,"right",750,380,380,150,C.panel);txt(s,"rr","income stable?",785,410,310,38,25,C.blue,true,"center");txt(s,"rb","YES → lower risk",785,470,310,32,24,C.green,true,"center");
 txt(s,"ex","เส้นทาง IF–THEN อธิบายได้ แต่ต้องจำกัดความลึกและตรวจความเสถียร",145,580,990,40,25,C.ink,true,"center");
 sources(s,["scikit-learn, Decision Trees, https://scikit-learn.org/stable/modules/tree.html"],"กฎเป็นตัวอย่างสังเคราะห์ ไม่ใช่เกณฑ์อนุมัติสินเชื่อจริง");
}

// 13
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Split ที่ดีลด Impurity ของ Node ลูกมากที่สุด",13);footer(s,13);
 shape(s,"math",54,205,560,365,C.dark);txt(s,"mh","GINI / ENTROPY",86,238,380,38,25,C.white,true);
 txt(s,"mb","Gini = 1 − Σ pₖ²\n\nEntropy = −Σ pₖ log₂(pₖ)\n\nGain = impurity ก่อน\n       − weighted impurity หลัง",86,315,450,220,27,C.white,true);
 shape(s,"examp",670,205,560,365,C.pale);txt(s,"eh","ตัวอย่าง Node: 50 Positive / 50 Negative",705,238,470,38,24,C.blue,true);
 txt(s,"eb","ก่อน split: Gini = 0.50\n\nหลัง split:\nLeft  40/10 → Gini 0.32\nRight 10/40 → Gini 0.32\n\nGini decrease = 0.18",705,310,440,230,25,C.ink,true);
 sources(s,["scikit-learn, Decision Tree mathematical formulation, https://scikit-learn.org/stable/modules/tree.html"],"ให้ผู้เรียนคำนวณ weighted impurity ของ split อีกชุด");
}

// 14
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Tree ลึกจำ Training Data ได้ดี แต่ Generalize แย่ลง",14);footer(s,14);
 shape(s,"shallow",62,210,520,340,C.panel);txt(s,"sh","SHALLOW TREE",92,240,320,38,28,C.blue,true);txt(s,"sb","กฎน้อย • เสถียรกว่า\nอาจ underfit\n\nตรวจ validation gap",92,330,400,155,26,C.ink,true);
 shape(s,"deep",698,210,520,340,C.pale);txt(s,"dh","DEEP TREE",728,240,320,38,28,C.red,true);txt(s,"db","กฎมาก • leaf เล็ก\nเสี่ยง overfit\n\nใช้ max_depth • min_samples_leaf • pruning",728,330,420,155,25,C.ink,true);
 txt(s,"cv","เลือกความซับซ้อนจาก validation/cross-validation ไม่ใช่ training score",155,590,970,40,25,C.ink,true,"center");
 sources(s,["scikit-learn, Decision Trees advantages and disadvantages, https://scikit-learn.org/stable/modules/tree.html"],"เปรียบเทียบ train score กับ validation score เมื่อเพิ่ม max_depth");
}

// 15
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Naive Bayes เป็น Baseline ที่เร็ว แต่ Probability อาจไม่ Calibrate",15);footer(s,15);
 shape(s,"formula",54,205,590,365,C.dark);txt(s,"fh","BAYES + CONDITIONAL INDEPENDENCE",86,238,500,36,23,C.white,true);
 txt(s,"fb","P(y|x₁…xₙ) ∝ P(y) ∏ P(xᵢ|y)\n\nprior × likelihoods → posterior\n\nเลือก class ที่ posterior สูงสุด",86,325,500,185,26,C.white,true);
 shape(s,"types",700,205,530,365,C.pale);txt(s,"th","เลือก Variant ให้ตรง Representation",735,238,430,36,24,C.blue,true);
 txt(s,"tb","GaussianNB → continuous\nMultinomialNB → counts/text\nBernoulliNB → binary\nComplementNB → imbalanced text\n\nหากใช้ probability เป็น risk\nต้องตรวจ calibration",735,310,420,230,24,C.ink,true);
 sources(s,["scikit-learn, Naive Bayes, https://scikit-learn.org/stable/modules/naive_bayes.html","scikit-learn, probability calibration, https://scikit-learn.org/stable/modules/calibration.html"],"ชี้ว่าความเร็วและความแม่นของ class ไม่ได้แปลว่า probability ตรงความถี่จริง");
}

// 16
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Confusion Matrix แยกความผิดพลาดเป็นสี่ชนิด",16);footer(s,16);
 txt(s,"pred","PREDICTED",420,205,650,36,24,C.blue,true,"center");txt(s,"actual","ACTUAL",50,390,180,36,24,C.blue,true,"center");
 const cells=[["TP","จับ Positive ได้","40",C.pale],["FN","พลาด Positive","20","#FBE9E9"],["FP","เตือนเกิน","10","#FFF1D8"],["TN","ผ่าน Negative","930",C.panel]];
 cells.forEach((v,i)=>{const x=300+(i%2)*420,y=255+Math.floor(i/2)*160;shape(s,`cm-${i}`,x,y,360,125,v[3]);txt(s,`ch-${i}`,v[0],x+22,y+18,80,32,27,i===1?C.red:C.blue,true);txt(s,`cv-${i}`,v[2],x+260,y+18,70,38,31,C.ink,true,"right");txt(s,`cb-${i}`,v[1],x+22,y+72,260,30,22,C.ink);});
 txt(s,"metrics","Precision = 40/50 = 0.80     Recall = 40/60 = 0.667",240,590,800,40,25,C.red,true,"center");
 sources(s,["scikit-learn, confusion matrix, https://scikit-learn.org/stable/modules/generated/sklearn.metrics.confusion_matrix.html","scikit-learn, metrics and scoring, https://scikit-learn.org/stable/modules/model_evaluation.html"],"ให้นักศึกษาคำนวณ F1 จาก Precision และ Recall");
}

// 17
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Threshold คือ Policy ที่แลก Recall กับ False Alarms",17);footer(s,17);
 const p=[["≥ 0.80","AUTO-HOLD","เสี่ยงสูง • หลักฐานพร้อม"],["0.50–0.79","MANUAL REVIEW","จำกัดตาม capacity"],["< 0.50","PASS + MONITOR","บันทึกและติดตามผล"]];
 p.forEach((v,i)=>card(s,`p-${i}`,v[0],`${v[1]}\n\n${v[2]}`,54+i*408,220,360,300,i===1?C.pale:C.panel,i===0?C.red:C.blue));
 txt(s,"cost","เลือกจาก FN cost • FP cost • reviewer capacity • calibration • subgroup impact",115,575,1050,46,25,C.ink,true,"center");
 sources(s,["scikit-learn, tuning the decision threshold, https://scikit-learn.org/stable/modules/classification_threshold.html","scikit-learn, probability calibration, https://scikit-learn.org/stable/modules/calibration.html"],"0.5 เป็นค่าเริ่มต้นของบาง classifier ไม่ใช่คำตอบทางธุรกิจ");
}

// 18
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"20 Applications ต่างกันที่ Target, Cost และ Human Review",18);footer(s,18);
 image(s,apps,"ภาพรวมยี่สิบโดเมนที่ใช้ classification",42,188,650,430,"contain");
 shape(s,"list",720,188,510,430,C.panel);
 const l=["01 Credit default","02 Card fraud","03 Insurance claim","04 Hospital triage","05 Readmission","06 Pharmacy safety","07 Telecom churn","08 Lead qualification","09 Email spam","10 Support routing"];
 const r=["11 Cyber intrusion","12 Predictive maintenance","13 Manufacturing defect","14 Delivery exception","15 Energy fault","16 Crop disease","17 Student risk","18 Benefit eligibility","19 Environmental alert","20 Employee attrition"];
 txt(s,"la",l.join("\n"),748,212,218,385,17,C.ink,true);txt(s,"lb",r.join("\n"),974,212,230,385,17,C.ink,true);
 sources(s,["Generated illustration: OpenAI ImageGen, 2026 (assets/data-mining-20-applications.png).","Week-05 expanded content; applications synthesized as instructional design examples."],"ให้แต่ละกลุ่มเลือกหนึ่ง application แล้วระบุ positive class, prediction time, FP/FN cost และ reviewer");
}

// 19
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Future Data Mining คือระบบที่ช่วยสร้างและเฝ้าระวัง Model",19);footer(s,19);
 image(s,future,"นักวิเคราะห์และ AI ร่วมกันสร้าง ตรวจ และเฝ้าระวังโมเดล",42,184,760,455,"cover");shape(s,"fp",830,184,400,455,C.panel);
 txt(s,"fph","RESPONSIBLE LOOP",862,215,330,34,24,C.blue,true);
 txt(s,"fpb","• shared target/feature definitions\n• AI-assisted candidate pipelines\n• cost-aware threshold\n• drift + outcome monitoring\n• subgroup evaluation\n• lineage + permissions\n• human review + appeal",862,285,330,250,21,C.ink,true);
 txt(s,"fpq","AI เสนอ Candidate\nมนุษย์รับผิดชอบ Decision",862,555,330,62,23,C.red,true);
 sources(s,["NIST AI RMF 1.0, https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf","NIST AIRC, AI Risks and Trustworthiness, https://airc.nist.gov/airmf-resources/airmf/3-sec-characteristics/","Generated illustration: OpenAI ImageGen, 2026 (assets/future-data-mining.png)."],"Future Data Mining ไม่จบที่ AutoML แต่รวม governance, monitoring และ human oversight");
}

// 20
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"ลงมือทำ: สร้าง Pipeline แล้วเลือก Policy ที่รับผิดชอบได้",20,"WEEK 05 • NEXT ACTION");footer(s,20);
 shape(s,"l1",54,202,540,356,C.panel);shape(s,"l2",686,202,540,356,C.pale);
 txt(s,"l1n","LAB 01",86,232,180,34,22,C.blue,true);txt(s,"l1h","Classification Pipeline",86,300,450,55,38,C.ink,true);txt(s,"l1b","split → preprocessing → Tree/NB\nconfusion matrix + leakage audit\nบันทึก pipeline/version",86,410,450,115,23,C.muted);
 txt(s,"l2n","LAB 02",718,232,180,34,22,C.blue,true);txt(s,"l2h","Threshold & Monitoring",718,300,450,55,38,C.ink,true);txt(s,"l2b","คำนวณ expected error cost\nออกแบบ 3-level policy\nsubgroup + monitoring plan",718,410,450,115,23,C.muted);
 txt(s,"close","เป้าหมาย: ทุกโมเดลมี Target, Time, Metric, Policy และ Owner",180,602,920,42,26,C.ink,true,"center");
 sources(s,["Lab-01-Classification-Pipeline.md and Lab-02-Cost-Sensitive-Threshold-and-Monitoring.md."],"ปิดด้วย exit ticket: ระบุ leakage risk และ metric ที่สำคัญที่สุดใน application ของตน");
}

await fs.mkdir(RENDER,{recursive:true});
for(const [i,s] of deck.slides.items.entries()){
 const png=await deck.export({slide:s,format:"png",scale:1});
 await fs.writeFile(path.join(RENDER,`slide-${String(i+1).padStart(2,"0")}.png`),new Uint8Array(await png.arrayBuffer()));
 const layout=await s.export({format:"layout"});
 await fs.writeFile(path.join(RENDER,`slide-${String(i+1).padStart(2,"0")}.layout.json`),await layout.text());
}
const montage=await deck.export({format:"webp",montage:true,scale:1});
await fs.writeFile(path.join(ROOT,".build","week05-montage.webp"),new Uint8Array(await montage.arrayBuffer()));
const pptx=await PresentationFile.exportPptx(deck);
await pptx.save(OUT);
console.log(JSON.stringify({output:OUT,slideCount:deck.slides.items.length,renderDir:RENDER}));
