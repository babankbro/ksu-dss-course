"use client";

import { useState } from "react";
import {
  ANTIPATTERNS,
  AntipatternKey,
  PATIENTS,
  REMEDIES,
  RemedyKey,
} from "@/lib/antipatterns";

type Phase = "diagnose" | "treat" | "result";
type Score = { dx: boolean; rxCorrect: number; rxMissed: number; rxExtra: number };

export default function AntipatternClinic() {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>("diagnose");
  const [dx, setDx] = useState<AntipatternKey | null>(null);
  const [rx, setRx] = useState<RemedyKey[]>([]);
  const [scores, setScores] = useState<Score[]>([]);

  const p = PATIENTS[i];
  const done = i >= PATIENTS.length;

  const toggleRx = (k: RemedyKey) =>
    setRx((r) => (r.includes(k) ? r.filter((x) => x !== k) : [...r, k]));

  const submitTreatment = () => {
    const correct = rx.filter((k) => p.remedies.includes(k)).length;
    const missed = p.remedies.filter((k) => !rx.includes(k)).length;
    const extra = rx.filter((k) => !p.remedies.includes(k)).length;
    setScores((s) => [...s, { dx: dx === p.answer, rxCorrect: correct, rxMissed: missed, rxExtra: extra }]);
    setPhase("result");
  };

  const next = () => {
    setI((x) => x + 1);
    setPhase("diagnose");
    setDx(null);
    setRx([]);
  };

  const restart = () => {
    setI(0);
    setPhase("diagnose");
    setDx(null);
    setRx([]);
    setScores([]);
  };

  /* ---------- หน้าสรุป ---------- */
  if (done) {
    const dxRight = scores.filter((s) => s.dx).length;
    const totalMissed = scores.reduce((a, s) => a + s.rxMissed, 0);
    const totalExtra = scores.reduce((a, s) => a + s.rxExtra, 0);
    return (
      <>
        <Head />
        <div className="card">
          <h2>🏁 ปิดคลินิก — สรุปผลการวินิจฉัย</h2>
          <div className="kpis">
            <div className="kpi big">
              <span>วินิจฉัยถูก</span>
              <b className={dxRight >= 6 ? "pos" : "neg"}>
                {dxRight} / {PATIENTS.length}
              </b>
            </div>
            <div className="kpi">
              <span>ยาที่ควรสั่งแต่ไม่ได้สั่ง</span>
              <b className={totalMissed === 0 ? "pos" : "neg"}>{totalMissed}</b>
            </div>
            <div className="kpi">
              <span>ยาที่สั่งเกินความจำเป็น</span>
              <b className={totalExtra === 0 ? "pos" : "neg"}>{totalExtra}</b>
            </div>
          </div>

          <table style={{ marginTop: 14 }}>
            <thead>
              <tr>
                <th>ผู้ป่วย</th>
                <th>คำตอบที่ถูก</th>
                <th>วินิจฉัย</th>
                <th>ยาขาด</th>
                <th>ยาเกิน</th>
              </tr>
            </thead>
            <tbody>
              {PATIENTS.map((pt, k) => (
                <tr key={pt.id}>
                  <td style={{ textAlign: "left" }}>{pt.name}</td>
                  <td style={{ textAlign: "left" }}>
                    {ANTIPATTERNS.find((a) => a.key === pt.answer)!.label}
                  </td>
                  <td className={scores[k]?.dx ? "pos" : "neg"}>{scores[k]?.dx ? "✓" : "✗"}</td>
                  <td className={scores[k]?.rxMissed ? "neg" : ""}>{scores[k]?.rxMissed ?? 0}</td>
                  <td className={scores[k]?.rxExtra ? "neg" : ""}>{scores[k]?.rxExtra ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="note">
            <b>ตีความคะแนน “ยาเกิน”:</b> ถ้าตัวเลขนี้สูง แปลว่าคุณมีแนวโน้มแก้ปัญหาด้วยการเพิ่มองค์ประกอบ
            เข้าไปเรื่อยๆ ซึ่งในโลกจริงคือการเพิ่มต้นทุน เวลาแฝง และพื้นที่ที่จะพังได้อีก —
            สถาปนิกที่ดีสั่งยาให้<b>ตรงและน้อยที่สุดเท่าที่จะแก้อาการได้</b>
          </div>
          <button className="primary" onClick={restart} style={{ marginTop: 12 }}>
            เริ่มรอบใหม่
          </button>
        </div>
      </>
    );
  }

  /* ---------- หน้าตรวจผู้ป่วย ---------- */
  const correctDx = ANTIPATTERNS.find((a) => a.key === p.answer)!;
  const lastScore = scores[scores.length - 1];

  return (
    <>
      <Head sub={`ผู้ป่วยรายที่ ${i + 1} จาก ${PATIENTS.length}`} />

      <div className="clinicgrid">
        {/* ---------- ซ้าย: เวชระเบียน ---------- */}
        <div>
          <div className="card">
            <h2>
              🏥 {p.name} <span className="tag">{p.domain}</span>
            </h2>
            <p>{p.brief}</p>

            <h3>อาการที่ตรวจพบ</h3>
            <ul className="symptoms">
              {p.symptoms.map((s, k) => (
                <li key={k}>{s}</li>
              ))}
            </ul>

            <h3>หน้าจอที่ผู้ใช้เห็นจริง</h3>
            <div className="mockscreen">
              <div className="ms-title">{p.screen.title}</div>
              {p.screen.lines.map((l, k) => (
                <div className="ms-line" key={k}>
                  {l}
                </div>
              ))}
              {p.screen.verdict && <div className="ms-verdict">{p.screen.verdict}</div>}
            </div>

            <h3>ตัวชี้วัดของระบบ</h3>
            <div className="kpis">
              {p.metrics.map((m, k) => (
                <div className="kpi" key={k}>
                  <span>{m.label}</span>
                  <b className={m.bad ? "neg" : "pos"}>{m.value}</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- ขวา: วินิจฉัยและรักษา ---------- */}
        <div>
          {phase === "diagnose" && (
            <div className="card">
              <h2>🔬 ขั้นที่ 1 — วินิจฉัย</h2>
              <p className="muted">ระบบนี้กำลังเป็น anti-pattern ข้อใด (เลือกได้ข้อเดียว)</p>
              {ANTIPATTERNS.map((a) => (
                <div
                  key={a.key}
                  className={`opt${dx === a.key ? " sel" : ""}`}
                  onClick={() => setDx(a.key)}
                >
                  <div className="opt-top">
                    <b>{a.label}</b>
                  </div>
                  <span className="muted">{a.short}</span>
                </div>
              ))}
              <button
                className="primary"
                disabled={!dx}
                onClick={() => setPhase("treat")}
                style={{ marginTop: 10 }}
              >
                ยืนยันการวินิจฉัย ▶
              </button>
            </div>
          )}

          {phase === "treat" && (
            <div className="card">
              <h2>💊 ขั้นที่ 2 — สั่งยา</h2>
              <p className="muted">
                เลือกองค์ประกอบสถาปัตยกรรมที่ต้องเพิ่มเพื่อแก้อาการนี้ —{" "}
                <b>เลือกให้ตรงและน้อยที่สุด</b> การเพิ่มเกินความจำเป็นถูกหักคะแนน
              </p>
              <div className="rxlist">
                {REMEDIES.map((r) => (
                  <div
                    key={r.key}
                    className={`opt${rx.includes(r.key) ? " sel" : ""}`}
                    onClick={() => toggleRx(r.key)}
                  >
                    <div className="opt-top">
                      <b>{r.label}</b>
                      <span className="opt-cost">ต้นทุน {r.cost}</span>
                    </div>
                    <span className="muted">{r.desc}</span>
                  </div>
                ))}
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <button onClick={() => setPhase("diagnose")}>◀ กลับไปแก้การวินิจฉัย</button>
                <div className="spacer" />
                <button className="primary" onClick={submitTreatment}>
                  สั่งการรักษา ({rx.length} รายการ) ▶
                </button>
              </div>
            </div>
          )}

          {phase === "result" && lastScore && (
            <div className="card">
              <h2>📋 ผลการรักษา</h2>

              <div className={`note ${lastScore.dx ? "good" : "warn"}`}>
                {lastScore.dx ? (
                  <>
                    <b>วินิจฉัยถูกต้อง ✓</b> — {correctDx.label}
                  </>
                ) : (
                  <>
                    <b>วินิจฉัยคลาดเคลื่อน ✗</b> — คำตอบที่ถูกคือ <b>{correctDx.label}</b>
                    <br />
                    <span className="muted">{correctDx.short}</span>
                  </>
                )}
              </div>

              <h3>ยาที่ควรสั่ง</h3>
              {p.remedies.length === 0 ? (
                <div className="opt sel">
                  <b>ไม่ต้องสั่งยา</b>
                  <span className="muted">ระบบนี้สมดุลอยู่แล้ว</span>
                </div>
              ) : (
                p.remedies.map((k) => {
                  const r = REMEDIES.find((x) => x.key === k)!;
                  const given = rx.includes(k);
                  return (
                    <div key={k} className={`opt ${given ? "sel" : ""}`}>
                      <div className="opt-top">
                        <b>
                          {given ? "✓" : "✗"} {r.label}
                        </b>
                        <span className={given ? "pos" : "neg"}>{given ? "สั่งแล้ว" : "ขาดไป"}</span>
                      </div>
                      <span className="muted">{r.desc}</span>
                    </div>
                  );
                })
              )}

              {lastScore.rxExtra > 0 && (
                <div className="note warn">
                  <b>สั่งยาเกินความจำเป็น {lastScore.rxExtra} รายการ:</b>{" "}
                  {rx
                    .filter((k) => !p.remedies.includes(k))
                    .map((k) => REMEDIES.find((x) => x.key === k)!.label)
                    .join(" · ")}
                  <br />
                  <span className="muted">
                    องค์ประกอบเหล่านี้ไม่ผิด แต่ไม่ได้แก้อาการของเคสนี้ —
                    ในโลกจริงคือต้นทุนและความซับซ้อนที่เพิ่มขึ้นโดยไม่จำเป็น
                  </span>
                </div>
              )}

              <h3>ผลหลังการรักษา</h3>
              <div className="note good">{p.afterTreatment}</div>

              <h3>บทเรียนของเคสนี้</h3>
              <div className="note" dangerouslySetInnerHTML={{ __html: p.teaching }} />

              <button className="primary" onClick={next} style={{ marginTop: 12 }}>
                {i + 1 >= PATIENTS.length ? "ดูสรุปผลทั้งหมด ▶" : "ผู้ป่วยรายถัดไป ▶"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          ผู้ป่วยรายที่ 8 เป็น<b>กับดักโดยเจตนา</b> — เป็นระบบที่ออกแบบดีอยู่แล้ว
          นักศึกษาส่วนใหญ่จะพยายามหาโรคให้เจอและสั่งยาเกิน ใช้จังหวะนี้อภิปรายว่า
          การประเมินสถาปัตยกรรมไม่ใช่การหาข้อผิดพลาดให้ได้มากที่สุด แต่คือการตัดสินว่า
          <b>ความซับซ้อนที่มีอยู่คุ้มกับความเสี่ยงที่มันป้องกันหรือไม่</b>
        </p>
      </div>
    </>
  );
}

function Head({ sub }: { sub?: string }) {
  return (
    <div className="pagehead">
      <h1>
        🩺 Anti-pattern Clinic
        <small>วินิจฉัยระบบป่วย 8 ราย ตาม anti-pattern 7 ข้อ — สัปดาห์ที่ 2</small>
      </h1>
      {sub && <div className="chip">{sub}</div>}
    </div>
  );
}
