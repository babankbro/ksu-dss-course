import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT = "D:/work/KSU/Lecture/DSS/01-Weeks/week02";
const OUT = path.join(ROOT, "Week-02-DSS-Architecture-and-Future.pptx");
const RENDER = path.join(ROOT, ".build", "artifact-renders");
const ASSETS = path.join(ROOT, "assets");
const C = { white:"#FFFFFF", ink:"#111318", muted:"#56606B", panel:"#EDF0F2", rule:"#B8BCC4", cyan:"#6DCBF4", blue:"#246BCE", pale:"#DFF3FC", amber:"#F2A93B", red:"#C84B4B", green:"#23836B" };
const FONT = "Noto Sans Thai";
const deck = Presentation.create({ slideSize:{ width:1280, height:720 } });

function shape(slide,name,left,top,width,height,fill=C.panel,geometry="rect",lineFill="none",lineWidth=0){
  return slide.shapes.add({geometry,name,position:{left,top,width,height},fill,line:{style:"solid",fill:lineFill,width:lineWidth}});
}
function txt(slide,name,text,left,top,width,height,size=24,color=C.ink,bold=false,align="left",valign="top"){
  const box=slide.shapes.add({geometry:"textbox",name,position:{left,top,width,height},fill:"none",line:{style:"solid",fill:"none",width:0}});
  box.text=text; box.text.style={fontSize:size,typeface:FONT,color,bold,alignment:align,verticalAlignment:valign}; return box;
}
function title(slide,text,n,kicker="DECISION SUPPORT SYSTEMS • WEEK 02"){
  txt(slide,`k-${n}`,kicker,42,30,900,28,17,C.blue,true);
  txt(slide,`t-${n}`,text,42,70,1190,72,42,C.ink,true);
  shape(slide,`r-${n}`,42,154,1196,2,C.rule);
}
function footer(slide,n){
  txt(slide,`fl-${n}`,"KSU • ระบบสนับสนุนการตัดสินใจ",42,676,500,20,13,C.muted);
  txt(slide,`fn-${n}`,String(n).padStart(2,"0"),1180,676,58,20,13,C.muted,false,"right");
}
function sources(slide,items,teaching=""){
  slide.speakerNotes.textFrame.setText(`${teaching}${teaching?"\n\n":""}[Sources]\n${items.map(x=>`- ${x}`).join("\n")}`);
  slide.speakerNotes.setVisible(true);
}
async function img(name){ return new Uint8Array(await fs.readFile(path.join(ASSETS,name))); }
function addImage(slide,bytes,alt,left,top,width,height,fit="cover"){
  return slide.images.add({blob:bytes,contentType:"image/png",alt,fit,position:{left,top,width,height},geometry:"rect"});
}
function bullets(slide,items,left,top,width,row=64,size=25,accent=C.blue){
  items.forEach((v,i)=>{ shape(slide,`b-${top}-${i}`,left,top+i*row+11,11,11,accent,"ellipse"); txt(slide,`bt-${top}-${i}`,v,left+27,top+i*row,width-27,row,size,C.ink); });
}
function card(slide,name,head,body,left,top,width,height,fill=C.panel,accent=C.blue){
  shape(slide,name,left,top,width,height,fill);
  shape(slide,`${name}-a`,left,top,8,height,accent);
  txt(slide,`${name}-h`,head,left+28,top+22,width-50,38,25,accent,true);
  txt(slide,`${name}-b`,body,left+28,top+76,width-50,height-94,21,C.ink);
}
function arrow(slide,name,left,top,width=56,height=36){ shape(slide,name,left,top,width,height,C.blue,"rightArrow"); }

const cover=await img("dss-architecture-cover.png");
const subs=await img("four-subsystems.png");
const apps=await img("dss-20-applications.png");
const future=await img("future-dss-architecture.png");

// 1
{
 const s=deck.slides.add(); s.background.fill="#F6F8FA"; addImage(s,cover,"สถาปัตยกรรม DSS จากข้อมูลสู่การตัดสินใจ",0,0,1280,720);
 shape(s,"fade",0,0,650,720,"#F7F9FB"); txt(s,"ck","WEEK 02 • DECISION SUPPORT SYSTEMS",48,52,560,34,19,C.blue,true);
 txt(s,"ct","สถาปัตยกรรม\nDSS",48,164,560,174,72,C.ink,true);
 txt(s,"cs","4 Subsystems • 20 Applications • Future DSS",48,385,580,74,27,C.ink);
 txt(s,"cc","จากข้อมูล → เหตุผล → คำแนะนำ → การลงมือทำ",48,510,570,44,23,C.red,true);
 txt(s,"course","รายวิชาระบบสนับสนุนการตัดสินใจ • KSU",48,630,560,28,18,C.muted);
 sources(s,["Generated illustration: OpenAI ImageGen, 2026 (assets/dss-architecture-cover.png)."],"เปิดด้วยคำถาม: ถ้าโมเดลแม่น แต่ข้อมูลช้าและผู้ใช้ไม่เข้าใจคำแนะนำ ระบบนี้ดีหรือไม่?");
}
// 2
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"วันนี้เราจะตอบ 5 คำถาม",2); footer(s,2);
 bullets(s,["DSS แบ่งความรับผิดชอบเป็นระบบย่อยอย่างไร?","ข้อมูล กฎ โมเดล และผู้ใช้ทำงานร่วมกันอย่างไร?","เมื่อใดควรใช้ batch, real-time, cloud หรือ edge?","20 applications มี pattern และความเสี่ยงร่วมอะไร?","Future DSS เพิ่ม autonomy โดยยังควบคุมได้อย่างไร?"],78,196,1090,82,29);
 sources(s,["Course Week-02 source note and expanded content in this vault."],"ให้นักศึกษาเลือกหนึ่งคำถามไว้เป็น learning target ส่วนตัว");
}
// 3
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"โมเดลดี ≠ ระบบตัดสินใจดี",3); footer(s,3);
 txt(s,"claim","Accuracy\n94%",62,225,330,145,62,C.blue,true);
 txt(s,"but","แต่…",62,397,280,44,31,C.red,true);
 bullets(s,["ข้อมูลช้า 6 ชั่วโมง","กฎนโยบายคนละเวอร์ชัน","UI ซ่อนความไม่แน่นอน","ไม่มี fallback เมื่อบริการล้ม"],480,210,680,76,28,C.red);
 txt(s,"q","Architecture ทำให้ความสามารถแต่ละส่วนกลายเป็นผลลัพธ์ที่เชื่อถือได้",110,575,1060,44,27,C.ink,true,"center");
 sources(s,["Google Cloud, MLOps architecture, https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning"],"ให้ผู้เรียนระบุว่าความผิดพลาดแต่ละข้อเป็นปัญหาของ subsystem ใด");
}
// 4
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"Architecture = การจัดสรรความรับผิดชอบ",4); footer(s,4);
 const xs=[54,350,646,942], heads=["INPUT","REASONING","INTERACTION","ACCOUNTABILITY"], bodies=["รับข้อมูลอะไร\nสดแค่ไหน\nใครเป็นเจ้าของ","โมเดล/กฎใด\nเวอร์ชันอะไร\nข้อจำกัดใด","ใครเห็นอะไร\nปรับสมมติฐานได้ไหม\nอนุมัติอย่างไร","ใครรับผิดชอบ\nตรวจสอบย้อนหลัง\nกู้คืนอย่างไร"];
 xs.forEach((x,i)=>card(s,`resp-${i}`,heads[i],bodies[i],x,215,264,320,i===1?C.pale:C.panel,i===3?C.red:C.blue));
 sources(s,["Sprague (1980), https://aisel.aisnet.org/misq/vol4/iss4/1/"],"กล่องและลูกศรต้องมี contract: input/output, owner, latency และ failure behavior");
}
// 5
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"ระบบย่อย 4 ส่วน — เชื่อมกันเป็นวงจร",5); footer(s,5);
 addImage(s,subs,"ภาพระบบย่อย Data Model Knowledge และ User Interface",70,184,1140,455,"contain");
 sources(s,["Sprague (1980), https://aisel.aisnet.org/misq/vol4/iss4/1/","Generated illustration: OpenAI ImageGen, 2026 (assets/four-subsystems.png)."],"ใช้ภาพให้ผู้เรียนอธิบายลูกศรกลับ: action และ outcome ต้องย้อนเป็น feedback");
}
// 6
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"1 • Data Management — ความจริงที่มีที่มา",6); footer(s,6);
 card(s,"d1","INGEST","ERP • CRM • IoT • Web\nbatch / stream",54,208,270,330,C.panel);
 arrow(s,"da1",335,346); card(s,"d2","TRUST","quality • metadata\nlineage • access",407,208,270,330,C.pale);
 arrow(s,"da2",688,346); card(s,"d3","SERVE","warehouse • lakehouse\nfeature / query API",760,208,270,330,C.panel);
 txt(s,"risks","ความเสี่ยงหลัก: stale data • schema drift • leakage • missing values",130,581,1020,42,25,C.red,true,"center");
 sources(s,["Google Cloud, MLOps architecture, https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning"],"เน้น timestamp, source และ owner เป็นส่วนของข้อมูล ไม่ใช่ metadata ที่ละเลยได้");
}
// 7
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"2 • Model Management — จากสมมติฐานสู่ทางเลือก",7); footer(s,7);
 const items=[["MODEL BASE","forecast\noptimization\nsimulation / ML"],["EXECUTION","solver\ninference service\nscenario engine"],["LIFECYCLE","validate • approve\nversion • deploy\nmonitor • rollback"]];
 items.forEach((v,i)=>card(s,`m-${i}`,v[0],v[1],62+i*400,214,350,320,i===1?C.pale:C.panel,i===2?C.green:C.blue));
 txt(s,"mq","คำถามสำคัญ: โมเดลนี้เหมาะกับประชากร เวลา และเงื่อนไขปัจจุบันหรือไม่?",120,580,1040,42,25,C.red,true,"center");
 sources(s,["AWS Well-Architected Machine Learning Lens, https://docs.aws.amazon.com/wellarchitected/latest/machine-learning-lens/machine-learning-lens.html"],"แยกความถูกต้องทางคณิตศาสตร์ออกจากความเหมาะสมในบริบทใช้งาน");
}
// 8
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"3 • Knowledge Management — กฎที่องค์กรยืนยัน",8); footer(s,8);
 shape(s,"model",56,210,520,320,C.pale); txt(s,"mh","MODEL",88,238,200,36,27,C.blue,true);
 txt(s,"mb","“อะไรน่าจะเกิดขึ้น?”\n\nProbability • Forecast\nOptimization • Similarity",88,315,430,150,29,C.ink,true);
 shape(s,"know",704,210,520,320,C.panel); txt(s,"kh","KNOWLEDGE",736,238,250,36,27,C.red,true);
 txt(s,"kb","“องค์กรอนุญาตอะไร?”\n\nPolicy • Regulation\nConstraint • Expert rule",736,315,430,150,29,C.ink,true);
 txt(s,"ex","สินเชื่อ: model ประเมินความเสี่ยง • rule บังคับเอกสารและวงเงิน",180,576,920,42,25,C.ink,true,"center");
 sources(s,["OMG Decision Model and Notation, https://www.omg.org/dmn/"],"ชี้ว่ากฎต้องมี owner, effective date และ conflict resolution");
}
// 9
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"4 • User Interface — พื้นที่ของการตัดสินใจ",9); footer(s,9);
 const ui=[["SEE","สถานการณ์\nfreshness\nuncertainty"],["EXPLORE","drill-down\nwhat-if\ncompare"],["DECIDE","approve\noverride\ndefer / escalate"],["EXPLAIN","เหตุผล\nข้อจำกัด\naudit rationale"]];
 ui.forEach((v,i)=>card(s,`ui-${i}`,v[0],v[1],46+i*304,218,270,315,i===1?C.pale:C.panel,i===2?C.red:C.blue));
 txt(s,"uiq","Dashboard ที่ไม่มีทางเลือก ไม่มี action และไม่มี feedback อาจเป็นเพียงรายงาน",120,580,1040,42,25,C.red,true,"center");
 sources(s,["NIST AI RMF Human–AI Interaction, https://airc.nist.gov/airmf-resources/airmf/appendices/app-c-ai-risk-management-and-human-ai-interaction/"],"ให้ผู้เรียนออกแบบปุ่มสี่ปุ่ม: approve, override, defer, escalate");
}
// 10
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"เส้นทาง Decision-to-Action ต้องย้อนตรวจได้",10); footer(s,10);
 const flow=[["1","DATA","source + time"],["2","MODEL","score + version"],["3","RULE","policy + reason"],["4","HUMAN","choice + rationale"],["5","OUTCOME","result + feedback"]];
 flow.forEach((v,i)=>{const x=42+i*244; shape(s,`f-${i}`,x,246,204,210,i===3?C.pale:C.panel); txt(s,`fn-${i}`,v[0],x+18,262,38,42,32,C.blue,true); txt(s,`fh-${i}`,v[1],x+18,328,168,34,24,C.ink,true); txt(s,`fb-${i}`,v[2],x+18,382,168,28,18,C.muted); if(i<4) arrow(s,`fa-${i}`,x+200,330,43,28);});
 txt(s,"trace","Audit record = data snapshot + model/rule version + identity + timestamp + rationale + outcome",72,526,1136,62,25,C.ink,true,"center");
 sources(s,["NIST AI RMF Core, https://airc.nist.gov/airmf-resources/airmf/5-sec-core/"],"ถามว่าหากขาดหนึ่ง field จะสืบสวนเหตุการณ์ผิดพลาดได้หรือไม่");
}
// 11
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"DSS 5 ประเภท — จำแนกจากทรัพยากรที่ขับเคลื่อน",11); footer(s,11);
 const types=[["DATA","OLAP • trends","ยอดขาย"],["MODEL","solver • simulation","ตารางผลิต"],["KNOWLEDGE","rules • expertise","คัดกรองอาการ"],["COMMUNICATION","collaboration","ศูนย์ภัยพิบัติ"],["DOCUMENT","search • text","วิเคราะห์สัญญา"]];
 types.forEach((v,i)=>{const x=42+i*244; shape(s,`ty-${i}`,x,215,210,330,i===i%2?C.panel:C.pale); txt(s,`th-${i}`,v[0],x+20,240,170,35,i===3?17:22,C.blue,true); txt(s,`tb-${i}`,v[1],x+20,318,170,65,23,C.ink,true); txt(s,`te-${i}`,`ตัวอย่าง\n${v[2]}`,x+20,430,170,70,19,C.muted);});
 txt(s,"hybrid","ระบบจริงมักเป็น HYBRID — ให้ระบุ “แกนหลัก” และ subsystem ที่เสริม",130,580,1020,42,25,C.red,true,"center");
 sources(s,["Power (2004), https://aisel.aisnet.org/cais/vol13/iss1/13/"],"ให้ผู้เรียนจำแนก clinical DSS และอธิบายว่าทำไมตอบได้มากกว่าหนึ่งประเภท");
}
// 12
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"วิวัฒนาการ Deployment: ใกล้ผู้ใช้และกระจายมากขึ้น",12); footer(s,12);
 shape(s,"tl",76,348,1128,4,C.rule);
 const ev=[["1970s","Standalone","model + terminal"],["1990s","Client/Server","shared database"],["2000s","Web DSS","browser + services"],["2010s","Cloud","elastic + API"],["2020s+","Edge / Agents","distributed autonomy"]];
 ev.forEach((v,i)=>{const x=56+i*244; shape(s,`dot-${i}`,x+78,333,30,30,i===4?C.amber:C.blue,"ellipse"); txt(s,`yr-${i}`,v[0],x,226,188,32,23,C.blue,true,"center"); txt(s,`eh-${i}`,v[1],x,392,188,34,24,C.ink,true,"center"); txt(s,`eb-${i}`,v[2],x,444,188,58,19,C.muted,false,"center");});
 txt(s,"evolve","สิ่งที่เพิ่มขึ้นพร้อม scale: versioning • security • observability • governance",140,570,1000,42,25,C.red,true,"center");
 sources(s,["Sprague (1980), https://aisel.aisnet.org/misq/vol4/iss4/1/","Google Cloud MLOps architecture, https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning"],"วิวัฒนาการไม่ได้แปลว่าใหม่กว่าดีกว่า ต้องเลือกตาม decision context");
}
// 13
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"คุณภาพสถาปัตยกรรมวัดจาก Trust ไม่ใช่ Feature count",13); footer(s,13);
 const qa=[["CORRECT","ถูกบริบท"],["TIMELY","ทันเวลา"],["AVAILABLE","ล้มแล้วไม่พังทั้งหมด"],["EXPLAINABLE","เข้าใจเหตุผล"],["SECURE","สิทธิ์เหมาะสม"],["AUDITABLE","ย้อนตรวจได้"]];
 qa.forEach((v,i)=>{const col=i%3,row=Math.floor(i/3),x=62+col*400,y=205+row*180; card(s,`qa-${i}`,v[0],v[1],x,y,350,140,row===0?C.panel:C.pale,i===2?C.red:C.blue);});
 sources(s,["AWS Well-Architected Machine Learning Lens, https://docs.aws.amazon.com/wellarchitected/latest/machine-learning-lens/machine-learning-lens.html","NIST AI RMF Core, https://airc.nist.gov/airmf-resources/airmf/5-sec-core/"],"ให้แต่ละกลุ่มเลือก quality attribute หนึ่งข้อและนิยาม metric");
}
// 14
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"เลือก Architecture จากคุณค่าของเวลาและสถานที่",14); footer(s,14);
 shape(s,"batch",54,210,355,330,C.panel); txt(s,"bh","BATCH",84,238,260,34,27,C.blue,true); txt(s,"bb","เป็นรอบ • ตรวจซ้ำง่าย\nต้นทุนต่ำ\n\nforecast รายสัปดาห์",84,316,280,150,25,C.ink,true);
 shape(s,"rt",462,210,355,330,C.pale); txt(s,"rh","REAL-TIME",492,238,270,34,27,C.red,true); txt(s,"rb","ทันเหตุการณ์ • ซับซ้อน\nต้อง graceful degrade\n\nfraud / traffic",492,316,280,150,25,C.ink,true);
 shape(s,"edge",870,210,355,330,C.panel); txt(s,"eh","EDGE + CLOUD",900,238,290,34,27,C.green,true); txt(s,"eb","edge: latency / offline\ncloud: train / govern\n\nเกษตร • โรงงาน",900,316,280,150,25,C.ink,true);
 txt(s,"trade","ไม่มีคำตอบเดียว: ใช้ latency budget, connectivity, privacy, cost และ risk เป็นตัวกำหนด",90,585,1100,42,24,C.ink,true,"center");
 sources(s,["AWS Well-Architected Machine Learning Lens, https://docs.aws.amazon.com/wellarchitected/latest/machine-learning-lens/design-principles.html"],"กิจกรรมเร็ว: ให้เลือก architecture สำหรับ fraud กับ demand forecast แล้วปกป้องคำตอบ");
}
// 15
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"20 Applications — โครงสร้างร่วม แต่ความเสี่ยงต่างกัน",15); footer(s,15);
 addImage(s,apps,"ภาพรวมงานประยุกต์ DSS ยี่สิบโดเมน",58,184,1164,450,"contain");
 sources(s,["Generated illustration: OpenAI ImageGen, 2026 (assets/dss-20-applications.png).","Power (2004), https://aisel.aisnet.org/cais/vol13/iss1/13/"],"ให้ผู้เรียนเลือกหนึ่ง vignette และชี้ subsystem ที่เด่น");
}
// 16
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"Applications 01–10: สุขภาพ การเงิน ค้าปลีก การผลิต",16); footer(s,16);
 const a=["01 Clinical • Knowledge+Model • safety","02 Hospital capacity • Model • real-time","03 Credit • Model+Rule • fairness","04 Fraud • Stream+Model • latency","05 Portfolio • Model • scenario","06 Demand • Data+Model • drift","07 Pricing • Model+Rule • guardrail","08 Assortment • Data • granularity","09 Scheduling • Model • constraints","10 Maintenance • Edge+Model • uptime"];
 shape(s,"al",50,198,570,420,C.panel); shape(s,"ar",660,198,570,420,C.pale);
 txt(s,"alt",a.slice(0,5).join("\n"),80,224,510,360,23,C.ink,true);
 txt(s,"art",a.slice(5).join("\n"),690,224,510,360,23,C.ink,true);
 sources(s,["Week-02 expanded content; examples synthesized for instruction."],"อ่านแต่ละบรรทัดเป็น Application • dominant subsystem • architecture concern");
}
// 17
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"Applications 11–20: โลจิสติกส์ สังคม โครงสร้างพื้นฐาน",17); footer(s,17);
 const a=["11 Routing • Model • replanning","12 Supply risk • Data+Document • provenance","13 Agriculture • Edge+Model • offline","14 Disaster • Communication • resilience","15 Energy • Model • safety","16 Traffic • Stream+Model • latency","17 Student warning • Data+Rule • privacy","18 Workforce • Model • human constraints","19 Cyber response • Knowledge+Model • approval","20 Policy simulation • Model+Communication • uncertainty"];
 shape(s,"al2",50,198,570,420,C.panel); shape(s,"ar2",660,198,570,420,C.pale);
 txt(s,"alt2",a.slice(0,5).join("\n"),80,224,510,360,23,C.ink,true);
 txt(s,"art2",a.slice(5).join("\n"),690,224,510,360,23,C.ink,true);
 sources(s,["Week-02 expanded content; examples synthesized for instruction."],"ถามว่า application ใดควรมี human approval และเพราะเหตุใด");
}
// 18
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"Future DSS: หลาย Agent แต่มี Control Plane เดียว",18); footer(s,18);
 addImage(s,future,"Future DSS แบบ multi-agent พร้อม control plane และ human approval",44,184,760,455,"cover");
 shape(s,"future-panel",830,184,398,455,"#E9EEF3");
 txt(s,"fp-h","CONTROL PLANE",860,214,320,36,26,C.blue,true);
 txt(s,"fp-b","• agent registry + permission\n• orchestration + conflict\n• policy / risk gates\n• trace + evaluation\n• sandbox + rollback\n• human approval",860,290,320,240,23,C.ink,true);
 txt(s,"fp-q","Autonomy ต้องเป็น\nตัวแปรที่ออกแบบ",860,558,320,58,24,C.red,true);
 sources(s,["IBM, Agentic Enterprise, https://www.ibm.com/think/topics/agentic-enterprise","NIST AI RMF Core, https://airc.nist.gov/airmf-resources/airmf/5-sec-core/","Generated illustration: OpenAI ImageGen, 2026 (assets/future-dss-architecture.png)."],"เน้นว่าความสามารถ agent มากขึ้นทำให้ control plane และ oversight สำคัญขึ้น");
}
// 19
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"10 คำถามตรวจสถาปัตยกรรมก่อนใช้งานจริง",19); footer(s,19);
 const l=["1 Decision owner คือใคร?","2 Data มาจากไหน/สดไหม?","3 Model + rule เวอร์ชันใด?","4 แสดง uncertainty อย่างไร?","5 Latency + fallback คืออะไร?"];
 const r=["6 ใคร override / rollback?","7 Audit evidence ครบไหม?","8 เฝ้าระวัง drift / bias?","9 Component ล้มแล้วปลอดภัยไหม?","10 Feedback กลับอย่างไร?"];
 shape(s,"ql",52,202,560,400,C.panel); shape(s,"qr",668,202,560,400,C.pale);
 txt(s,"qlt",l.join("\n"),86,234,500,330,27,C.ink,true); txt(s,"qrt",r.join("\n"),702,234,500,330,27,C.ink,true);
 sources(s,["NIST AI RMF Core, https://airc.nist.gov/airmf-resources/airmf/5-sec-core/","Week-02-Questions.md in this teaching package."],"ใช้เป็น design review checklist; แบบฝึก 10 ข้อพร้อมแนวตอบอยู่ในไฟล์แยก");
}
// 20
{
 const s=deck.slides.add(); s.background.fill=C.white; title(s,"ลงมือทำ: ถอดระบบปัจจุบัน แล้วออกแบบระบบอนาคต",20,"WEEK 02 • NEXT ACTION"); footer(s,20);
 shape(s,"lab1",54,202,540,356,C.panel); shape(s,"lab2",686,202,540,356,C.pale);
 txt(s,"l1n","LAB 01",86,232,180,34,22,C.blue,true); txt(s,"l1h","Architecture\nTeardown",86,300,450,98,39,C.ink,true);
 txt(s,"l1b","วาด 4 subsystems + flow\nฉีด failure 3 เหตุการณ์\nออกแบบ safe fallback",86,430,450,105,23,C.muted);
 txt(s,"l2n","LAB 02",718,232,180,34,22,C.blue,true); txt(s,"l2h","Future DSS\nArchitecture",718,300,450,98,39,C.ink,true);
 txt(s,"l2b","กำหนด agent contracts\nสร้าง control plane + approval\nทดสอบ autonomy และ rollback",718,430,450,105,23,C.muted);
 txt(s,"close","เป้าหมาย: ระบบที่ช่วยคิดได้เร็ว — และรับผิดชอบได้เมื่อผิด",170,602,940,42,26,C.ink,true,"center");
 sources(s,["Lab-01-DSS-Architecture-Teardown.md and Lab-02-Design-a-Future-DSS-Architecture.md."],"ปิดด้วย exit ticket: component ใดสำคัญที่สุดเมื่อระบบผิด และเพราะเหตุใด");
}

await fs.mkdir(RENDER,{recursive:true});
for(const [i,slide] of deck.slides.items.entries()){
 const png=await deck.export({slide,format:"png",scale:1});
 await fs.writeFile(path.join(RENDER,`slide-${String(i+1).padStart(2,"0")}.png`),new Uint8Array(await png.arrayBuffer()));
 const layout=await slide.export({format:"layout"});
 await fs.writeFile(path.join(RENDER,`slide-${String(i+1).padStart(2,"0")}.layout.json`),await layout.text());
}
const montage=await deck.export({format:"webp",montage:true,scale:1});
await fs.writeFile(path.join(ROOT,".build","week02-montage.webp"),new Uint8Array(await montage.arrayBuffer()));
const pptx=await PresentationFile.exportPptx(deck); await pptx.save(OUT);
console.log(JSON.stringify({output:OUT,slideCount:deck.slides.items.length,renderDir:RENDER}));
