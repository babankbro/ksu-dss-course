import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT="D:/work/KSU/Lecture/DSS/01-Weeks/week04";
const OUT=path.join(ROOT,"Week-04-OLAP-and-Multidimensional-Analysis.pptx");
const RENDER=path.join(ROOT,".build","artifact-renders");
const ASSETS=path.join(ROOT,"assets");
const C={white:"#FFFFFF",ink:"#111318",muted:"#56606B",panel:"#EDF0F2",rule:"#B8BCC4",blue:"#246BCE",pale:"#DFF3FC",amber:"#F2A93B",red:"#C84B4B",green:"#23836B"};
const FONT="Noto Sans Thai"; const deck=Presentation.create({slideSize:{width:1280,height:720}});
function shape(s,n,l,t,w,h,fill=C.panel,g="rect",stroke="none",sw=0){return s.shapes.add({geometry:g,name:n,position:{left:l,top:t,width:w,height:h},fill,line:{style:"solid",fill:stroke,width:sw}});}
function txt(s,n,text,l,t,w,h,size=24,color=C.ink,bold=false,align="left",valign="top"){const b=s.shapes.add({geometry:"textbox",name:n,position:{left:l,top:t,width:w,height:h},fill:"none",line:{style:"solid",fill:"none",width:0}});b.text=text;b.text.style={fontSize:size,typeface:FONT,color,bold,alignment:align,verticalAlignment:valign};return b;}
function title(s,text,n,kicker="DECISION SUPPORT SYSTEMS • WEEK 04"){txt(s,`k-${n}`,kicker,42,30,900,28,17,C.blue,true);txt(s,`t-${n}`,text,42,70,1195,72,42,C.ink,true);shape(s,`r-${n}`,42,154,1196,2,C.rule);}
function footer(s,n){txt(s,`fl-${n}`,"KSU • OLAP & Multidimensional Analysis",42,676,520,20,13,C.muted);txt(s,`fn-${n}`,String(n).padStart(2,"0"),1180,676,58,20,13,C.muted,false,"right");}
function sources(s,items,note=""){s.speakerNotes.textFrame.setText(`${note}${note?"\n\n":""}[Sources]\n${items.map(x=>`- ${x}`).join("\n")}`);s.speakerNotes.setVisible(true);}
async function bytes(n){return new Uint8Array(await fs.readFile(path.join(ASSETS,n)));}
function image(s,b,alt,l,t,w,h,fit="cover"){return s.images.add({blob:b,contentType:"image/png",alt,fit,position:{left:l,top:t,width:w,height:h},geometry:"rect"});}
function bullets(s,items,l,t,w,row=64,size=25,accent=C.blue){items.forEach((v,i)=>{shape(s,`bd-${t}-${i}`,l,t+i*row+11,11,11,accent,"ellipse");txt(s,`bt-${t}-${i}`,v,l+27,t+i*row,w-27,row,size,C.ink);});}
function card(s,n,head,body,l,t,w,h,fill=C.panel,accent=C.blue){shape(s,n,l,t,w,h,fill);shape(s,`${n}-a`,l,t,8,h,accent);txt(s,`${n}-h`,head,l+27,t+20,w-48,36,24,accent,true);txt(s,`${n}-b`,body,l+27,t+74,w-48,h-90,20,C.ink);}
function arr(s,n,l,t,w=54,h=34){shape(s,n,l,t,w,h,C.blue,"rightArrow");}
const cover=await bytes("olap-cover.png"),ops=await bytes("olap-operations.png"),apps=await bytes("olap-20-applications.png"),future=await bytes("future-olap.png");

// 1
{
 const s=deck.slides.add();s.background.fill="#F7F9FB";image(s,cover,"นักวิเคราะห์สำรวจลูกบาศก์ข้อมูลหลายมิติ",0,0,1280,720);shape(s,"fade",0,0,650,720,"#F8FAFC");
 txt(s,"ck","WEEK 04 • MULTIDIMENSIONAL ANALYSIS",48,52,600,34,19,C.blue,true);txt(s,"ct","OLAP &\nMultidimensional Analysis",48,150,600,190,61,C.ink,true);
 txt(s,"cs","Cube • Drill • SQL • Semantic Analytics",48,397,580,52,26,C.ink);txt(s,"cq","จากยอดรวม → บริบท → หลักฐาน",48,510,570,42,24,C.red,true);txt(s,"cc","รายวิชาระบบสนับสนุนการตัดสินใจ • KSU",48,630,560,28,18,C.muted);
 sources(s,["Generated illustration: OpenAI ImageGen, 2026 (assets/olap-cover.png)."],"เปิดด้วยคำถาม: ยอดขายลด 8% — จะ drill มิติใดก่อน และเพราะเหตุใด?");
}
// 2
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"วันนี้เราจะตอบ 5 คำถาม",2);footer(s,2);
 bullets(s,["Cube แทนคำถามหลายมิติอย่างไร?","Roll-up, Drill-down, Slice, Dice และ Pivot ต่างกันอย่างไร?","แปลงเส้นทางวิเคราะห์เป็น SQL ได้อย่างไร?","MOLAP, ROLAP, HOLAP และ columnar OLAP เลือกเมื่อใด?","Future OLAP ใช้ AI โดยยังรักษานิยามและหลักฐานอย่างไร?"],80,195,1090,82,28);
 sources(s,["Course Week-04 source note and expanded content in this vault."],"ให้นักศึกษาเลือกหนึ่งคำถามเป็น learning target");
}
// 3
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"ยอดขายลด 8% ยังไม่ใช่คำตอบ — เป็นจุดเริ่มต้น",3);footer(s,3);
 txt(s,"big","−8%",65,220,310,110,72,C.red,true);txt(s,"question","คำถามต่อไปคือ…",65,365,300,40,29,C.ink,true);
 const q=["เดือนไหน?","ภูมิภาคใด?","สินค้าใด?","ช่องทางใด?","ธุรกรรมใด?"];q.forEach((v,i)=>{const x=450+(i%3)*250,y=215+Math.floor(i/3)*170;shape(s,`q-${i}`,x,y,210,120,i===4?C.pale:C.panel);txt(s,`qt-${i}`,v,x+18,y+38,174,44,29,i===4?C.red:C.blue,true,"center");});
 txt(s,"claim","OLAP เปลี่ยน KPI ให้เป็นเส้นทางสำรวจที่ทำซ้ำและตรวจสอบได้",155,575,970,42,26,C.ink,true,"center");
 sources(s,["Scenario synthesized for instruction; no empirical result claimed."],"ให้ผู้เรียนเสนอ drill path แล้วเปรียบเทียบว่าทำไม path ต่างกัน");
}
// 4
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"หนึ่ง Cell เกิดจาก Measure ตัดกับหลาย Dimension",4);footer(s,4);
 shape(s,"cell",490,260,300,190,C.pale);txt(s,"cellh","CELL",520,285,240,34,28,C.blue,true,"center");txt(s,"cellb","Net Sales\nณ Month × Product × Region",520,350,240,70,25,C.ink,true,"center");
 const d=[["MEASURE","ค่าที่วิเคราะห์"],["DIMENSION","บริบทที่แบ่ง"],["MEMBER","ค่าหนึ่งในมิติ"],["HIERARCHY","เส้นทางระดับ"]];
 d.forEach((v,i)=>{const x=i<2?62:930,y=i%2?405:215;shape(s,`d-${i}`,x,y,280,125,C.panel);txt(s,`dh-${i}`,v[0],x+20,y+20,240,30,22,C.blue,true);txt(s,`db-${i}`,v[1],x+20,y+70,240,28,20,C.ink);});
 sources(s,["Microsoft Learn, OLAP cubes overview, https://learn.microsoft.com/en-us/system-center/scsm/olap-cubes-overview"],"ใช้ตัวอย่างยอดขาย 100 บาท ณ กรกฎาคม × เครื่องดื่ม × กาฬสินธุ์");
}
// 5
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Hierarchy ทำให้การเจาะลึกมีเส้นทางที่มีความหมาย",5);footer(s,5);
 const paths=[["TIME","Year","Quarter","Month","Day"],["PRODUCT","Category","Subcategory","Product","SKU"],["GEO","Country","Region","Province","Branch"]];
 paths.forEach((p,i)=>{const x=54+i*408;shape(s,`hp-${i}`,x,210,360,360,i===1?C.pale:C.panel);txt(s,`hh-${i}`,p[0],x+28,235,300,34,25,C.blue,true);p.slice(1).forEach((v,j)=>{txt(s,`hl-${i}-${j}`,v,x+44,315+j*57,250,34,25,C.ink,true);if(j<3)txt(s,`ha-${i}-${j}`,"↓",x+300,315+j*57,30,30,24,C.muted,true,"center");});});
 txt(s,"hwarning","Hierarchy ผิด → subtotal ผิด และ drill path หลอกผู้ใช้",180,600,920,38,24,C.red,true,"center");
 sources(s,["Microsoft Learn, logical architecture of multidimensional data, https://learn.microsoft.com/en-us/analysis-services/multidimensional-models/olap-logical/logical-architecture-overview-analysis-services-multidimensional-data"],"อภิปราย ragged hierarchy และกรณีสาขาย้ายภูมิภาค");
}
// 6
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"5 Operations เปลี่ยนระดับ ขอบเขต และมุมมองของ Cube",6);footer(s,6);
 image(s,ops,"ภาพแสดง roll-up drill-down slice dice และ pivot ของลูกบาศก์ข้อมูล",64,184,1152,460,"contain");
 sources(s,["Generated illustration: OpenAI ImageGen, 2026 (assets/olap-operations.png).","Microsoft Learn, OLAP cubes overview, https://learn.microsoft.com/en-us/system-center/scsm/olap-cubes-overview"],"ให้นักศึกษาจับคู่ส่วนของภาพกับชื่อ operation ก่อนเฉลย");
}
// 7
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Roll-up สรุปภาพรวม — Drill-down เปิดสาเหตุย่อย",7);footer(s,7);
 shape(s,"roll",54,210,520,340,C.panel);txt(s,"rh","ROLL-UP ↑",84,240,260,38,29,C.blue,true);txt(s,"rb","Month → Quarter → Year\n\nลดจำนวน groups\nตอบ “ภาพรวมเป็นอย่างไร?”",84,325,420,155,27,C.ink,true);
 shape(s,"drill",706,210,520,340,C.pale);txt(s,"dh","DRILL-DOWN ↓",736,240,300,38,29,C.red,true);txt(s,"db","Region → Province → Branch\n\nเพิ่มรายละเอียด\nตอบ “เกิดที่ไหน?”",736,325,420,155,27,C.ink,true);
 txt(s,"rule","ทั้งสองต้องเดินตาม hierarchy — ไม่ใช่เปลี่ยน filter แบบสุ่ม",165,590,950,40,25,C.ink,true,"center");
 sources(s,["Microsoft Learn, drill mode, https://learn.microsoft.com/en-us/power-bi/explore-reports/end-user-drill"],"ถามว่าการเลือกเฉพาะ Q1 เป็น drill-down หรือ filter");
}
// 8
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Slice, Dice และ Pivot เปลี่ยน Context ไม่เปลี่ยน Measure",8);footer(s,8);
 const x=[62,462,862],items=[["SLICE","fix 1 dimension\nYear = 2026"],["DICE","จำกัดหลายมิติ\nNE + Beverage + Q1"],["PIVOT","สลับแกนมอง\nRegion ↔ Month"]];
 items.forEach((v,i)=>card(s,`op-${i}`,v[0],v[1],x[i],225,350,310,i===1?C.pale:C.panel,i===1?C.red:C.blue));
 txt(s,"ctx","ทุกผลลัพธ์ต้องแสดง Filter Context — มิฉะนั้นตัวเลขเทียบกันไม่ได้",155,584,970,42,25,C.red,true,"center");
 sources(s,["Microsoft Learn, OLAP cubes overview, https://learn.microsoft.com/en-us/system-center/scsm/olap-cubes-overview"],"ให้ผู้เรียนเขียน context ของตัวเลขหนึ่ง cell แบบเต็ม");
}
// 9
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Drill-across เปรียบเทียบ Fact — Drill-through เปิดหลักฐาน",9);footer(s,9);
 shape(s,"across",54,210,520,350,C.panel);txt(s,"ah","DRILL-ACROSS",84,240,300,38,28,C.blue,true);txt(s,"ab","Sales Fact ↔ Returns Fact\nผ่าน Date / Product / Store\n\nคำถาม: ขายมากแต่คืนมากหรือไม่?",84,320,430,165,25,C.ink,true);
 shape(s,"through",706,210,520,350,C.pale);txt(s,"th","DRILL-THROUGH",736,240,320,38,28,C.red,true);txt(s,"tb","Aggregated Cell → Detail rows\nreceipt • claim • encounter\n\nคำถาม: แถวใดประกอบเป็นยอดนี้?",736,320,430,165,25,C.ink,true);
 sources(s,["Microsoft Learn, OLAP cubes overview, https://learn.microsoft.com/en-us/system-center/scsm/olap-cubes-overview","Microsoft Learn, report drillthrough, https://learn.microsoft.com/en-us/power-bi/guidance/report-drillthrough"],"ย้ำเรื่อง conformed dimensions และ row-level permission");
}
// 10
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Decision Trail บันทึกว่าข้อค้นพบเกิดจากเส้นทางใด",10);footer(s,10);
 const f=[["1","START","Sales ↓ 8%"],["2","DRILL","Quarter → Month"],["3","DICE","NE + Beverage"],["4","PIVOT","Branch × Channel"],["5","EVIDENCE","42 receipts"]];
 f.forEach((v,i)=>{const x=38+i*249;shape(s,`f-${i}`,x,235,205,230,i===4?C.pale:C.panel);txt(s,`fn-${i}`,v[0],x+18,252,38,38,30,C.blue,true);txt(s,`fh-${i}`,v[1],x+18,320,169,30,21,i===4?C.red:C.blue,true);txt(s,`fb-${i}`,v[2],x+18,385,169,42,21,C.ink,true);if(i<4)arr(s,`fa-${i}`,x+200,330,48,30);});
 txt(s,"audit","บันทึก metric • filters • hierarchy • baseline • operation sequence • evidence",115,550,1050,54,25,C.ink,true,"center");
 sources(s,["Microsoft Learn, drill mode, https://learn.microsoft.com/en-us/power-bi/explore-reports/end-user-drill","NIST-style traceability principle adapted for instructional analytics workflow."],"ให้ทุกกลุ่มเล่า path ก่อนเล่าข้อสรุป");
}
// 11
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"ROLLUP สร้างระดับสรุปตามลำดับ Hierarchy",11);footer(s,11);
 shape(s,"code",54,208,650,360,"#19212A");txt(s,"sql","SELECT year, quarter, month,\n       SUM(net_sales) AS sales\nFROM sales\nGROUP BY ROLLUP\n  (year, quarter, month);",86,245,590,245,26,C.white,true);
 shape(s,"sets",760,208,460,360,C.pale);txt(s,"sh","GROUPING SETS",790,238,340,34,25,C.blue,true);txt(s,"sb","(year, quarter, month)\n(year, quarter)\n(year)\n()\n\nจำนวนชุด = n + 1",790,315,360,190,26,C.ink,true);
 sources(s,["DuckDB, GROUPING SETS, https://duckdb.org/docs/current/sql/query_syntax/grouping_sets"],"เปรียบเทียบกับ GROUP BY ธรรมดาและให้ผู้เรียนทำนายจำนวนแถว");
}
// 12
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"CUBE สร้างทุก Combination — GROUPING SETS เลือกเท่าที่ต้องใช้",12);footer(s,12);
 shape(s,"cube",54,205,350,355,C.panel);txt(s,"ch","CUBE",84,235,200,36,29,C.blue,true);txt(s,"cb","3 dimensions\n→ 2³ = 8 sets\n\nครบทุกมุม\nแต่คำนวณมาก",84,322,270,170,26,C.ink,true);
 shape(s,"gs",465,205,350,355,C.pale);txt(s,"gh","GROUPING SETS",495,235,280,36,25,C.red,true);txt(s,"gb","เลือกเฉพาะชุด\nที่ตอบคำถาม\n\nชัดและประหยัดกว่า",495,322,270,170,26,C.ink,true);
 shape(s,"gid",876,205,350,355,C.panel);txt(s,"ih","GROUPING_ID",906,235,260,36,25,C.green,true);txt(s,"ib","แยก NULL จริง\nจาก subtotal NULL\n\nป้องกันตีความผิด",906,322,270,170,26,C.ink,true);
 sources(s,["DuckDB, GROUPING SETS, https://duckdb.org/docs/current/sql/query_syntax/grouping_sets","DuckDB, aggregate functions, https://duckdb.org/docs/lts/sql/functions/aggregates"],"ให้คำนวณจำนวน sets ของ CUBE 5 มิติและอภิปราย cost");
}
// 13
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"เลือก OLAP Architecture จาก Latency, Scale และ Freshness",13);footer(s,13);
 const a=[["MOLAP","pre-aggregated cube","เร็วมาก\nrefresh/storage สูง"],["ROLAP","tables + SQL","scale/freshness ดี\nต้อง optimize"],["HOLAP","summary + detail","สมดุล\nดูแลซับซ้อน"]];
 a.forEach((v,i)=>card(s,`a-${i}`,v[0],`${v[1]}\n\n${v[2]}`,62+i*400,220,350,330,i===1?C.pale:C.panel,i===2?C.red:C.blue));
 txt(s,"arch","ถามเพิ่ม: cardinality • sparsity • concurrency • drill-through • team skills",120,584,1040,42,24,C.ink,true,"center");
 sources(s,["Microsoft Learn, Analysis Services multidimensional architecture, https://learn.microsoft.com/en-us/analysis-services/multidimensional-models/olap-logical/logical-architecture-overview-analysis-services-multidimensional-data"],"ไม่มีแบบใดดีที่สุดโดยไม่มี workload");
}
// 14
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Modern OLAP เร็วขึ้นด้วย Columnar, Vectorization และ Skipping",14);footer(s,14);
 const m=[["COLUMNAR","อ่านเฉพาะคอลัมน์\nบีบอัดดี"],["VECTORIZED","ประมวลผลเป็น batch\nใช้ CPU มีประสิทธิภาพ"],["DATA SKIPPING","ข้าม block\nที่ไม่ตรง filter"],["SEMANTIC","นิยาม metric/hierarchy\nครั้งเดียว"]];
 m.forEach((v,i)=>card(s,`m-${i}`,v[0],v[1],45+i*304,220,270,310,i===3?C.pale:C.panel,i===2?C.red:C.blue));
 txt(s,"blur","เส้นแบ่ง cube กับ relational เบลอลง — แต่ semantics ยังสำคัญเหมือนเดิม",145,588,990,40,25,C.red,true,"center");
 sources(s,["ClickHouse, OLAP database, https://clickhouse.com/resources/engineering/olap-database","ClickHouse, columnar storage, https://clickhouse.com/resources/engineering/what-is-columnar-storage"],"เน้นว่า engine เร็วไม่แก้ metric definition ผิด");
}
// 15
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Aggregation Trap ทำให้คำตอบถูกคำนวณแต่ผิดความหมาย",15);footer(s,15);
 const traps=[["NON-ADDITIVE","อย่าบวก ratio / balance"],["AVG OF AVG","ใช้ numerator / denominator"],["NULL","แยก data กับ subtotal"],["DOUBLE COUNT","ตรวจ many-to-many"],["SIMPSON","ดู subgroup ก่อนสรุป"],["PRIVACY","detail ตามสิทธิ์"]];
 traps.forEach((v,i)=>{const col=i%3,row=Math.floor(i/3);card(s,`tr-${i}`,v[0],v[1],62+col*400,205+row*180,350,140,row?C.pale:C.panel,i===4?C.red:C.blue);});
 sources(s,["DuckDB, GROUPING SETS and GROUPING_ID, https://duckdb.org/docs/current/sql/query_syntax/grouping_sets","Microsoft Learn, drillthrough guidance, https://learn.microsoft.com/en-us/power-bi/guidance/report-drillthrough"],"ใช้กรณี conversion rate เพื่อเกริ่น Lab 2");
}
// 16
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"20 Applications ใช้หลักเดียวกัน: Measure × Context × Drill Path",16);footer(s,16);
 image(s,apps,"ภาพรวมงานประยุกต์ OLAP ยี่สิบโดเมน",56,184,1168,455,"contain");
 sources(s,["Generated illustration: OpenAI ImageGen, 2026 (assets/olap-20-applications.png)."],"ให้ผู้เรียนเลือกโดเมนหนึ่งและประกาศ measure, dimensions และ path");
}
// 17
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Applications 01–20: ระบุ Measure, Grain และคำถามถัดไป",17);footer(s,17);
 const a=["01 Retail • net sales • store/category","02 Banking • spend • merchant/province","03 Insurance • paid • claim/provider","04 Hospital • encounters • clinic/diagnosis","05 Pharmacy • quantity • drug/branch","06 Telecom • usage • hour/tower","07 E-commerce • conversion • stage/device","08 Marketing • revenue • campaign/channel","09 Support • resolution • issue/team","10 Inventory • balance • SKU/warehouse","11 Supply chain • lead time • supplier/route","12 Production • units • machine/shift","13 Maintenance • downtime • asset/failure","14 Fleet • fuel • vehicle/route","15 Energy • kWh • hour/tariff","16 Traffic • volume • segment/weather","17 Education • pass rate • program/course","18 Agriculture • yield • crop/field","19 Public budget • spend • agency/program","20 ESG • emissions • facility/scope"];
 shape(s,"al",50,194,570,430,C.panel);shape(s,"ar",660,194,570,430,C.pale);txt(s,"alt",a.slice(0,10).join("\n"),80,215,510,390,19,C.ink,true);txt(s,"art",a.slice(10).join("\n"),690,215,510,390,19,C.ink,true);
 sources(s,["Week-04 expanded content; examples synthesized for instruction."],"อ่านรูปแบบ Application • measure • candidate drill dimensions");
}
// 18
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"Future OLAP: AI ช่วยสำรวจได้ แต่ต้องผ่าน Semantic Layer",18);footer(s,18);
 image(s,future,"Future OLAP มี semantic layer, AI assistant และ human verification",44,184,770,455,"cover");shape(s,"fp",840,184,388,455,C.panel);
 txt(s,"fph","TRUSTED EXPLORATION",870,214,320,34,24,C.blue,true);txt(s,"fpb","• shared metric definition\n• hierarchy + relationship\n• filter context + baseline\n• generated SQL/query\n• lineage + permissions\n• evidence rows\n• human verification",870,285,310,250,22,C.ink,true);
 txt(s,"fpq","AI แนะนำ Path\nแต่ห้ามซ่อน Context",870,560,310,58,24,C.red,true);
 sources(s,["Microsoft Learn, Direct Lake overview, https://learn.microsoft.com/en-au/fabric/fundamentals/direct-lake-overview","Microsoft Learn, decomposition tree, https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-decomposition-tree","Generated illustration: OpenAI ImageGen, 2026 (assets/future-olap.png)."],"AI ควรแสดง query และ metric definition ไม่ใช่เพียงคำตอบภาษาธรรมชาติ");
}
// 19
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"10 คำถามตรวจก่อนยอมรับข้อค้นพบจาก OLAP",19);footer(s,19);
 const l=["1 Measure aggregate ถูกไหม?","2 Fact grain ตรงคำถามไหม?","3 Hierarchy มีความหมายไหม?","4 Filter context เท่ากันไหม?","5 Operation path บันทึกไหม?"];
 const r=["6 NULL จริงหรือ subtotal?","7 มี double counting ไหม?","8 ผลรวมซ่อน subgroup ไหม?","9 Drill-through มีสิทธิ์ไหม?","10 อ้างเหตุผลเกินข้อมูลไหม?"];
 shape(s,"ql",52,202,560,400,C.panel);shape(s,"qr",668,202,560,400,C.pale);txt(s,"qlt",l.join("\n"),86,234,500,330,26,C.ink,true);txt(s,"qrt",r.join("\n"),702,234,500,330,26,C.ink,true);
 sources(s,["DuckDB, GROUPING SETS, https://duckdb.org/docs/current/sql/query_syntax/grouping_sets","Week-04-Questions.md in this teaching package."],"ใช้ checklist กับข้อค้นพบจาก Lab");
}
// 20
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,"ลงมือทำ: สร้างเส้นทางสำรวจ แล้วทดสอบกับดัก",20,"WEEK 04 • NEXT ACTION");footer(s,20);
 shape(s,"l1",54,202,540,356,C.panel);shape(s,"l2",686,202,540,356,C.pale);
 txt(s,"l1n","LAB 01",86,232,180,34,22,C.blue,true);txt(s,"l1h","OLAP Operations\n& SQL",86,300,450,98,39,C.ink,true);txt(s,"l1b","ตอบคำถามธุรกิจ 8 ข้อ\nใช้ ROLLUP/CUBE/GROUPING SETS\nบันทึก operation trail",86,430,450,105,23,C.muted);
 txt(s,"l2n","LAB 02",718,232,180,34,22,C.blue,true);txt(s,"l2h","Root Cause &\nAggregation Traps",718,300,450,98,39,C.ink,true);txt(s,"l2b","สร้าง Simpson’s paradox\nเปรียบเทียบ weighted rate\nออกแบบ guardrails",718,430,450,105,23,C.muted);
 txt(s,"close","เป้าหมาย: ทุกข้อค้นพบมี Context, Path และ Evidence",205,602,870,42,26,C.ink,true,"center");
 sources(s,["Lab-01-OLAP-Operations-and-SQL.md and Lab-02-Root-Cause-and-Aggregation-Traps.md."],"ปิดด้วย exit ticket: เขียน operation sequence จาก KPI ถึง transaction");
}

await fs.mkdir(RENDER,{recursive:true});
for(const [i,s] of deck.slides.items.entries()){const png=await deck.export({slide:s,format:"png",scale:1});await fs.writeFile(path.join(RENDER,`slide-${String(i+1).padStart(2,"0")}.png`),new Uint8Array(await png.arrayBuffer()));const layout=await s.export({format:"layout"});await fs.writeFile(path.join(RENDER,`slide-${String(i+1).padStart(2,"0")}.layout.json`),await layout.text());}
const montage=await deck.export({format:"webp",montage:true,scale:1});await fs.writeFile(path.join(ROOT,".build","week04-montage.webp"),new Uint8Array(await montage.arrayBuffer()));const pptx=await PresentationFile.exportPptx(deck);await pptx.save(OUT);
console.log(JSON.stringify({output:OUT,slideCount:deck.slides.items.length,renderDir:RENDER}));
