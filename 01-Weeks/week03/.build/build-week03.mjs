import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT="D:/work/KSU/Lecture/DSS/01-Weeks/week03";
const OUT=path.join(ROOT,"Week-03-Data-Management-and-Warehouse.pptx");
const RENDER=path.join(ROOT,".build","artifact-renders");
const ASSETS=path.join(ROOT,"assets");
const C={white:"#FFFFFF",ink:"#111318",muted:"#56606B",panel:"#EDF0F2",rule:"#B8BCC4",cyan:"#6DCBF4",blue:"#246BCE",pale:"#DFF3FC",amber:"#F2A93B",red:"#C84B4B",green:"#23836B",brown:"#9A5B3F"};
const FONT="Noto Sans Thai";
const deck=Presentation.create({slideSize:{width:1280,height:720}});

function shape(s,n,l,t,w,h,fill=C.panel,g="rect",stroke="none",sw=0){return s.shapes.add({geometry:g,name:n,position:{left:l,top:t,width:w,height:h},fill,line:{style:"solid",fill:stroke,width:sw}});}
function txt(s,n,text,l,t,w,h,size=24,color=C.ink,bold=false,align="left",valign="top"){
 const b=s.shapes.add({geometry:"textbox",name:n,position:{left:l,top:t,width:w,height:h},fill:"none",line:{style:"solid",fill:"none",width:0}});
 b.text=text;b.text.style={fontSize:size,typeface:FONT,color,bold,alignment:align,verticalAlignment:valign};return b;
}
function title(s,text,n,kicker="DECISION SUPPORT SYSTEMS • WEEK 03"){txt(s,`k-${n}`,kicker,42,30,900,28,17,C.blue,true);txt(s,`t-${n}`,text,42,70,1195,72,42,C.ink,true);shape(s,`r-${n}`,42,154,1196,2,C.rule);}
function footer(s,n){txt(s,`fl-${n}`,"KSU • Data Management for DSS",42,676,500,20,13,C.muted);txt(s,`fn-${n}`,String(n).padStart(2,"0"),1180,676,58,20,13,C.muted,false,"right");}
function sources(s,items,note=""){s.speakerNotes.textFrame.setText(`${note}${note?"\n\n":""}[Sources]\n${items.map(x=>`- ${x}`).join("\n")}`);s.speakerNotes.setVisible(true);}
async function bytes(n){return new Uint8Array(await fs.readFile(path.join(ASSETS,n)));}
function image(s,b,alt,l,t,w,h,fit="cover"){return s.images.add({blob:b,contentType:"image/png",alt,fit,position:{left:l,top:t,width:w,height:h},geometry:"rect"});}
function bullets(s,items,l,t,w,row=64,size=25,accent=C.blue){items.forEach((v,i)=>{shape(s,`bd-${t}-${i}`,l,t+i*row+11,11,11,accent,"ellipse");txt(s,`bt-${t}-${i}`,v,l+27,t+i*row,w-27,row,size,C.ink);});}
function card(s,n,head,body,l,t,w,h,fill=C.panel,accent=C.blue){
 shape(s,n,l,t,w,h,fill);shape(s,`${n}-a`,l,t,8,h,accent);txt(s,`${n}-h`,head,l+27,t+20,w-48,36,24,accent,true);txt(s,`${n}-b`,body,l+27,t+74,w-48,h-90,20,C.ink);
}
function arr(s,n,l,t,w=54,h=34){shape(s,n,l,t,w,h,C.blue,"rightArrow");}

const cover=await bytes("data-warehouse-cover.png");
const contrast=await bytes("oltp-vs-warehouse.png");
const star=await bytes("retail-star-schema.png");
const future=await bytes("future-data-architecture.png");

// 1
{
 const s=deck.slides.add();s.background.fill="#F7F9FB";image(s,cover,"ข้อมูลจากหลายระบบไหลเข้าสู่คลังข้อมูลสำหรับการตัดสินใจ",0,0,1280,720);
 shape(s,"cover-fade",0,0,650,720,"#F8FAFC");txt(s,"ck","WEEK 03 • DATA FOUNDATION",48,52,550,34,19,C.blue,true);
 txt(s,"ct","Data Management\n& Data Warehouse",48,154,590,180,63,C.ink,true);
 txt(s,"cs","OLTP • ETL/ELT • Star Schema • Future Data",48,390,580,62,25,C.ink);
 txt(s,"cq","หนึ่งแถวคืออะไร — และยอดใดต้องเท่ากัน?",48,510,570,42,24,C.red,true);
 txt(s,"cc","รายวิชาระบบสนับสนุนการตัดสินใจ • KSU",48,630,560,28,18,C.muted);
 sources(s,["Generated illustration: OpenAI ImageGen, 2026 (assets/data-warehouse-cover.png)."],"เปิดด้วยกรณีฝ่ายขาย บัญชี และ dashboard รายงานยอดขายไม่เท่ากัน");
}
// 2
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"วันนี้เราจะตอบ 5 คำถาม",2);footer(s,2);
 bullets(s,["ทำไมงานวิเคราะห์ต้องแยกจาก OLTP?","จะพิสูจน์ว่าข้อมูลผ่าน ETL โดยไม่สูญหายได้อย่างไร?","เหตุใด Grain จึงต้องมาก่อน Fact และ Dimension?","เมื่อใดควรใช้ Star, Snowflake, Lake หรือ Lakehouse?","ข้อมูลแบบใดพร้อมให้ BI, ML และ AI ใช้ร่วมกัน?"],80,195,1090,82,29);
 sources(s,["Course Week-03 source note and expanded content in this vault."],"ให้นักศึกษาเลือกคำถามที่ตนยังตอบไม่ได้หนึ่งข้อ");
}
// 3
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"ตัวเลขเดียวกันอาจมีหลายความหมาย",3);footer(s,3);
 const vals=[["ฝ่ายขาย","9.8 M","วันสั่งซื้อ"],["บัญชี","9.2 M","วันรับรู้รายได้"],["Dashboard","10.1 M","ยังไม่หักคืนสินค้า"]];
 vals.forEach((v,i)=>{const x=60+i*400;shape(s,`v-${i}`,x,215,350,265,i===1?C.pale:C.panel);txt(s,`vh-${i}`,v[0],x+28,240,294,34,24,C.blue,true);txt(s,`vv-${i}`,v[1],x+28,304,294,76,52,C.ink,true);txt(s,`vn-${i}`,v[2],x+28,416,294,30,20,C.muted);});
 txt(s,"take","Data Warehouse สร้างนิยามร่วม ประวัติ และหลักฐานการคำนวณ",145,545,990,54,28,C.red,true,"center");
 sources(s,["Scenario synthesized for instruction; no empirical values claimed."],"ถามว่าตัวเลขใดถูก แล้วชี้ว่าคำถามยังขาด semantic definition");
}
// 4
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"OLTP และ Analytics ถูกออกแบบให้ทำงานคนละแบบ",4);footer(s,4);
 shape(s,"oltp",54,205,520,350,C.panel);txt(s,"oh","OLTP",84,232,180,40,29,C.blue,true);txt(s,"ob","งาน: insert / update เล็กและถี่\nเป้าหมาย: transaction ถูกต้อง\nแบบจำลอง: normalized\nเวลา: สถานะปัจจุบัน\nผู้ใช้: ระบบปฏิบัติการ",84,308,430,190,25,C.ink,true);
 shape(s,"dw",706,205,520,350,C.pale);txt(s,"dh","ANALYTICAL WAREHOUSE",736,232,420,40,27,C.red,true);txt(s,"db","งาน: scan / join / aggregate\nเป้าหมาย: แนวโน้มและทางเลือก\nแบบจำลอง: dimensional\nเวลา: ประวัติหลายปี\nผู้ใช้: BI • DSS • ML",736,308,430,190,25,C.ink,true);
 txt(s,"sep","แยก workload เพื่อไม่ให้คำถามเชิงวิเคราะห์กระทบการขายจริง",160,588,960,38,24,C.ink,true,"center");
 sources(s,["Microsoft Learn, WideWorldImportersDW, https://learn.microsoft.com/en-us/sql/samples/wide-world-importers-dw-database-catalog"],"เปรียบเทียบ query หนึ่งรายการขายกับยอดรวมสามปี");
}
// 5
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"ระบบธุรกรรมป้อนข้อมูล — คลังข้อมูลอธิบายอดีต",5);footer(s,5);
 image(s,contrast,"ภาพเปรียบเทียบระบบธุรกรรมกับคลังข้อมูลเชิงวิเคราะห์",56,184,1168,460,"contain");
 sources(s,["Generated illustration: OpenAI ImageGen, 2026 (assets/oltp-vs-warehouse.png).","Microsoft Learn, dimensional modeling overview, https://learn.microsoft.com/en-us/fabric/data-warehouse/dimensional-modeling-overview"],"ให้ผู้เรียนชี้ workload, data model และผู้ใช้ของแต่ละฝั่ง");
}
// 6
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"คลังข้อมูลที่ดีรักษาบริบทข้ามระบบและข้ามเวลา",6);footer(s,6);
 const q=[["SUBJECT","จัดตามเรื่องธุรกิจ\nลูกค้า • ยอดขาย"],["INTEGRATED","รหัส หน่วย นิยาม\nสอดคล้องกัน"],["TIME-VARIANT","เก็บวันที่และประวัติ\nเพื่อเปรียบเทียบ"],["NON-VOLATILE","เปลี่ยนอย่างควบคุม\nย้อนตรวจได้"]];
 q.forEach((v,i)=>card(s,`q-${i}`,v[0],v[1],45+i*304,220,270,310,i===1?C.pale:C.panel,i===3?C.red:C.blue));
 txt(s,"nv","Non-volatile ≠ ห้ามแก้ • ต้องแก้แบบมีเวอร์ชันและหลักฐาน",170,580,940,42,25,C.red,true,"center");
 sources(s,["IBM Research, data warehouse characteristics, https://dominoweb.draco.res.ibm.com/reports/rc23184.pdf"],"ใช้ตัวอย่างรหัสจังหวัดต่างกันระหว่าง POS และ CRM เพื่ออธิบาย Integrated");
}
// 7
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Pipeline ที่เชื่อถือได้ต้องมีทางออกสำหรับข้อมูลผิด",7);footer(s,7);
 const stages=[["EXTRACT","batch • CDC\nbatch_id + time"],["PROFILE","schema • null\nrow count"],["TRANSFORM","clean • map\ndeduplicate"],["LOAD","dimension → fact\nidempotent"],["RECONCILE","rows • totals\nrejects"]];
 stages.forEach((v,i)=>{const x=36+i*249;shape(s,`p-${i}`,x,235,205,230,i===4?C.pale:C.panel);txt(s,`ph-${i}`,v[0],x+18,260,169,32,21,i===4?C.red:C.blue,true);txt(s,`pb-${i}`,v[1],x+18,335,169,78,21,C.ink,true);if(i<4)arr(s,`pa-${i}`,x+200,330,48,30);});
 shape(s,"reject",420,515,440,72,"#F7E5E5");txt(s,"rt","QUARANTINE: เก็บ record + reason + source",445,535,390,32,22,C.red,true,"center");
 sources(s,["Microsoft Learn, Modern Data Warehouse, https://learn.microsoft.com/en-us/data-engineering/playbook/solutions/modern-data-warehouse/"],"ย้ำว่า rejected record ไม่ควรถูกทิ้งเงียบ");
}
// 8
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"ETL และ ELT ต่างลำดับ — แต่ไม่ต่างเรื่องความรับผิดชอบ",8);footer(s,8);
 txt(s,"etl","ETL",62,215,200,52,39,C.blue,true);txt(s,"etlf","Extract → Transform → Load",62,292,510,44,29,C.ink,true);txt(s,"etlb","แปลงก่อนเข้าคลัง\nควบคุม target schema ชัด",62,375,500,90,24,C.muted);
 shape(s,"div",624,205,2,330,C.rule);
 txt(s,"elt","ELT",688,215,200,52,39,C.red,true);txt(s,"eltf","Extract → Load → Transform",688,292,520,44,29,C.ink,true);txt(s,"eltb","เก็บ raw ก่อน แปลงใน platform\nยืดหยุ่นกับ compute และข้อมูลใหม่",688,375,500,90,24,C.muted);
 txt(s,"same","ทั้งคู่ต้องมี validation • lineage • access control • reconciliation",160,570,960,44,25,C.ink,true,"center");
 sources(s,["Microsoft Learn, Modern Data Warehouse, https://learn.microsoft.com/en-us/data-engineering/playbook/solutions/modern-data-warehouse/"],"ให้นักศึกษาปกป้องตัวเลือก ETL หรือ ELT ด้วยบริบท ไม่ใช่ความใหม่ของเทคโนโลยี");
}
// 9
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Data Quality ต้องเป็นกฎที่วัดและดำเนินการได้",9);footer(s,9);
 const dq=[["COMPLETE","order_id ไม่ว่าง"],["UNIQUE","receipt line ไม่ซ้ำ"],["VALID","quantity > 0"],["CONSISTENT","net = gross − discount"],["TIMELY","ถึงภายใน 30 นาที"],["REFERENTIAL","product key ต้องพบ"]];
 dq.forEach((v,i)=>{const col=i%3,row=Math.floor(i/3);card(s,`dq-${i}`,v[0],v[1],62+col*400,205+row*180,350,140,row?C.pale:C.panel,i===3?C.red:C.blue);});
 sources(s,["Microsoft Learn, Modern Data Warehouse, https://learn.microsoft.com/en-us/data-engineering/playbook/solutions/modern-data-warehouse/"],"แต่ละ rule ต้องมี threshold, owner และ action: warn, quarantine หรือ stop");
}
// 10
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Dimensional Modeling เริ่มจากหนึ่งประโยคเรื่อง Grain",10);footer(s,10);
 txt(s,"gq","“หนึ่งแถวแทนอะไร?”",70,225,520,70,47,C.blue,true);
 shape(s,"good",650,205,550,155,C.pale);txt(s,"gh","ชัด",680,230,100,32,24,C.green,true);txt(s,"gb","หนึ่งสินค้าในหนึ่งใบเสร็จ\nณ เวลาชำระเงิน",680,284,460,62,28,C.ink,true);
 shape(s,"bad",650,405,550,140,C.panel);txt(s,"bh","ไม่ชัด",680,430,120,32,24,C.red,true);txt(s,"bb","หนึ่งแถวแทน “ยอดขาย”",680,485,460,44,28,C.ink,true);
 txt(s,"rule","ห้ามผสม transaction, daily total และ snapshot ใน fact เดียว",120,590,1040,40,25,C.red,true,"center");
 sources(s,["Kimball Group, Dimensional Modeling Techniques, https://www.kimballgroup.com/wp-content/uploads/2013/08/2013.09-Kimball-Dimensional-Modeling-Techniques11.pdf"],"ก่อนถามว่ามี dimension อะไร ให้ทุกกลุ่มเขียน grain statement ก่อน");
}
// 11
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Star Schema ทำให้เหตุการณ์หนึ่งชุดมองได้หลายบริบท",11);footer(s,11);
 image(s,star,"ภาพ Retail Star Schema มี fact sales ตรงกลางและมิติรอบด้าน",66,184,1148,460,"contain");
 sources(s,["Generated illustration: OpenAI ImageGen, 2026 (assets/retail-star-schema.png).","Microsoft Learn, star schema guidance, https://learn.microsoft.com/en-ie/power-bi/guidance/star-schema"],"ให้ผู้เรียนชี้ fact, dimensions, event rows และ filter paths จากภาพ");
}
// 12
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Fact เก็บเหตุการณ์ — Dimension ให้คำอธิบาย",12);footer(s,12);
 shape(s,"fact",54,205,520,350,C.pale);txt(s,"fh","FACT TABLE",84,232,260,38,28,C.blue,true);txt(s,"fb","• foreign keys\n• measures\n• receipt / event id\n• เติบโตต่อเนื่อง\n\nเช่น quantity, net amount",84,305,420,210,25,C.ink,true);
 shape(s,"dim",706,205,520,350,C.panel);txt(s,"dh","DIMENSION TABLE",736,232,320,38,28,C.red,true);txt(s,"db","• surrogate key\n• business key\n• descriptive attributes\n• hierarchy / history\n\nเช่น product, customer, date",736,305,420,210,25,C.ink,true);
 sources(s,["Microsoft Learn, dimensional modeling overview, https://learn.microsoft.com/en-us/fabric/data-warehouse/dimensional-modeling-overview"],"ถามว่า receipt number เป็น measure, dimension หรือ degenerate dimension");
}
// 13
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Measure บางชนิดห้ามบวกข้ามทุกมิติ",13);footer(s,13);
 const m=[["ADDITIVE","quantity • sales\nบวกได้ทุกมิติ"],["SEMI-ADDITIVE","account balance\nบวกข้ามบัญชี ไม่ข้ามเวลา"],["NON-ADDITIVE","rate • percentage\nคำนวณจากฐาน"]];
 m.forEach((v,i)=>card(s,`m-${i}`,v[0],v[1],62+i*400,225,350,310,i===1?C.pale:C.panel,i===2?C.red:C.blue));
 txt(s,"mq","ยอดคงเหลือรายวัน 100 บาท × 30 วัน ไม่ได้แปลว่ามีเงิน 3,000 บาท",140,582,1000,40,25,C.red,true,"center");
 sources(s,["Microsoft Learn, fact tables in dimensional modeling, https://learn.microsoft.com/en-us/fabric/data-warehouse/dimensional-modeling-fact-tables"],"ใช้ตัวอย่าง balance เพื่อป้องกัน double counting");
}
// 14
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"SCD เลือกว่าจะจำอดีตหรือเขียนอดีตใหม่",14);footer(s,14);
 shape(s,"scd1",54,215,520,320,C.panel);txt(s,"s1h","TYPE 1 • OVERWRITE",84,244,380,36,27,C.blue,true);txt(s,"s1b","แก้ค่าเดิมโดยตรง\nประวัติเดิมหาย\n\nเหมาะ: แก้คำสะกดผิด",84,325,420,140,27,C.ink,true);
 shape(s,"scd2",706,215,520,320,C.pale);txt(s,"s2h","TYPE 2 • NEW ROW",736,244,380,36,27,C.red,true);txt(s,"s2b","เพิ่ม surrogate key ใหม่\neffective_from / to\n\nเหมาะ: ย้ายภูมิภาคลูกค้า",736,325,420,140,27,C.ink,true);
 txt(s,"scdq","คำถาม: รายงานอดีตควรเห็น “ข้อมูลตอนนั้น” หรือ “ข้อมูลล่าสุด”?",145,580,990,44,25,C.ink,true,"center");
 sources(s,["Kimball Group, Slowly Changing Dimension Techniques, https://www.kimballgroup.com/wp-content/uploads/2013/08/2013.09-Kimball-Dimensional-Modeling-Techniques11.pdf"],"ให้ผู้เรียนเลือก Type 1/2 สำหรับชื่อสินค้า ที่อยู่ลูกค้า และ credit segment");
}
// 15
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"เลือก Platform จากโครงสร้าง ผู้ใช้ และการกำกับดูแล",15);footer(s,15);
 const p=[["WAREHOUSE","structured BI\nmetric ชัด"],["DATA MART","เฉพาะแผนก\nเร็วแต่เสี่ยง silo"],["DATA LAKE","raw ทุกชนิด\nเสี่ยง data swamp"],["LAKEHOUSE","open storage +\ntable reliability"]];
 p.forEach((v,i)=>card(s,`pl-${i}`,v[0],v[1],45+i*304,218,270,315,i===3?C.pale:C.panel,i===2?C.red:C.blue));
 txt(s,"choose","ไม่มี platform ใดทดแทน grain, metadata, quality และ ownership",160,584,960,42,25,C.red,true,"center");
 sources(s,["Microsoft Learn, Modern Data Warehouse, https://learn.microsoft.com/en-us/data-engineering/playbook/solutions/modern-data-warehouse/","Databricks, medallion architecture, https://docs.databricks.com/gcp/en/lakehouse/medallion"],"เปรียบเทียบ technology choice กับ governance capability");
}
// 16
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Applications 01–10: การค้า การเงิน สุขภาพ ลูกค้า",16);footer(s,16);
 const a=["01 Retail • receipt line • returns","02 Card spend • posted txn • currency","03 Deposits • account-day • balance","04 Claims • claim event • late update","05 Hospital • encounter • privacy","06 Pharmacy • dispensed item • codes","07 Telecom • session • volume","08 Churn • customer-month • labels","09 E-commerce • session event • identity","10 Attribution • conversion-touch • definition"];
 shape(s,"al",50,198,570,420,C.panel);shape(s,"ar",660,198,570,420,C.pale);txt(s,"alt",a.slice(0,5).join("\n"),80,224,510,360,22,C.ink,true);txt(s,"art",a.slice(5).join("\n"),690,224,510,360,22,C.ink,true);
 sources(s,["Week-03 expanded content; examples synthesized for instruction."],"อ่านแต่ละบรรทัดเป็น application • grain • data-quality risk");
}
// 17
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Applications 11–20: Supply Chain, IoT, สังคม และ ESG",17);footer(s,17);
 const a=["11 Inventory • product-location-day • timing","12 Delivery • shipment milestone • missing event","13 Production • batch • unit consistency","14 Telemetry • sensor-interval • late data","15 Fleet • trip • GPS quality","16 Energy • meter-interval • time zone","17 Traffic • segment-interval • missing sensor","18 Education • student-course-term • privacy","19 Agriculture • field-day • calibration","20 ESG • facility-period-source • provenance"];
 shape(s,"al2",50,198,570,420,C.panel);shape(s,"ar2",660,198,570,420,C.pale);txt(s,"alt2",a.slice(0,5).join("\n"),80,224,510,360,22,C.ink,true);txt(s,"art2",a.slice(5).join("\n"),690,224,510,360,22,C.ink,true);
 sources(s,["Week-03 expanded content; examples synthesized for instruction."],"ให้ผู้เรียนเลือก application หนึ่งข้อแล้วประกาศ grain ใหม่");
}
// 18
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Future Data: คุณภาพเพิ่มทีละชั้น แต่ Governance ครอบทุกชั้น",18);footer(s,18);
 image(s,future,"Future Data Architecture แบบ Bronze Silver Gold พร้อม lineage governance และ AI consumers",44,184,780,455,"cover");
 shape(s,"fp",850,184,378,455,C.panel);txt(s,"fph","TRUSTED DATA PATH",880,214,310,34,24,C.blue,true);
 txt(s,"fpb","Bronze • raw + provenance\nSilver • validate + conform\nGold • model + metrics\n\nData products + semantic layer\nLineage + quality + privacy\nBI • ML • AI agents",880,290,300,240,22,C.ink,true);
 txt(s,"fpq","มากกว่า Storage:\nต้องรู้ความหมายและที่มา",880,558,300,58,23,C.red,true);
 sources(s,["Databricks, medallion architecture, https://docs.databricks.com/gcp/en/lakehouse/medallion","Microsoft Learn, Modern Data Warehouse, https://learn.microsoft.com/en-us/data-engineering/playbook/solutions/modern-data-warehouse/","Generated illustration: OpenAI ImageGen, 2026 (assets/future-data-architecture.png)."],"อธิบาย Bronze/Silver/Gold เป็นระดับคุณภาพ ไม่ใช่ชื่อผลิตภัณฑ์");
}
// 19
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"10 คำถามตรวจ Data Product ก่อนเผยแพร่",19);footer(s,19);
 const l=["1 Process + grain ชัดไหม?","2 Dataset/metric owner คือใคร?","3 Mapping ย้อนตรวจได้ไหม?","4 Keys และ integrity ผ่านไหม?","5 SCD ตรงความต้องการไหม?"];
 const r=["6 Pipeline รันซ้ำปลอดภัยไหม?","7 Source/target reconcile ไหม?","8 Freshness ทันการตัดสินใจไหม?","9 Lineage/privacy/access ครบไหม?","10 BI/ML/AI ใช้นิยามเดียวกันไหม?"];
 shape(s,"ql",52,202,560,400,C.panel);shape(s,"qr",668,202,560,400,C.pale);txt(s,"qlt",l.join("\n"),86,234,500,330,26,C.ink,true);txt(s,"qrt",r.join("\n"),702,234,500,330,26,C.ink,true);
 sources(s,["Microsoft Learn, dimensional modeling overview, https://learn.microsoft.com/en-us/fabric/data-warehouse/dimensional-modeling-overview","Week-03-Questions.md in this teaching package."],"ใช้เป็น design review checklist ก่อนอนุญาตให้ dashboard หรือ AI ใช้ dataset");
}
// 20
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"ลงมือทำ: นิยามข้อมูล แล้วพิสูจน์ว่าข้อมูลถูกต้อง",20,"WEEK 03 • NEXT ACTION");footer(s,20);
 shape(s,"lab1",54,202,540,356,C.panel);shape(s,"lab2",686,202,540,356,C.pale);
 txt(s,"l1n","LAB 01",86,232,180,34,22,C.blue,true);txt(s,"l1h","Quality &\nGrain Contract",86,300,450,98,39,C.ink,true);txt(s,"l1b","ประกาศ grain\nสร้าง quality rules 8 ข้อ\nออกแบบ reconciliation",86,430,450,105,23,C.muted);
 txt(s,"l2n","LAB 02",718,232,180,34,22,C.blue,true);txt(s,"l2h","Build a Retail\nStar Schema",718,300,450,98,39,C.ink,true);txt(s,"l2b","สร้าง dimension + fact\nเก็บ rejects และ audit\nทดสอบ totals + idempotency",718,430,450,105,23,C.muted);
 txt(s,"close","เป้าหมาย: ตัวเลขที่ตอบได้ทั้ง “เท่าไร” “หมายถึงอะไร” และ “มาจากไหน”",135,602,1010,42,25,C.ink,true,"center");
 sources(s,["Lab-01-Data-Quality-and-Grain-Contract.md and Lab-02-Build-a-Retail-Star-Schema.md."],"ปิดด้วย exit ticket: เขียน grain statement หนึ่งประโยคและ reconciliation หนึ่งสมการ");
}

await fs.mkdir(RENDER,{recursive:true});
for(const [i,s] of deck.slides.items.entries()){
 const png=await deck.export({slide:s,format:"png",scale:1});await fs.writeFile(path.join(RENDER,`slide-${String(i+1).padStart(2,"0")}.png`),new Uint8Array(await png.arrayBuffer()));
 const layout=await s.export({format:"layout"});await fs.writeFile(path.join(RENDER,`slide-${String(i+1).padStart(2,"0")}.layout.json`),await layout.text());
}
const montage=await deck.export({format:"webp",montage:true,scale:1});await fs.writeFile(path.join(ROOT,".build","week03-montage.webp"),new Uint8Array(await montage.arrayBuffer()));
const pptx=await PresentationFile.exportPptx(deck);await pptx.save(OUT);
console.log(JSON.stringify({output:OUT,slideCount:deck.slides.items.length,renderDir:RENDER}));
