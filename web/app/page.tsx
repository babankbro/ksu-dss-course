import Link from "next/link";
import { SIMS } from "@/lib/sims";

export default function Home() {
  const ready = SIMS.filter((s) => s.ready);
  const soon = SIMS.filter((s) => !s.ready);

  return (
    <>
      <div className="pagehead">
        <h1>
          🎓 สื่อจำลองประกอบการเรียน — ระบบสนับสนุนการตัดสินใจ
          <small>
            Decision Support Systems · เลือกสื่อจำลองจากแถบข้างหรือการ์ดด้านล่าง
          </small>
        </h1>
        <div className="row">
          <div className="chip">
            พร้อมใช้งาน<b>{ready.length}</b>
          </div>
          <div className="chip">
            กำลังพัฒนา<b>{soon.length}</b>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>สื่อจำลองเหล่านี้ใช้ทำอะไร</h2>
        <p className="muted" style={{ fontSize: 13.5 }}>
          แต่ละตัวถูกออกแบบจากจุดที่นักศึกษา<b>เข้าใจผิดบ่อยที่สุด</b>และอธิบายด้วยสไลด์ไม่ได้ผล
          โดยให้ผู้เรียนลงมือปรับตัวแปรเองแล้วเห็นผลลัพธ์เปลี่ยนทันที
          ใช้ได้ทั้งการฉายสาธิตในชั้นเรียน การทำใบงานปฏิบัติการ และการทบทวนก่อนสอบ
        </p>
      </div>

      <h2 style={{ fontSize: 15, margin: "18px 0 10px" }}>พร้อมใช้งาน</h2>
      <div className="simgrid">
        {ready.map((s) => (
          <Link key={s.slug} href={`/sims/${s.slug}`}>
            <div className="simcard">
              <span className="ico">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.short}</p>
              <div
                className="muted"
                style={{ fontSize: 12, marginBottom: 10, lineHeight: 1.45 }}
              >
                <b style={{ color: "var(--acc2)" }}>แก้ความเข้าใจผิด:</b>{" "}
                {s.misconception}
              </div>
              <div className="tags">
                <span className="tag wk">{s.weeks}</span>
                {s.concept.split(" · ").map((c) => (
                  <span key={c} className="tag">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <h2 style={{ fontSize: 15, margin: "22px 0 10px" }}>กำลังพัฒนา</h2>
      <div className="simgrid">
        {soon.map((s) => (
          <div key={s.slug} className="simcard disabled">
            <span className="ico">{s.icon}</span>
            <h3>{s.title}</h3>
            <p>{s.short}</p>
            <div className="tags">
              <span className="tag wk">{s.weeks}</span>
              <span className="tag soon">เร็วๆ นี้</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          สื่อจำลองทุกตัวใช้ตัวสุ่มแบบกำหนดเมล็ด (seeded random)
          ผลลัพธ์จึงทำซ้ำได้เหมือนกันทุกครั้งบนทุกเครื่อง —
          เหมาะกับการเฉลยหน้าชั้นเรียนและการออกใบงานที่มีคำตอบตายตัว
          ข้อมูลทั้งหมดประมวลผลในเบราว์เซอร์ ไม่มีการส่งข้อมูลออกนอกเครื่อง
        </p>
      </div>
    </>
  );
}
