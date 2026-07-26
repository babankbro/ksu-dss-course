"use client";

import { useMemo, useState } from "react";
import {
  FAULTS,
  FaultKey,
  Metrics,
  REFERENCE_CONFIG,
  STRATEGIES,
  Strategy,
  evaluate,
  fmtM,
  pct,
} from "@/lib/architecture";

type Trial = { faults: FaultKey[]; strategy: Strategy; transparent: boolean; m: Metrics };

export default function ChaosLab() {
  const [faults, setFaults] = useState<FaultKey[]>([]);
  const [strategy, setStrategy] = useState<Strategy>("toHuman");
  const [transparent, setTransparent] = useState(false);
  const [trials, setTrials] = useState<Trial[]>([]);

  const baseline = useMemo(() => evaluate(REFERENCE_CONFIG, {}), []);
  const current = useMemo(
    () => evaluate(REFERENCE_CONFIG, { faults, strategy, transparentFailure: transparent }),
    [faults, strategy, transparent]
  );

  const toggle = (k: FaultKey) =>
    setFaults((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]));

  const active = FAULTS.filter((f) => faults.includes(f.key));
  const delta = current.net - baseline.net;

  return (
    <>
      <div className="pagehead">
        <h1>
          💥 Chaos Lab
          <small>ทุบระบบทีละชิ้น แล้วดูว่าผู้ตัดสินใจเห็นอะไร — สัปดาห์ที่ 2</small>
        </h1>
        <div className="row">
          <div className="chip">
            ส่วนที่กำลังล้ม<b className={faults.length ? "neg" : "pos"}>{faults.length} / {FAULTS.length}</b>
          </div>
          <div className="chip">
            กำไรสุทธิเทียบฐาน<b className={delta >= 0 ? "pos" : "neg"}>{fmtM(delta)} ลบ.</b>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>คำถามแกนของสถาปนิก DSS</h2>
        <p style={{ fontSize: 16 }}>
          <b>“ถ้าส่วนนี้ช้า ผิด หรือหยุดทำงาน — ผู้ตัดสินใจจะเห็นอะไร และทำอะไรต่อ?”</b>
        </p>
        <p className="muted">
          สถาปัตยกรรมตั้งต้นคือระบบอนุมัติสินเชื่อที่ออกแบบมาดีแล้ว (มีครบทั้ง 4 ระบบย่อย
          มนุษย์ทบทวนเคสก้ำกึ่ง มีวงจรป้อนกลับและร่องรอยตรวจสอบ) ผลฐานคือกำไรสุทธิ{" "}
          <b className="pos">{fmtM(baseline.net)} ล้านบาท</b> · หน้าที่ของคุณคือทำให้มันพัง
          แล้วดูว่า <b>สัญญาการรับมือความล้มเหลว</b> ที่ต่างกันให้ผลต่างกันแค่ไหน
        </p>
      </div>

      <div className="chaosgrid">
        {/* ---------- ซ้าย: ปุ่มทำลาย ---------- */}
        <div>
          <div className="card">
            <h2>🔨 เลือกความล้มเหลวที่จะฉีดเข้าระบบ</h2>
            {FAULTS.map((f) => (
              <div
                key={f.key}
                className={`fault${faults.includes(f.key) ? " on" : ""}`}
                onClick={() => toggle(f.key)}
              >
                <div className="fault-head">
                  <span className="ico">{f.icon}</span>
                  <b>{f.label}</b>
                  <span className="spacer" />
                  <span className={`sw${faults.includes(f.key) ? " on" : ""}`} />
                </div>
                <small className="muted">{f.reality}</small>
                <span className="apx">anti-pattern ที่เกี่ยวข้อง: {f.antipattern}</span>
              </div>
            ))}
            <div className="row" style={{ marginTop: 8 }}>
              <button className="mini" onClick={() => setFaults(FAULTS.map((f) => f.key))}>
                ทุบทุกอย่างพร้อมกัน
              </button>
              <button className="mini" onClick={() => setFaults([])}>
                ซ่อมทั้งหมด
              </button>
            </div>
          </div>

          <div className="card">
            <h2>🛟 สัญญาการรับมือเมื่อระบบล้ม</h2>
            <p className="muted" style={{ marginTop: -4 }}>
              นี่คือ <b>failure handling contract</b> ที่ต้องระบุไว้ตั้งแต่ตอนออกแบบ ไม่ใช่ตอนเกิดเหตุ
            </p>
            {STRATEGIES.map((s) => (
              <div
                key={s.key}
                className={`opt${strategy === s.key ? " sel" : ""}`}
                onClick={() => setStrategy(s.key)}
              >
                <div className="opt-top">
                  <b>{s.label}</b>
                </div>
                <span className="muted">{s.desc}</span>
              </div>
            ))}

            <h3>ความโปร่งใสของสถานะระบบ</h3>
            <div className={`opt${transparent ? " sel" : ""}`} onClick={() => setTransparent(!transparent)}>
              <div className="opt-top">
                <b>{transparent ? "✅ UI แจ้งผู้ใช้เมื่อระบบทำงานในโหมดเสื่อม" : "⬜ UI ไม่แจ้งอะไรเลย"}</b>
              </div>
              <span className="muted">
                คลิกเพื่อสลับ — ตัวเลือกนี้ราคาถูกที่สุดในทั้งหน้า แต่ส่งผลต่อคุณภาพการตัดสินใจมากที่สุด
              </span>
            </div>
          </div>
        </div>

        {/* ---------- ขวา: จอแยกซ้าย/ขวา ---------- */}
        <div>
          <div className="card">
            <h2>🪞 ความจริงของระบบ เทียบกับ สิ่งที่ผู้ตัดสินใจเห็น</h2>
            <div className="split">
              <div className="pane reality">
                <h4>⚙️ ความจริงภายในระบบ</h4>
                {active.length === 0 ? (
                  <div className="pline ok">ทุกองค์ประกอบทำงานปกติ · ข้อมูลสด · โมเดลเวอร์ชัน 4.2 · กฎเวอร์ชัน 11</div>
                ) : (
                  active.map((f) => (
                    <div className="pline bad" key={f.key}>
                      {f.icon} <b>{f.label}</b>
                      <br />
                      <span className="muted">{f.reality}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="pane user">
                <h4>👤 หน้าจอที่เจ้าหน้าที่สินเชื่อเห็น</h4>
                <div className="loancard">
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <b>คำขอ #A-4471</b>
                    <span className="muted">วงเงิน 320,000 บาท</span>
                  </div>
                  {active.length > 0 && transparent ? (
                    active.map((f) => (
                      <div className="warnline" key={f.key}>
                        {f.honestUI}
                      </div>
                    ))
                  ) : active.length > 0 ? (
                    <div className="calmline">
                      {active[0].naiveUI}
                      {active.length > 1 && (
                        <>
                          <br />
                          <span className="muted">
                            (และอีก {active.length - 1} ปัญหาที่หน้าจอนี้ไม่ได้บอก)
                          </span>
                        </>
                      )}
                    </div>
                  ) : null}
                  <div className="score">
                    <span>คะแนนความเสี่ยง</span>
                    <b>{active.length && !transparent ? "0.18" : active.length ? "ประเมินไม่ได้" : "0.18"}</b>
                  </div>
                  <div className="verdict">
                    {active.length && !transparent
                      ? "✅ แนะนำให้อนุมัติ"
                      : active.length
                      ? "⏸️ ระบบขอให้มนุษย์ตัดสิน"
                      : "✅ แนะนำให้อนุมัติ"}
                  </div>
                </div>
                {active.length > 0 && !transparent && (
                  <div className="note warn" style={{ marginTop: 10 }}>
                    <b>อันตรายที่สุดคือกรณีนี้:</b> ระบบพังอยู่ แต่หน้าจอดู<b>ปกติและมั่นใจ</b>
                    เจ้าหน้าที่จึงไม่มีทางรู้ว่าควรระวัง — ความมั่นใจที่ไม่มีมูลคือความล้มเหลวเชิงสถาปัตยกรรม
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h2>📉 ผลลัพธ์เมื่อรัน 800 คำขอภายใต้เงื่อนไขนี้</h2>
            <div className="cmp">
              <Cmp label="กำไรสุทธิ (ลบ.)" base={baseline.net} now={current.net} money />
              <Cmp label="อนุมัติแล้วผิดนัด" base={baseline.defaults} now={current.defaults} invert />
              <Cmp label="อนุมัติผิดข้อบังคับ" base={baseline.violations} now={current.violations} invert />
              <Cmp label="ปฏิเสธลูกค้าดี" base={baseline.lostGood} now={current.lostGood} invert />
              <Cmp label="ตัดสินใจไม่ทัน 48 ชม." base={baseline.missedWindow} now={current.missedWindow} invert />
              <Cmp label="ความเชื่อมั่นผู้ใช้ (%)" base={baseline.trust * 100} now={current.trust * 100} />
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button
                className="primary"
                onClick={() =>
                  setTrials((t) => [...t, { faults: [...faults], strategy, transparent, m: current }])
                }
              >
                💾 เก็บผลการทดลองนี้
              </button>
              {trials.length > 0 && (
                <button className="mini" onClick={() => setTrials([])}>
                  ล้างตาราง
                </button>
              )}
            </div>
          </div>

          {trials.length > 0 && (
            <div className="card">
              <h2>🧪 ตารางเปรียบเทียบการทดลอง</h2>
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ความล้มเหลว</th>
                      <th>กลยุทธ์</th>
                      <th>แจ้งผู้ใช้</th>
                      <th>สุทธิ</th>
                      <th>ผิดนัด</th>
                      <th>Trust</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trials.map((t, i) => (
                      <tr key={i}>
                        <td style={{ textAlign: "left" }}>
                          {t.faults.length === 0 ? "ปกติ" : t.faults.length + " จุด"}
                        </td>
                        <td style={{ textAlign: "left" }}>
                          {STRATEGIES.find((s) => s.key === t.strategy)!.label}
                        </td>
                        <td>{t.transparent ? "✅" : "—"}</td>
                        <td className={t.m.net >= 0 ? "pos" : "neg"}>
                          <b>{fmtM(t.m.net)}</b>
                        </td>
                        <td>{t.m.defaults}</td>
                        <td>{pct(t.m.trust)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="note">
                <b>สิ่งที่ต้องให้ผู้เรียนค้นพบเอง:</b> เมื่อฉีดความล้มเหลวชุดเดียวกัน
                การเปลี่ยนแค่ช่อง “แจ้งผู้ใช้” จาก — เป็น ✅ มักให้ผลดีกว่าการเปลี่ยนกลยุทธ์ทั้งหมด
                เพราะมนุษย์ที่<b>รู้ว่าระบบกำลังเสื่อม</b>จะกลับมาใช้วิจารณญาณ
                ส่วนมนุษย์ที่ไม่รู้จะเซ็นอนุมัติตามระบบไปเรื่อยๆ
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          ลำดับการสาธิตที่ได้ผลที่สุด: (1) รันสภาพปกติให้เห็นฐาน (2) เปิด “ข้อมูลค้าง 2 วัน”
          อย่างเดียวโดยยังไม่แจ้งผู้ใช้ — ชี้ให้ดูว่าหน้าจอขวา<b>ไม่เปลี่ยนเลย</b> ทั้งที่ระบบพังไปแล้ว
          (3) เปิดสวิตช์แจ้งผู้ใช้แล้วรันซ้ำด้วยเงื่อนไขเดิม ให้ผู้เรียนอธิบายว่าเหตุใดตัวเลขจึงดีขึ้น
          ทั้งที่ <b>ไม่ได้ซ่อมอะไรเลยสักอย่าง</b> — คำตอบคือ สถาปัตยกรรมไม่ได้แค่กำหนดว่าระบบทำอะไร
          แต่กำหนดว่ามนุษย์จะรู้อะไร
        </p>
      </div>
    </>
  );
}

function Cmp({
  label,
  base,
  now,
  invert,
  money,
}: {
  label: string;
  base: number;
  now: number;
  invert?: boolean;
  money?: boolean;
}) {
  const d = now - base;
  const better = invert ? d < 0 : d > 0;
  const same = Math.abs(d) < 0.05;
  const f = (n: number) => (money ? fmtM(n) : Math.round(n).toLocaleString("th-TH"));
  return (
    <div className="cmprow">
      <span>{label}</span>
      <div className="row" style={{ gap: 10 }}>
        <span className="muted">ฐาน {f(base)}</span>
        <b className={same ? "" : better ? "pos" : "neg"}>{f(now)}</b>
        {!same && (
          <span className={better ? "pos" : "neg"} style={{ fontSize: 12 }}>
            ({d > 0 ? "+" : "−"}
            {f(Math.abs(d))})
          </span>
        )}
      </div>
    </div>
  );
}
