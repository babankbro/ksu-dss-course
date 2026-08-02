import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT="D:/work/KSU/Lecture/DSS/01-Weeks/week06";
const OUT=path.join(ROOT,"Week-06-Data-Mining-II.pptx");
const RENDER=path.join(ROOT,".build","artifact-renders");
const ASSETS=path.join(ROOT,"assets");
const C={white:"#FFFFFF",ink:"#111318",muted:"#56606B",panel:"#EDF0F2",rule:"#B8BCC4",blue:"#246BCE",pale:"#DFF3FC",cyan:"#2CB7DA",amber:"#F2A93B",red:"#C84B4B",green:"#23836B",dark:"#19212A",purple:"#6856D6"};
const FONT="Noto Sans Thai";
const deck=Presentation.create({slideSize:{width:1280,height:720}});

function shape(s,n,l,t,w,h,fill=C.panel,g="rect",stroke="none",sw=0){return s.shapes.add({geometry:g,name:n,position:{left:l,top:t,width:w,height:h},fill,line:{style:"solid",fill:stroke,width:sw}});}
function txt(s,n,text,l,t,w,h,size=24,color=C.ink,bold=false,align="left",valign="top"){const b=s.shapes.add({geometry:"textbox",name:n,position:{left:l,top:t,width:w,height:h},fill:"none",line:{style:"solid",fill:"none",width:0}});b.text=text;b.text.style={fontSize:size,typeface:FONT,color,bold,alignment:align,verticalAlignment:valign};return b;}
function title(s,text,n,kicker="DECISION SUPPORT SYSTEMS • WEEK 06"){txt(s,`k-${n}`,kicker,42,30,900,28,17,C.blue,true);txt(s,`t-${n}`,text,42,70,1195,72,42,C.ink,true);shape(s,`r-${n}`,42,154,1196,2,C.rule);}
function footer(s,n){txt(s,`fl-${n}`,"KSU • Data Mining II",42,676,520,20,13,C.muted);txt(s,`fn-${n}`,String(n).padStart(2,"0"),1180,676,58,20,13,C.muted,false,"right");}
function sources(s,items,note=""){s.speakerNotes.textFrame.setText(`${note}${note?"\n\n":""}[Sources]\n${items.map(x=>`- ${x}`).join("\n")}`);s.speakerNotes.setVisible(true);}
async function bytes(n){return new Uint8Array(await fs.readFile(path.join(ASSETS,n)));}
function image(s,b,alt,l,t,w,h,fit="cover"){return s.images.add({blob:b,contentType:"image/png",alt,fit,position:{left:l,top:t,width:w,height:h},geometry:"rect"});}
function card(s,n,head,body,l,t,w,h,fill=C.panel,accent=C.blue,bs=20){shape(s,n,l,t,w,h,fill);shape(s,`${n}-a`,l,t,8,h,accent);txt(s,`${n}-h`,head,l+27,t+20,w-48,38,24,accent,true);txt(s,`${n}-b`,body,l+27,t+72,w-48,h-88,bs,C.ink);}
function arrow(s,n,l,t,w=54,h=34,color=C.blue){shape(s,n,l,t,w,h,color,"rightArrow");}
function pill(s,n,text,l,t,w,fill=C.pale,color=C.blue){shape(s,n,l,t,w,42,fill,"roundRect");txt(s,`${n}-t`,text,l+10,t+8,w-20,26,18,color,true,"center");}
function dot(s,n,x,y,r=9,fill=C.blue){shape(s,n,x-r,y-r,r*2,r*2,fill,"ellipse");}
const cover=await bytes("data-mining-ii-cover.png");
const landscape=await bytes("clustering-landscape.png");
const assoc=await bytes("association-rules.png");
const apps=await bytes("data-mining-ii-20-applications.png");
const future=await bytes("future-unsupervised-mining.png");

// 1
{
 const s=deck.slides.add();s.background.fill="#061A3A";image(s,cover,"นักวิเคราะห์สำรวจกลุ่มข้อมูลและความสัมพันธ์ของสินค้า",0,0,1280,720);shape(s,"fade",0,0,650,720,"#061A3A");
 txt(s,"ck","WEEK 06 • CLUSTERING & ASSOCIATION RULES",48,52,600,34,19,"#72CBFF",true);
 txt(s,"ct","Data Mining II",48,165,600,80,60,C.white,true);txt(s,"cs","Pattern Discovery → Decision Evidence",48,300,590,48,26,C.white);
 txt(s,"cq","รูปแบบที่พบ ยังไม่ใช่กลุ่มหรือกฎที่ควรใช้",48,485,575,68,25,C.amber,true);txt(s,"cc","รายวิชาระบบสนับสนุนการตัดสินใจ • KSU",48,630,560,28,18,"#C8D7EB");
 sources(s,["Generated illustration: OpenAI ImageGen, 2026 (assets/data-mining-ii-cover.png)."],"เปิดด้วยคำถาม: ถ้า algorithm คืนมา 3 clusters องค์กรมีลูกค้า 3 ประเภทจริงหรือไม่?");
}

// 2
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"10 คำถามที่จะเปลี่ยน Pattern ให้เป็น Decision",2);footer(s,2);
 const l=["1 หน่วยวิเคราะห์คืออะไร?","2 Feature กำหนดความคล้ายอย่างไร?","3 Scale ใดกำลังครอบงำระยะทาง?","4 K-Means converged ไปจุดใด?","5 k ใดทั้งดีและบริหารได้?"];
 const r=["6 กลุ่มเสถียรข้าม seed/เวลาไหม?","7 Algorithm ใดตรงรูปทรงข้อมูล?","8 Support–Confidence–Lift บอกอะไร?","9 Association เป็นเหตุและผลหรือไม่?","10 จะทดลองและ monitor อย่างไร?"];
 shape(s,"ql",52,202,560,400,C.panel);shape(s,"qr",668,202,560,400,C.pale);txt(s,"qlt",l.join("\n"),86,234,500,330,24,C.ink,true);txt(s,"qrt",r.join("\n"),702,234,500,330,24,C.ink,true);
 sources(s,["Week-06-Questions.md in this teaching package."],"ให้ผู้เรียนเลือกหนึ่งคำถามเป็น learning target");
}

// 3
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"3 Clusters ไม่ได้แปลว่า 3 Customer Segments",3);footer(s,3);
 shape(s,"algo",55,210,520,330,C.pale);txt(s,"ah","ALGORITHM OUTPUT",88,242,400,36,25,C.blue,true);txt(s,"ab","Cluster 0 • 1 • 2\n\nแยกตามระยะทางใน feature space\nไม่มีชื่อ • ไม่มีเจตนา • ไม่มี action",88,325,425,150,27,C.ink,true);
 arrow(s,"mid",610,350,60,38,C.amber);shape(s,"decision",705,210,520,330,C.panel);txt(s,"dh","DECISION SEGMENT",738,242,400,36,25,C.red,true);txt(s,"db","มีความหมายเชิงโดเมน\nเสถียรข้ามข้อมูล\nมี owner + capacity + KPI\nผ่านการทดสอบผลของ action",738,325,420,155,27,C.ink,true);
 txt(s,"quote","Cluster label เป็นข้อเสนอให้ตรวจสอบ ไม่ใช่คำอธิบายคนโดยอัตโนมัติ",135,580,1010,42,26,C.red,true,"center");
 sources(s,["scikit-learn, Clustering of unlabeled data, https://scikit-learn.org/stable/modules/clustering.html","Week-06 expanded content in this package."],"แยก algorithmic grouping ออกจาก operational segmentation");
}

// 4
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Unsupervised Learning ไม่มีเฉลย จึงต้องใช้หลักฐาน 3 ชั้น",4);footer(s,4);
 const p=[["TECHNICAL","cohesion • separation\nstability • sample size",C.blue],["DOMAIN","unit • window • semantics\nalternative explanations",C.purple],["DECISION","action • capacity • KPI\nexperiment • monitoring",C.red]];
 p.forEach((v,i)=>card(s,`p-${i}`,v[0],v[1],54+i*408,225,360,280,i===1?C.pale:C.panel,v[2],22));
 txt(s,"gate","ผ่านทั้ง 3 ชั้น → Candidate Decision",250,560,780,54,29,C.green,true,"center");
 sources(s,["NIST AIRC, AI RMF Core, https://airc.nist.gov/airmf-resources/airmf/5-sec-core/","Week-06 expanded content in this package."],"ไม่มี metric เดียวแทนความพร้อมใช้ได้");
}

// 5
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"สองเส้นทางค้นหา Pattern ใช้ Decision Gate เดียวกัน",5);footer(s,5);
 card(s,"c1","CLUSTERING","objects → features → distance\n→ groups/noise\n\nคำถาม: ใครคล้ายใคร?",58,212,490,300,C.pale,C.blue,23);
 card(s,"c2","ASSOCIATION RULES","transactions → itemsets → rules\n→ support/confidence/lift\n\nคำถาม: อะไรเกิดร่วมกัน?",732,212,490,300,C.panel,C.amber,23);
 arrow(s,"a1",555,335,82,40,C.blue);arrow(s,"a2",643,335,82,40,C.amber);
 shape(s,"gate",450,548,380,68,C.dark,"roundRect");txt(s,"gt","VALIDATE → EXPERIMENT → MONITOR",470,567,340,32,22,C.white,true,"center");
 sources(s,["scikit-learn, Clustering, https://scikit-learn.org/stable/modules/clustering.html","mlxtend, Association rules, https://rasbt.github.io/mlxtend/user_guide/frequent_patterns/association_rules/"],"เปรียบเทียบ object-feature matrix กับ transaction-item matrix");
}

// 6
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Feature คือคำตอบล่วงหน้าว่า ‘ความคล้าย’ หมายถึงอะไร",6);footer(s,6);
 shape(s,"rfm",55,205,600,360,C.dark);txt(s,"rh","CUSTOMER @ SNAPSHOT",88,238,450,36,24,C.white,true);
 const rows=[["R","Recency","วันตั้งแต่ซื้อครั้งล่าสุด"],["F","Frequency","จำนวนธุรกรรมที่เข้าเกณฑ์"],["M","Monetary","ยอดสุทธิหลังคืน/ยกเลิก"]];
 rows.forEach((v,i)=>{pill(s,`rp-${i}`,v[0],88,305+i*78,62,i===0?"#FBE9E9":C.pale,i===0?C.red:C.blue);txt(s,`rl-${i}`,v[1],175,309+i*78,150,32,24,C.white,true);txt(s,`rd-${i}`,v[2],330,309+i*78,270,45,20,"#D9E5F0");});
 shape(s,"defs",710,205,520,360,C.pale);txt(s,"dh","นิยามก่อนคำนวณ",745,238,420,36,25,C.blue,true);txt(s,"db","• หน่วยวิเคราะห์\n• snapshot date เดียวกัน\n• observation window\n• returns / cancellation\n• missing / duplicate / outlier\n• เหตุผลของทุก feature",745,310,420,220,24,C.ink,true);
 sources(s,["Week-06 source note and expanded content in this package."],"Frequency ควรนับ invoice ไม่ใช่ line item");
}

// 7
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Scaling เปลี่ยนระยะทาง — จึงเปลี่ยนเส้นแบ่ง Cluster",7);footer(s,7);
 shape(s,"raw",55,210,500,340,C.panel);txt(s,"rt","RAW SCALE",88,242,300,36,25,C.red,true);txt(s,"rb","Monetary  0–50,000\nFrequency  1–50\nRecency    0–365\n\nMonetary ครอบงำ distance",88,330,380,160,28,C.ink,true);
 arrow(s,"sc",595,350,70,40,C.blue);shape(s,"std",705,210,520,340,C.pale);txt(s,"st","TRANSFORM + SCALE",738,242,400,36,25,C.blue,true);txt(s,"sb","log1p สำหรับตัวแปรเบ้\nStandardScaler / RobustScaler\n\nบันทึก pipeline เดียวกัน\nสำหรับข้อมูลใหม่",738,330,410,160,27,C.ink,true);
 txt(s,"note","Scaling ไม่เป็นกลาง — มันกำหนดน้ำหนักเชิงนโยบายของ feature",145,590,990,42,26,C.red,true,"center");
 sources(s,["scikit-learn, Importance of feature scaling, https://scikit-learn.org/stable/auto_examples/preprocessing/plot_scaling_importance.html","scikit-learn, Common pitfalls, https://scikit-learn.org/stable/common_pitfalls.html"],"อย่า normalize ทุกตัวโดยไม่บอกเหตุผล");
}

// 8
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"K-Means วนซ้ำ: Initialize → Assign → Update",8);footer(s,8);
 const p=[["1 INITIALIZE","เลือก k centroids",C.purple],["2 ASSIGN","ไป centroid ใกล้สุด",C.blue],["3 UPDATE","เฉลี่ยสมาชิกใหม่",C.amber],["4 STOP?","centroid ขยับน้อย",C.green]];
 p.forEach((v,i)=>{const x=42+i*309;shape(s,`p-${i}`,x,240,255,230,i%2?C.pale:C.panel);txt(s,`ph-${i}`,v[0],x+22,275,210,34,22,v[2],true);txt(s,`pb-${i}`,v[1],x+22,365,210,55,23,C.ink,true);if(i<3)arrow(s,`pa-${i}`,x+250,335,58,34,v[2]);});
 shape(s,"loop",485,515,310,58,C.dark,"roundRect");txt(s,"loopt","ไม่หยุด → กลับไป ASSIGN",505,531,270,28,20,C.white,true,"center");
 sources(s,["scikit-learn, K-means algorithm, https://scikit-learn.org/stable/modules/clustering.html#k-means"],"ให้ผู้เรียนจำลอง assign-update ด้วยจุด 2 มิติหนึ่งรอบ");
}

// 9
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Objective ลดระยะกำลังสองภายในกลุ่ม",9);footer(s,9);
 shape(s,"math",55,205,560,350,C.dark);txt(s,"mh","INERTIA / WCSS",88,238,400,36,25,C.white,true);txt(s,"mb","Σᵢ minⱼ ||xᵢ − μⱼ||²",88,330,450,62,36,C.amber,true,"center");txt(s,"mc","จุด → centroid ที่ใกล้ที่สุด\nเส้นแบ่งคล้าย Voronoi cells",88,435,450,70,24,"#D9E5F0",true,"center");
 shape(s,"limits",675,205,550,350,C.pale);txt(s,"lh","เมื่อ Objective ไม่ตรงรูปทรง",710,238,455,36,25,C.red,true);txt(s,"lb","• elongated / manifold clusters\n• ขนาดหรือ variance ต่างกันมาก\n• outlier ดึง centroid\n• high dimension ทำให้ distance แยกยาก",710,325,430,180,24,C.ink,true);
 sources(s,["scikit-learn, K-means objective and drawbacks, https://scikit-learn.org/stable/modules/clustering.html#k-means"],"inertia ต่ำกว่าไม่เท่ากับ business value สูงกว่า");
}

// 10
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Initialization ต่างกัน อาจ Converge คนละ Local Minimum",10);footer(s,10);
 const runs=[["RUN A","random seed 7","inertia 1,240",C.blue],["RUN B","random seed 19","inertia 1,165",C.green],["RUN C","random seed 41","inertia 1,310",C.red]];
 runs.forEach((v,i)=>card(s,`r-${i}`,v[0],`${v[1]}\n\n${v[2]}`,54+i*408,225,360,250,i===1?C.pale:C.panel,v[3],23));
 shape(s,"practice",190,535,900,70,C.dark,"roundRect");txt(s,"pt","ใช้ k-means++ • หลาย restarts • random_state • เก็บ distribution ของผล",215,554,850,34,23,C.white,true,"center");
 sources(s,["scikit-learn, K-means initialization and local minima, https://scikit-learn.org/stable/modules/clustering.html#k-means","scikit-learn, KMeans API, https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html"],"ตัวเลขเป็นตัวอย่างสังเคราะห์เพื่ออธิบาย local optimum");
}

// 11
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"เลือก k ด้วยหลักฐานหลายมิติ ไม่ใช่เส้น Elbow เส้นเดียว",11);footer(s,11);
 const p=[["ELBOW","ผลตอบแทนจาก inertia เริ่มลด",C.blue],["SILHOUETTE","cohesion + separation",C.purple],["STABILITY","seed • sample • time",C.green],["CAPACITY","ทีมดูแล action ได้กี่กลุ่ม",C.red]];
 p.forEach((v,i)=>card(s,`k-${i}`,v[0],v[1],54+(i%2)*612,205+Math.floor(i/2)*170,560,135,i===1||i===2?C.pale:C.panel,v[2],22));
 txt(s,"choice","เลือก k ที่ ‘เพียงพอ’ ต่อการตัดสินใจ พร้อมระบุ trade-off",170,585,940,40,26,C.ink,true,"center");
 sources(s,["scikit-learn, Selecting number of clusters with silhouette analysis, https://scikit-learn.org/stable/auto_examples/cluster/plot_kmeans_silhouette_analysis.html","scikit-learn, K-means inertia, https://scikit-learn.org/stable/modules/clustering.html#k-means"],"Elbow อาจไม่ชัด ต้องอธิบาย operational capacity ร่วมด้วย");
}

// 12
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Silhouette อ่านทั้งค่าเฉลี่ยและรูปร่างราย Cluster",12);footer(s,12);
 shape(s,"formula",55,210,500,340,C.dark);txt(s,"fh","s = (b − a) / max(a, b)",85,250,440,55,33,C.white,true,"center");txt(s,"fb","a = ระยะเฉลี่ยในกลุ่มตน\nb = ระยะเฉลี่ยไปกลุ่มเพื่อนบ้าน",85,350,440,90,25,"#D9E5F0",true,"center");
 shape(s,"scale",675,210,550,340,C.pale);txt(s,"sh","−1",715,280,60,35,28,C.red,true);txt(s,"sm","0",925,280,40,35,28,C.amber,true,"center");txt(s,"sp","+1",1120,280,65,35,28,C.green,true,"right");shape(s,"bar1",740,345,205,22,C.red);shape(s,"bar2",945,345,120,22,C.amber);shape(s,"bar3",1065,345,100,22,C.green);txt(s,"sb","อาจอยู่ผิดกลุ่ม        คาบเส้นแบ่ง          แยกชัด",715,400,470,38,21,C.ink,true,"center");
 txt(s,"warn","ค่าเฉลี่ยสูงอาจซ่อน cluster เล็กที่มี silhouette ติดลบ",175,590,930,42,25,C.red,true,"center");
 sources(s,["scikit-learn, silhouette_score, https://scikit-learn.org/stable/modules/generated/sklearn.metrics.silhouette_score.html"],"ดู distribution ราย cluster ไม่ใช่เฉพาะค่าเฉลี่ยเดียว");
}

// 13
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Profile ก่อนตั้งชื่อ — อธิบายพฤติกรรม ไม่ตีตราคน",13);footer(s,13);
 const cols=[["CLUSTER 0","เพิ่งซื้อ • ซื้อถี่\nมูลค่ากลาง","Action: loyalty test",C.blue],["CLUSTER 1","หายไปนาน • เคยซื้อถี่\nมูลค่าสูง","Action: win-back test",C.red],["CLUSTER 2","เพิ่งซื้อ • ซื้อครั้งเดียว\nมูลค่าต่ำ","Action: onboarding test",C.green]];
 cols.forEach((v,i)=>card(s,`c-${i}`,v[0],`${v[1]}\n\n${v[2]}`,54+i*408,220,360,310,i===1?C.pale:C.panel,v[3],22));
 txt(s,"check","ตรวจ median/IQR • size • category mix • examples • outliers • uncertainty",125,580,1030,42,24,C.ink,true,"center");
 sources(s,["Week-06 expanded content in this package."],"ตัวอย่างชื่อกลุ่มเป็นเชิงพรรณนาและไม่อ้างผลเชิงสาเหตุ");
}

// 14
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Stability Test: Seed → Sample → Time",14);footer(s,14);
 const stages=[["SEED","รัน ≥10 ค่า\ncentroid/assignment ใกล้กัน?",C.blue],["SAMPLE","bootstrap/subsample\nกลุ่มยังเกิดหรือไม่?",C.purple],["TIME","rolling snapshots\nprofile/drift เปลี่ยนไหม?",C.amber],["ACTION","KPI/coverage\nยังคุ้มและทำได้ไหม?",C.green]];
 stages.forEach((v,i)=>{const x=42+i*309;card(s,`s-${i}`,v[0],v[1],x,235,255,255,i%2?C.pale:C.panel,v[2],21);if(i<3)arrow(s,`a-${i}`,x+250,345,58,34,v[2]);});
 txt(s,"drop","ถ้ากลุ่มหายเมื่อเปลี่ยน seed หรือเดือน → อย่ารีบ deploy",190,560,900,46,27,C.red,true,"center");
 sources(s,["Week-06 expanded content in this package.","NIST AIRC, AI Risks and Trustworthiness, https://airc.nist.gov/airmf-resources/airmf/3-sec-characteristics/"],"stability เป็นหลักฐานเสริม ไม่ใช่การรับรองความถูกต้องเชิงธุรกิจ");
}

// 15
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Hierarchical Clustering มองเห็นโครงสร้างซ้อนระดับ",15);footer(s,15);
 image(s,landscape,"ภาพเปรียบเทียบกลุ่มแบบ centroid, dendrogram และ density",42,185,760,455,"cover");shape(s,"hp",830,185,400,455,C.panel);txt(s,"hh","AGGLOMERATIVE",862,217,330,34,24,C.blue,true);txt(s,"hb","เริ่มหนึ่งจุดต่อหนึ่งกลุ่ม\nแล้วรวมจากล่างขึ้นบน\n\nLinkage\n• Ward: variance\n• Complete: farthest\n• Average: mean\n• Single: nearest\n\nตัด dendrogram = analyst choice",862,285,330,305,21,C.ink,true);
 sources(s,["scikit-learn, Hierarchical clustering, https://scikit-learn.org/stable/modules/clustering.html#hierarchical-clustering","Generated illustration: OpenAI ImageGen, 2026 (assets/clustering-landscape.png)."],"ภาพเป็น illustration เชิงแนวคิด ไม่ใช่ผลจาก dataset จริง");
}

// 16
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"DBSCAN นิยาม Cluster จากความหนาแน่นและแยก Noise",16);footer(s,16);
 shape(s,"space",55,205,650,365,C.dark);const pts=[[140,300],[165,320],[190,285],[220,335],[245,300],[410,330],[440,300],[470,350],[500,315],[535,345]];pts.forEach((p,i)=>dot(s,`d-${i}`,p[0],p[1],11,i<5?C.cyan:C.amber));[[300,250],[330,450],[575,260],[620,470]].forEach((p,i)=>dot(s,`n-${i}`,p[0],p[1],7,"#C7D0D9"));shape(s,"eps1",120,260,155,120,"none","ellipse",C.cyan,3);shape(s,"eps2",385,270,175,120,"none","ellipse",C.amber,3);
 shape(s,"param",760,205,470,365,C.pale);txt(s,"ph","PARAMETERS",795,238,360,36,25,C.blue,true);txt(s,"pb","eps → รัศมีเพื่อนบ้าน\nmin_samples → ความหนาแน่นขั้นต่ำ\n\nข้อดี: รูปร่างอิสระ • แยก noise\n\nข้อจำกัด\n• ไวต่อ scaling\n• varying density ยาก",795,305,370,225,20,C.ink,true);
 sources(s,["scikit-learn, DBSCAN overview, https://scikit-learn.org/stable/modules/clustering.html#dbscan"],"จุดและรัศมีเป็นภาพสังเคราะห์");
}

// 17
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Algorithm Fit: รูปทรง • Scale • Deployment",17);footer(s,17);
 const heads=["เงื่อนไข","K-MEANS","HIERARCHICAL","DBSCAN"];heads.forEach((v,i)=>{shape(s,`h-${i}`,48+i*298,200,280,55,i?C.blue:C.dark);txt(s,`ht-${i}`,v,58+i*298,215,260,28,20,C.white,true,"center");});
 const rows=[["จำนวนกลุ่ม","กำหนด k","ตัด tree","ค้นจาก density"],["รูปทรง","convex/isotropic","ขึ้นกับ linkage","irregular + noise"],["ข้อมูลใหม่","ง่าย","ต้องออกแบบ","ไม่ใช่จุดเด่น"],["จุดแข็ง","เร็ว/scale ใหญ่","เห็น hierarchy","noise/outlier"]];
 rows.forEach((r,ri)=>r.forEach((v,ci)=>{shape(s,`c-${ri}-${ci}`,48+ci*298,258+ri*74,280,68,ri%2?C.pale:C.panel);txt(s,`ct-${ri}-${ci}`,v,60+ci*298,278+ri*74,256,32,20,ci===0?C.ink:C.blue,ci===0,"center");}));
 txt(s,"final","ไม่มี algorithm ที่ดีที่สุดโดยไม่ระบุ geometry และ decision context",145,585,990,42,25,C.red,true,"center");
 sources(s,["scikit-learn, Overview of clustering methods, https://scikit-learn.org/stable/modules/clustering.html#overview-of-clustering-methods"],"ตารางย่อเพื่อการเลือก ไม่ครอบคลุมทุกเงื่อนไข");
}

// 18
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Association Rules: Transaction → Itemset → Rule → Action",18);footer(s,18);
 image(s,assoc,"ธุรกรรมไหลสู่ frequent itemsets และกฎความสัมพันธ์",42,185,760,455,"cover");shape(s,"flow",830,185,400,455,C.panel);txt(s,"fh","WORKFLOW",862,217,330,34,24,C.blue,true);txt(s,"fb","1 นิยาม basket boundary\n2 กรอง return/cancel/test item\n3 one-hot transactions\n4 frequent itemsets\n5 generate rules\n6 prune redundancy\n7 validate period/segment\n8 design experiment",862,290,330,300,22,C.ink,true);
 sources(s,["mlxtend, Frequent pattern mining API, https://rasbt.github.io/mlxtend/api_subpackages/mlxtend.frequent_patterns/","Generated illustration: OpenAI ImageGen, 2026 (assets/association-rules.png)."],"basket boundary อาจเป็นใบเสร็จ session หรือ episode");
}

// 19
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Support • Confidence • Lift ต้องอ่านพร้อมกัน",19);footer(s,19);
 const m=[["SUPPORT","P(A∩B)","ครอบคลุมข้อมูลเท่าไร",C.blue],["CONFIDENCE","P(B|A)","เมื่อมี A พบ B เท่าไร",C.purple],["LIFT","Conf / P(B)","เหนือ baseline ของ B เท่าไร",C.amber]];
 m.forEach((v,i)=>card(s,`m-${i}`,v[0],`${v[1]}\n\n${v[2]}`,54+i*408,205,360,225,i===1?C.pale:C.panel,v[3],22));
 shape(s,"ex",135,475,1010,115,C.dark,"roundRect");txt(s,"et","100 baskets • A=20 • B=50 • A∩B=15  →  Support .15  |  Confidence .75  |  Lift 1.50",165,505,950,55,24,C.white,true,"center");
 sources(s,["mlxtend, Association rules metrics, https://rasbt.github.io/mlxtend/user_guide/frequent_patterns/association_rules/"],"คำนวณจากตัวอย่างสังเคราะห์ 100 baskets");
}

// 20
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Confidence สูงอาจไม่เพิ่มข้อมูลจาก Baseline",20);footer(s,20);
 shape(s,"base",55,205,520,350,C.pale);txt(s,"bh","BASE RATE OF B",88,238,400,36,25,C.blue,true);txt(s,"bv","90%",88,320,400,90,64,C.blue,true,"center");txt(s,"bb","B ขายดีอยู่แล้ว",88,445,400,36,24,C.ink,true,"center");
 shape(s,"rule",705,205,520,350,C.panel);txt(s,"rh","RULE A → B",738,238,400,36,25,C.red,true);txt(s,"rv","92%",738,320,400,90,64,C.red,true,"center");txt(s,"rb","Confidence สูง แต่ Lift = .92/.90 ≈ 1.02",738,440,400,58,24,C.ink,true,"center");
 txt(s,"take","Lift ≈ 1 → กฎแทบไม่ต่างจากการเดา B ตามความนิยมเดิม",145,590,990,42,26,C.red,true,"center");
 sources(s,["mlxtend, Association rules and lift, https://rasbt.github.io/mlxtend/user_guide/frequent_patterns/association_rules/"],"ตัวเลขเป็นสถานการณ์สังเคราะห์เพื่อแสดง base-rate trap");
}

// 21
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Apriori Prune Candidates • FP-Growth บีบ Pattern ใน Tree",21);footer(s,21);
 card(s,"ap","APRIORI","Downward closure:\nถ้า {A,B} ไม่ frequent\n{A,B,C} ย่อมไม่ frequent\n\n+ เข้าใจง่าย\n− candidate explosion / scans",55,210,520,350,C.panel,C.blue,22);
 card(s,"fp","FP-GROWTH","บีบ transactions เป็น FP-tree\nหา frequent patterns\nโดยไม่สร้าง candidates แบบ Apriori\n\n+ เหมาะข้อมูลแน่น/ใหญ่\n− ยังต้อง prune rules",705,210,520,350,C.pale,C.amber,22);
 sources(s,["mlxtend, Apriori and FP-growth API, https://rasbt.github.io/mlxtend/api_subpackages/mlxtend.frequent_patterns/","Apache Spark, FPGrowth API, https://spark.apache.org/docs/latest/api/java/org/apache/spark/ml/fpm/FPGrowth.html"],"เลือก algorithm ตามขนาด ความหนาแน่น และระบบประมวลผล");
}

// 22
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Association ≠ Causation — ต้องผ่าน Experiment Gate",22);footer(s,22);
 const steps=[["RULE","{diapers} → {beer}\nlift 2.1",C.blue],["CHECK","count • period • store\nreturns • stability",C.purple],["EXPLAIN","time • promotion\nhousehold • selection",C.amber],["A/B TEST","randomize intervention\nincremental margin",C.red],["DEPLOY","guardrail • monitor\nrollback",C.green]];
 steps.forEach((v,i)=>{const x=30+i*249;shape(s,`s-${i}`,x,225,205,280,i===2?C.pale:C.panel);txt(s,`h-${i}`,v[0],x+18,255,169,34,22,v[2],true);txt(s,`b-${i}`,v[1],x+18,350,169,95,19,C.ink,true);if(i<4)arrow(s,`a-${i}`,x+200,335,48,30,v[2]);});
 txt(s,"guard","Primary metric + stockout • return • complaint • fairness guardrails",140,575,1000,42,24,C.ink,true,"center");
 sources(s,["Week-06 source note and expanded content in this package.","NIST AIRC, AI RMF Core, https://airc.nist.gov/airmf-resources/airmf/5-sec-core/"],"กฎ diapers-beer ใช้เป็นกรณีอภิปราย ไม่อ้างว่าเป็นผลทดลองขององค์กรใด");
}

// 23
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"20 Applications: จากกลุ่มและกฎสู่ Decision Design",23);footer(s,23);
 image(s,apps,"ยี่สิบโดเมนการประยุกต์ unsupervised data mining",42,190,635,425,"contain");shape(s,"list",705,188,525,430,C.panel);
 const l=["01 Customer RFM","02 Bank branches","03 Patient pathways","04 Student learning","05 Machine states","06 Traffic patterns","07 Energy load","08 Satellite land","09 Document topics","10 Cyber events"];
 const r=["11 Retail basket","12 Web navigation","13 Telecom bundles","14 Clinical co-occurrence","15 Insurance claims","16 Spare parts","17 Course enrollment","18 Tourism itinerary","19 Fraud sequences","20 Public services"];
 txt(s,"la",l.join("\n"),730,214,225,375,17,C.ink,true);txt(s,"lb",r.join("\n"),970,214,235,375,17,C.ink,true);
 sources(s,["Generated illustration: OpenAI ImageGen, 2026 (assets/data-mining-ii-20-applications.png).","Week-06 expanded content; applications synthesized as instructional design examples."],"ให้แต่ละกลุ่มเลือกหนึ่ง application แล้วนิยาม unit, pattern, action และ validation");
}

// 24
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Future Data Mining: AI เสนอ Pattern — ระบบพิสูจน์ Value",24);footer(s,24);
 image(s,future,"มนุษย์และ AI ร่วมกันสร้างและตรวจรูปแบบก่อนนำไปใช้",42,185,760,455,"cover");shape(s,"fp",830,185,400,455,C.panel);txt(s,"fh","RESPONSIBLE FUTURE",862,217,330,34,24,C.blue,true);txt(s,"fb","AI ช่วยเสนอ\n• feature • k • eps • rules\n\nระบบต้องบันทึก\n• lineage • version • rationale\n\nก่อน deploy\n• stability • drift • fairness\n• experiment • human oversight\n• owner • rollback",862,285,330,305,21,C.ink,true);
 sources(s,["NIST AIRC, AI Risks and Trustworthiness, https://airc.nist.gov/airmf-resources/airmf/3-sec-characteristics/","NIST AIRC, AI RMF Core, https://airc.nist.gov/airmf-resources/airmf/5-sec-core/","Generated illustration: OpenAI ImageGen, 2026 (assets/future-unsupervised-mining.png)."],"ความได้เปรียบย้ายจากหา pattern ไปสู่พิสูจน์ uplift และควบคุมผลกระทบ");
}

// 25
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"ลงมือทำ: พิสูจน์ Cluster และ Rule ก่อนตัดสินใจ",25,"WEEK 06 • NEXT ACTION");footer(s,25);
 shape(s,"l1",54,202,540,356,C.panel);shape(s,"l2",686,202,540,356,C.pale);
 txt(s,"l1n","LAB 01",86,232,180,34,22,C.blue,true);txt(s,"l1h","Customer Segmentation",86,300,450,55,36,C.ink,true);txt(s,"l1b","RFM → transform/scale → k=2..8\nelbow + silhouette + stability\nprofile → action → KPI",86,410,450,115,23,C.muted);
 txt(s,"l2n","LAB 02",718,232,180,34,22,C.blue,true);txt(s,"l2h","Market Basket + Experiment",718,300,450,55,36,C.ink,true);txt(s,"l2b","basket → itemsets → rules → prune\nvalidation period + alternatives\nA/B test + guardrails",718,410,450,115,23,C.muted);
 txt(s,"close","เป้าหมาย: ทุก Pattern มี Evidence, Action, Owner และ Experiment",180,602,920,42,26,C.ink,true,"center");
 sources(s,["Lab-01-Customer-Segmentation.md and Lab-02-Market-Basket-and-Experiment.md."],"Exit ticket: บอกหนึ่งเหตุผลที่ควรทิ้ง cluster หรือ rule แม้ metric ดูดี");
}

await fs.mkdir(RENDER,{recursive:true});
for(const [i,s] of deck.slides.items.entries()){
 const png=await deck.export({slide:s,format:"png",scale:1});
 await fs.writeFile(path.join(RENDER,`slide-${String(i+1).padStart(2,"0")}.png`),new Uint8Array(await png.arrayBuffer()));
 const layout=await s.export({format:"layout"});
 await fs.writeFile(path.join(RENDER,`slide-${String(i+1).padStart(2,"0")}.layout.json`),await layout.text());
}
const montage=await deck.export({format:"webp",montage:true,scale:1});
await fs.writeFile(path.join(ROOT,".build","week06-montage.webp"),new Uint8Array(await montage.arrayBuffer()));
const pptx=await PresentationFile.exportPptx(deck);
await pptx.save(OUT);
console.log(JSON.stringify({output:OUT,slideCount:deck.slides.items.length,renderDir:RENDER}));
