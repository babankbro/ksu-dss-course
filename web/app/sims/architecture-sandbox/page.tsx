"use client";

import { useMemo, useState } from "react";
import {
  ArchConfig,
  MAXIMAL_CONFIG,
  MINIMAL_CONFIG,
  Metrics,
  REFERENCE_CONFIG,
  SLOTS,
  SlotKey,
  auditArchitecture,
  evaluate,
  fmtM,
  pct,
} from "@/lib/architecture";

type Saved = { name: string; cfg: ArchConfig; m: Metrics };

export default function ArchitectureSandbox() {
  const [cfg, setCfg] = useState<ArchConfig>({ ...MINIMAL_CONFIG });
  const [saved, setSaved] = useState<Saved[]>([]);
  const [ran, setRan] = useState(false);

  const metrics = useMemo(() => evaluate(cfg), [cfg]);
  const violations = useMemo(() => auditArchitecture(cfg), [cfg]);
  const monthlyCost = SLOTS.reduce((s, sl) => s + sl.options[cfg[sl.key]].cost, 0);

  const set = (k: SlotKey, v: number) => {
    setCfg((c) => ({ ...c, [k]: v }));
    setRan(false);
  };

  return (
    <>
      <div className="pagehead">
        <h1>
          🏗️ Architecture Sandbox
          <small>ประกอบสถาปัตยกรรม DSS เอง แล้วรันเคสจริง 800 คำขอ — สัปดาห์ที่ 2</small>
        </h1>
        <div className="row">
          <div className="chip">
            ต้นทุนระบบ<b>{monthlyCost.toLocaleString("th-TH")}k /เดือน</b>
          </div>
          <div className="chip">
            เวลาตัดสินใจ<b>{metrics.latency} ชม.</b>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>โจทย์</h2>
        <p>
          ธนาคารให้คุณออกแบบสถาปัตยกรรมระบบอนุมัติสินเชื่อรายย่อย เป้าหมายคือ{" "}
          <b>กำไรสุทธิสูงสุด</b> โดยไม่ละเมิดข้อบังคับ และต้องตอบผู้ตรวจสอบได้
        </p>
        <p className="muted">
          ระบบจำลอง <b>800 เคสตัวอย่าง (200 ต่อไตรมาส × 4 ไตรมาส)</b> แล้วขยายผลทางธุรกิจกลับเป็นพอร์ตจริง
          ขนาด 3,000 คำขอต่อไตรมาส · ต้นทุนระบบเป็นค่าคงที่รายเดือนไม่ขึ้นกับปริมาณเคส
        </p>
        <p className="muted">
          เลือกองค์ประกอบของแต่ละระบบย่อย — แต่ละตัวเลือกมีต้นทุนและเวลาแฝงต่างกัน
          กรอบเวลาตัดสินใจของธุรกิจคือ <b>48 ชั่วโมง</b> เกินกว่านั้นลูกค้าจะไปหาคู่แข่ง
        </p>
        <div className="row">
          <button onClick={() => { setCfg({ ...MINIMAL_CONFIG }); setRan(false); }}>เริ่มจากขั้นต่ำสุด</button>
          <button onClick={() => { setCfg({ ...REFERENCE_CONFIG }); setRan(false); }}>โหลดสถาปัตยกรรมอ้างอิง</button>
          <button onClick={() => { setCfg({ ...MAXIMAL_CONFIG }); setRan(false); }}>ทุ่มงบสูงสุดทุกช่อง</button>
        </div>
      </div>

      <div className="archgrid">
        {/* ---------- ซ้าย: แผงประกอบ ---------- */}
        <div>
          <div className="card">
            <h2>🧩 ประกอบสถาปัตยกรรม</h2>
            {SLOTS.map((sl) => (
              <div className="slot" key={sl.key}>
                <div className="slot-head">
                  <span className="ico">{sl.icon}</span>
                  <div>
                    <b>{sl.label}</b>
                    <small>{sl.subsystem}</small>
                  </div>
                </div>
                <div className="slot-q">❓ {sl.question}</div>
                <div className="opts">
                  {sl.options.map((o, i) => (
                    <div
                      key={i}
                      className={`opt${cfg[sl.key] === i ? " sel" : ""}`}
                      onClick={() => set(sl.key, i)}
                    >
                      <div className="opt-top">
                        <b>{o.label}</b>
                        <span className="opt-cost">
                          {o.cost === 0 ? "ฟรี" : `${o.cost}k/ด.`}
                          {o.latency > 0 && ` · +${o.latency} ชม.`}
                        </span>
                      </div>
                      <span className="muted">{o.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- ขวา: ผลลัพธ์ ---------- */}
        <div>
          <div className="card">
            <h2>🗺️ สถาปัตยกรรมที่คุณประกอบได้</h2>
            <FlowDiagram cfg={cfg} />
          </div>

          <div className="card">
            <h2>🔎 ผลการตรวจสอบสถาปัตยกรรม</h2>
            {violations.length === 0 ? (
              <div className="note good">
                <b>ไม่พบ anti-pattern ที่รู้จัก</b> — สถาปัตยกรรมนี้ครบทุกชั้นความรับผิดชอบ
                เหลือเพียงคำถามว่าคุ้มค่าต้นทุนหรือไม่
              </div>
            ) : (
              violations.map((v, i) => (
                <div key={i} className={`note ${v.severity === "สูง" ? "warn" : ""}`}>
                  <b>{v.antipattern}</b> <span className="sev">{v.severity}</span>
                  <br />
                  {v.detail}
                </div>
              ))
            )}
            <div className="row" style={{ marginTop: 12 }}>
              <button className="primary" onClick={() => setRan(true)}>
                ▶ รัน 800 คำขอผ่านสถาปัตยกรรมนี้
              </button>
              {ran && (
                <button
                  onClick={() =>
                    setSaved((s) => [...s, { name: `แบบที่ ${s.length + 1}`, cfg: { ...cfg }, m: metrics }])
                  }
                >
                  💾 เก็บผลไว้เปรียบเทียบ
                </button>
              )}
            </div>
          </div>

          {ran && <Results m={metrics} />}

          {saved.length > 0 && (
            <div className="card">
              <h2>📊 เปรียบเทียบสถาปัตยกรรมที่เก็บไว้</h2>
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>แบบ</th>
                      <th>กำไร</th>
                      <th>ต้นทุน</th>
                      <th>สุทธิ</th>
                      <th>ละเมิด</th>
                      <th>ตรวจสอบได้</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saved.map((s, i) => (
                      <tr key={i}>
                        <td style={{ textAlign: "left" }}>{s.name}</td>
                        <td>{fmtM(s.m.profit)}</td>
                        <td>{fmtM(s.m.cost)}</td>
                        <td className={s.m.net >= 0 ? "pos" : "neg"}>
                          <b>{fmtM(s.m.net)}</b>
                        </td>
                        <td className={s.m.violations > 0 ? "neg" : "pos"}>{s.m.violations}</td>
                        <td>{pct(s.m.auditability)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="note">
                <b>สิ่งที่ควรสังเกต:</b> สถาปัตยกรรมที่แพงที่สุดมักไม่ใช่สถาปัตยกรรมที่ให้กำไรสุทธิสูงสุด
                — การเพิ่มมนุษย์เข้าไปทุกเคสยกคุณภาพขึ้นจริง แต่ต้นทุนและเวลาแฝงอาจกินกำไรที่เพิ่มมาจนหมด
                นี่คือความหมายของคำว่า “สถาปัตยกรรมคือการแลกเปลี่ยน”
              </div>
              <button className="mini" onClick={() => setSaved([])} style={{ marginTop: 8 }}>
                ล้างตารางเปรียบเทียบ
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          ให้ผู้เรียนเริ่มจาก <b>ขั้นต่ำสุด</b> แล้วรันก่อน — จะได้กำไรติดลบมหาศาลจากค่าปรับและหนี้เสีย
          จากนั้นให้เพิ่มทีละชั้นและสังเกตว่า <b>ชั้นใดให้ผลตอบแทนต่อบาทที่ลงทุนสูงที่สุด</b>{" "}
          (คำตอบมักคือชั้นความรู้/กฎ ซึ่งราคาถูกที่สุดแต่ตัดค่าปรับออกได้เกือบทั้งหมด — ไม่ใช่โมเดล ML ที่แพงที่สุด)
          จบด้วยการกด “ทุ่มงบสูงสุดทุกช่อง” เพื่อแสดงว่าการลงทุนเกินความจำเป็นก็คือความล้มเหลวเชิงสถาปัตยกรรมรูปแบบหนึ่ง
        </p>
      </div>
    </>
  );
}

/* ============================ ส่วนประกอบย่อย ============================ */

function Results({ m }: { m: Metrics }) {
  const maxAbs = Math.max(...m.byQuarter.map((q) => Math.abs(q.profit)), 1);
  return (
    <div className="card">
      <h2>📈 ผลการรัน 800 คำขอ (4 ไตรมาส)</h2>
      <div className="kpis">
        <Kpi label="กำไรจากธุรกิจ" v={`${fmtM(m.profit)} ลบ.`} tone={m.profit >= 0 ? "ok" : "bad"} />
        <Kpi label="ต้นทุนระบบ" v={`${fmtM(m.cost)} ลบ.`} />
        <Kpi label="กำไรสุทธิ" v={`${fmtM(m.net)} ลบ.`} tone={m.net >= 0 ? "ok" : "bad"} big />
        <Kpi label="อนุมัติแล้วผิดนัด" v={String(m.defaults)} tone={m.defaults > 60 ? "bad" : undefined} />
        <Kpi
          label="อนุมัติผิดข้อบังคับ"
          v={String(m.violations)}
          tone={m.violations > 0 ? "bad" : "ok"}
        />
        <Kpi label="ปฏิเสธลูกค้าดี" v={String(m.lostGood)} />
        <Kpi label="ตัดสินใจไม่ทัน 48 ชม." v={String(m.missedWindow)} tone={m.missedWindow > 0 ? "bad" : "ok"} />
        <Kpi label="ส่งมนุษย์ทบทวน" v={String(m.humanReviewed)} />
      </div>

      <h3>คุณลักษณะคุณภาพ</h3>
      <Bar label="อธิบายเหตุผลได้ (Explainability)" v={m.explainability} />
      <Bar label="ตรวจสอบย้อนหลังได้ (Auditability)" v={m.auditability} />
      <Bar label="ความเชื่อมั่นของผู้ใช้ (Trust)" v={m.trust} />

      <h3>กำไรรายไตรมาสและความคลาดเคลื่อนของโมเดล</h3>
      <table>
        <thead>
          <tr>
            <th>ไตรมาส</th>
            <th>กำไร (ลบ.)</th>
            <th>ผิดนัดชำระ</th>
            <th>σ ของโมเดล</th>
          </tr>
        </thead>
        <tbody>
          {m.byQuarter.map((q) => (
            <tr key={q.q}>
              <td>Q{q.q}</td>
              <td className={q.profit >= 0 ? "pos" : "neg"}>
                <b>{fmtM(q.profit)}</b>
                <span
                  className="inlinebar"
                  style={{
                    width: `${(Math.abs(q.profit) / maxAbs) * 60}px`,
                    background: q.profit >= 0 ? "var(--ok)" : "var(--bad)",
                  }}
                />
              </td>
              <td>{q.defaults}</td>
              <td>{q.sigma.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="note">
        <b>อ่านคอลัมน์ σ ให้ดี:</b> ในไตรมาสที่ 3 ประชากรผู้ขอสินเชื่อเปลี่ยนไป (population drift)
        ถ้าสถาปัตยกรรมของคุณไม่มีการเฝ้าระวัง drift ค่า σ จะกระโดดขึ้นและ
        <b>ค้างอยู่อย่างนั้นตลอดไป</b> — นี่คือ Feedback Blindness ในรูปตัวเลข
      </div>
    </div>
  );
}

function Kpi({ label, v, tone, big }: { label: string; v: string; tone?: "ok" | "bad"; big?: boolean }) {
  return (
    <div className={`kpi${big ? " big" : ""}`}>
      <span>{label}</span>
      <b className={tone === "ok" ? "pos" : tone === "bad" ? "neg" : ""}>{v}</b>
    </div>
  );
}

function Bar({ label, v }: { label: string; v: number }) {
  const color = v > 0.7 ? "var(--ok)" : v > 0.4 ? "var(--warn)" : "var(--bad)";
  return (
    <div style={{ marginBottom: 9 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span style={{ fontSize: 13 }}>{label}</span>
        <b style={{ fontSize: 13 }}>{pct(v)}</b>
      </div>
      <div className="bar">
        <i style={{ width: `${v * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function FlowDiagram({ cfg }: { cfg: ArchConfig }) {
  const on = (k: SlotKey) => cfg[k] > 0;
  const node = (k: SlotKey, label: string) => {
    const sl = SLOTS.find((s) => s.key === k)!;
    return (
      <div className={`fnode${on(k) ? "" : " off"}`} key={k}>
        <span className="ico">{sl.icon}</span>
        <b>{label}</b>
        <small>{on(k) ? sl.options[cfg[k]].label : "ไม่มีในระบบ"}</small>
      </div>
    );
  };
  return (
    <>
      <div className="flow">
        <div className="fnode src">
          <span className="ico">📥</span>
          <b>คำขอสินเชื่อ</b>
          <small>200 เคส/ไตรมาส</small>
        </div>
        <span className="farrow">→</span>
        {node("data", "Data")}
        <span className="farrow">→</span>
        {node("model", "Model")}
        <span className="farrow">→</span>
        {node("knowledge", "Knowledge")}
        <span className="farrow">→</span>
        {node("ui", "UI")}
        <span className="farrow">→</span>
        {node("human", "Human")}
        <span className="farrow">→</span>
        <div className="fnode src">
          <span className="ico">✅</span>
          <b>ผลอนุมัติ</b>
          <small>action</small>
        </div>
      </div>
      <div className="flow cross">
        <div className={`fnode wide${on("quality") ? "" : " off"}`}>
          <span className="ico">🔍</span>
          <b>ตรวจคุณภาพข้อมูล</b>
          <small>{on("quality") ? "ทำงาน" : "ไม่มี — ข้อมูลเสียจะไหลผ่านโดยไม่มีใครรู้"}</small>
        </div>
        <div className={`fnode wide${on("feedback") ? "" : " off"}`}>
          <span className="ico">🔄</span>
          <b>วงจรป้อนกลับ</b>
          <small>{on("feedback") ? "ผลจริงย้อนกลับเข้าระบบ" : "ไม่มี — ระบบไม่มีวันรู้ว่าตนผิด"}</small>
        </div>
        <div className={`fnode wide${on("audit") ? "" : " off"}`}>
          <span className="ico">📜</span>
          <b>ร่องรอยตรวจสอบ</b>
          <small>{on("audit") ? "บันทึกครบ" : "ไม่มี — ตอบผู้ตรวจสอบไม่ได้"}</small>
        </div>
      </div>
    </>
  );
}
