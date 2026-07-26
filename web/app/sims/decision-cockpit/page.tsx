"use client";

import { useEffect, useRef, useState } from "react";
import {
  DIAGNOSES,
  Decision,
  EVENTS,
  MODE_NAME,
  MarketState,
  Mode,
  NQ,
  Outcome,
  PHASES,
  SEED,
  defaultAlts,
  fmt,
  money,
  mulberry32,
  predict,
  simulate,
} from "@/lib/cockpit";

type HistRow = Decision & { subs: number; churn: number; profit: number; fine: number };
type Screen = "start" | "play" | "end";
type Scores = Partial<Record<Mode, { cum: number; subs: number }>>;

const STORE = "dss_cockpit_scores";

export default function DecisionCockpit() {
  const [screen, setScreen] = useState<Screen>("start");
  const [mode, setMode] = useState<Mode | null>(null);
  const [scores, setScores] = useState<Scores>({});

  // สถานะเกม
  const [q, setQ] = useState(0);
  const [phase, setPhase] = useState(0);
  const [market, setMarket] = useState<MarketState>({ subs: 100, brand: 0.35 });
  const [cum, setCum] = useState(0);
  const [history, setHistory] = useState<HistRow[]>([]);
  const [alts, setAlts] = useState<Decision[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [dx, setDx] = useState<string | null>(null);
  const [dxCorrect, setDxCorrect] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [autoPicked, setAutoPicked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [sens, setSens] = useState(0);
  const [result, setResult] = useState<{ res: Outcome; pred: Outcome } | null>(null);

  const rngRef = useRef<() => number>(mulberry32(SEED));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) setScores(JSON.parse(raw));
    } catch {}
  }, []);

  const addLog = (t: string) =>
    setLogs((L) => [...L, `<b>Q${Math.min(q + 1, NQ)}</b> · ${t}`]);

  /* ---------- เริ่มเกม ---------- */
  function start(m: Mode) {
    rngRef.current = mulberry32(SEED);
    setMode(m);
    setQ(0);
    setPhase(0);
    setMarket({ subs: 100, brand: 0.35 });
    setCum(0);
    setHistory([]);
    setAlts([]);
    setChosen(null);
    setDx(null);
    setDxCorrect(null);
    setAutoPicked(false);
    setResult(null);
    setSens(0);
    setLogs(["<b>Q1</b> · เริ่มปีงบประมาณ — ฐานลูกค้าเริ่มต้น 100,000 ราย"]);
    setScreen("play");
  }

  /* ---------- ตัวจับเวลาโหมดสัญชาตญาณ ---------- */
  useEffect(() => {
    if (screen !== "play" || mode !== "gut" || phase !== 2) return;
    setTimeLeft(30);
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setChosen((c) => {
            if (c === null) {
              setAutoPicked(true);
              addLog("⏰ หมดเวลา — ระบบเลือกทางเลือกแรกให้อัตโนมัติ (satisficing แบบบังคับ)");
              return 0;
            }
            return c;
          });
          setPhase(3);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, mode, phase]);

  /* ---------- คำนวณผลเมื่อเข้าสู่ระยะ Implementation ---------- */
  useEffect(() => {
    if (screen !== "play" || phase !== 3 || chosen === null || result) return;
    const ev = EVENTS[q];
    const a = alts[chosen];
    const pred = predict(market, a, ev.truth, mode!);
    const res = simulate(market, a, ev.truth, rngRef.current);
    setResult({ res, pred });
    setMarket({ subs: res.subs, brand: res.brand });
    setCum((c) => c + res.profit);
    setHistory((h) => [
      ...h,
      { ...a, subs: res.subs, churn: res.churn, profit: res.profit, fine: res.fine },
    ]);
    addLog(
      `ดำเนินการ “${a.name}” ราคา ${a.price} บาท · งบตลาด ${a.marketing} ลบ. → กำไร ${money(
        res.profit
      )} ลบ.`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, chosen, screen]);

  /* ---------- ไปไตรมาสถัดไป ---------- */
  function nextQuarter() {
    const nq = q + 1;
    setResult(null);
    setChosen(null);
    setAlts([]);
    setDx(null);
    setDxCorrect(null);
    setAutoPicked(false);
    setSens(0);
    if (nq >= NQ) {
      const next: Scores = { ...scores, [mode!]: { cum, subs: market.subs } };
      setScores(next);
      try {
        localStorage.setItem(STORE, JSON.stringify(next));
      } catch {}
      setScreen("end");
    } else {
      setQ(nq);
      setPhase(0);
    }
  }

  /* ============================ หน้าเริ่มต้น ============================ */
  if (screen === "start") {
    const played = (Object.keys(scores) as Mode[]).filter((m) => scores[m]);
    return (
      <>
        <Head />
        <div className="card">
          <h2>สถานการณ์: ผู้จัดการผลิตภัณฑ์ บริษัทโทรคมนาคม</h2>
          <p>
            คุณรับผิดชอบแพ็กเกจรายเดือนของบริษัท <b>KSU Telecom</b> ต้องตัดสินใจ{" "}
            <b>ราคาแพ็กเกจ</b> และ <b>งบการตลาด</b> ทุกไตรมาส รวม 4 ไตรมาส
            เป้าหมายคือ <b>กำไรสะสมสูงสุด</b> โดยไม่ทำให้ฐานลูกค้าพังทลาย
          </p>
          <p className="muted">
            แต่ละไตรมาสคุณจะเดินผ่านกระบวนการตัดสินใจ 4 ระยะของ Herbert Simon —{" "}
            <b>Intelligence → Design → Choice → Implementation</b> —
            โดยระบบจะจำกัดข้อมูลที่คุณเห็นตามระยะที่อยู่ และตาม<b>ระดับเครื่องมือ</b>ที่เลือก
          </p>

          <h3>เลือกระดับเครื่องมือสนับสนุนการตัดสินใจ</h3>
          <div className="modes">
            {(
              [
                {
                  m: "gut" as Mode,
                  d: "ไม่มีระบบสารสนเทศใดๆ เห็นแค่ข่าวลือ ตัดสินใจจากประสบการณ์ และมีเวลาจำกัด 30 วินาที",
                  tag: "Bounded Rationality",
                  cls: "t-red",
                },
                {
                  m: "bi" as Mode,
                  d: "เห็นรายงานย้อนหลังและแนวโน้ม ตอบได้ว่า “เกิดอะไรขึ้น” แต่ไม่มีการพยากรณ์ผลของทางเลือก",
                  tag: "Business Intelligence",
                  cls: "t-amber",
                },
                {
                  m: "dss" as Mode,
                  d: "มีสัญญาณเตือน ตัวแบบพยากรณ์ผลของแต่ละทางเลือก ช่วงความไม่แน่นอน และการวิเคราะห์ความอ่อนไหว",
                  tag: "Decision Support",
                  cls: "t-green",
                },
              ] as const
            ).map((o) => (
              <div
                key={o.m}
                className={`mode${mode === o.m ? " sel" : ""}`}
                onClick={() => setMode(o.m)}
              >
                <b>{MODE_NAME[o.m]}</b>
                <span>{o.d}</span>
                <span className={`tag2 ${o.cls}`}>{o.tag}</span>
              </div>
            ))}
          </div>

          <div className="note">
            <b>เคล็ดลับการเรียนรู้:</b> เล่นให้ครบทั้ง 3 โหมด — ทุกโหมดเจอ
            <b>เหตุการณ์ชุดเดียวกันเป๊ะ</b> (ใช้ตัวเลขสุ่มชุดเดิม)
            ผลต่างของกำไรสะสมจึงมาจาก<b>คุณภาพของข้อมูลที่ใช้ตัดสินใจ</b>เท่านั้น ไม่ใช่โชค
          </div>

          <div className="row" style={{ marginTop: 14 }}>
            <button className="primary" disabled={!mode} onClick={() => start(mode!)}>
              เริ่มไตรมาสที่ 1 ▶
            </button>
            <button
              onClick={() => {
                localStorage.removeItem(STORE);
                setScores({});
              }}
            >
              ล้างผลที่บันทึกไว้
            </button>
            <div className="spacer" />
            <span className="muted">
              {played.length
                ? "เล่นแล้ว: " + played.map((m) => MODE_NAME[m]).join(" · ")
                : "ยังไม่เคยเล่นโหมดใด"}
            </span>
          </div>
        </div>
        <TeacherNote />
      </>
    );
  }

  /* ============================ หน้าสรุป ============================ */
  if (screen === "end") {
    const order: Mode[] = ["gut", "bi", "dss"];
    const vals = order.map((m) => scores[m]?.cum ?? null);
    const maxAbs = Math.max(
      ...(vals.filter((v) => v !== null) as number[]).map(Math.abs),
      1
    );
    const played = vals.filter((v) => v !== null).length;

    return (
      <>
        <Head />
        <div className="card">
          <h2>🏁 สรุปผลการดำเนินงาน 4 ไตรมาส — โหมด {MODE_NAME[mode!]}</h2>
          <div className="center" style={{ margin: "12px 0" }}>
            <div className="muted">กำไรสะสมทั้งปี</div>
            <div className={`big ${cum >= 0 ? "pos" : "neg"}`}>{money(cum)} ล้านบาท</div>
            <div className="muted">ฐานลูกค้าคงเหลือ {fmt(market.subs)} พันราย</div>
          </div>

          <h3>ผลรายไตรมาส</h3>
          <table>
            <thead>
              <tr>
                <th>ไตรมาส</th>
                <th>ทางเลือกที่ใช้</th>
                <th>ราคา</th>
                <th>ลูกค้า</th>
                <th>churn</th>
                <th>กำไร</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r, i) => (
                <tr key={i}>
                  <td>Q{i + 1}</td>
                  <td style={{ textAlign: "left" }}>{r.name}</td>
                  <td>{r.price}</td>
                  <td>{fmt(r.subs)}</td>
                  <td>{fmt(r.churn * 100)}%</td>
                  <td className={r.profit >= 0 ? "pos" : "neg"}>
                    <b>{money(r.profit)}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>เปรียบเทียบข้ามโหมด (เหตุการณ์ชุดเดียวกันทั้งหมด)</h3>
          {order.map((m) => {
            const v = scores[m]?.cum ?? null;
            const w = v === null ? 0 : (Math.abs(v) / maxAbs) * 100;
            return (
              <div key={m} style={{ marginBottom: 10 }}>
                <div className="row">
                  <span style={{ minWidth: 180 }}>{MODE_NAME[m]}</span>
                  <b className={v === null ? "muted" : v >= 0 ? "pos" : "neg"}>
                    {v === null ? "ยังไม่ได้เล่น" : money(v) + " ลบ."}
                  </b>
                </div>
                <div className="bar">
                  <i
                    style={{
                      width: `${w}%`,
                      background:
                        v === null ? "var(--line)" : v >= 0 ? "var(--ok)" : "var(--bad)",
                    }}
                  />
                </div>
              </div>
            );
          })}

          {played < 3 ? (
            <div className="note">
              ยังเล่นไม่ครบทุกโหมด — เล่นให้ครบทั้ง 3 เพื่อเห็นว่า
              <b>ผลต่างของกำไรมาจากคุณภาพข้อมูลที่ใช้ตัดสินใจล้วนๆ</b>{" "}
              เพราะเหตุการณ์ทุกโหมดเหมือนกันทุกประการ
            </div>
          ) : (
            <div className="note">
              <b>ข้อสรุปของการจำลอง:</b> ระยะ Intelligence ที่แม่นยำทำให้ทางเลือกในระยะ Design
              ตรงปัญหา · การพยากรณ์ในระยะ Choice ลดการเดา ·
              แต่ตัวแบบยังผิดได้เสมอเมื่อมีสัญญาณที่ระบบตรวจไม่พบ — DSS จึง<b>สนับสนุน</b>
              การตัดสินใจ ไม่ใช่<b>แทนที่</b>ผู้ตัดสินใจ
            </div>
          )}

          <h3>คำถามสะท้อนคิด (ใช้ตอบในใบงาน)</h3>
          <ol className="muted">
            <li>ไตรมาสใดที่การวินิจฉัยปัญหาในระยะ Intelligence ส่งผลต่อกำไรมากที่สุด เพราะเหตุใด</li>
            <li>ในโหมด DSS มีไตรมาสใดที่ตัวแบบพยากรณ์ผิดจนหลุดช่วงความไม่แน่นอน? อะไรคือสาเหตุ</li>
            <li>
              ถ้าเพิ่มระบบย่อยของ DSS ได้อีกหนึ่งอย่างเพื่อยกระดับผลลัพธ์ จะเพิ่มอะไร
              และวางไว้ที่ระยะใดของ Simon
            </li>
            <li>โหมดสัญชาตญาณจำกัดเวลา 30 วินาที — ผลที่ได้สะท้อน Bounded Rationality อย่างไร</li>
          </ol>

          <div className="row" style={{ marginTop: 14 }}>
            <button className="primary" onClick={() => setScreen("start")}>
              เล่นอีกครั้งด้วยโหมดอื่น
            </button>
            <button
              onClick={() => {
                localStorage.removeItem(STORE);
                setScores({});
                setScreen("start");
              }}
            >
              ล้างผลทั้งหมด
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ============================ หน้าเล่น ============================ */
  const ev = EVENTS[q];

  return (
    <>
      <Head
        hud={
          <>
            <div className="chip">
              โหมด<b style={{ fontSize: 13 }}>{MODE_NAME[mode!]}</b>
            </div>
            <div className="chip">
              ไตรมาส<b>{Math.min(q + 1, NQ)} / {NQ}</b>
            </div>
            <div className="chip">
              ลูกค้า<b>{fmt(market.subs)} พัน</b>
            </div>
            <div className="chip">
              กำไรสะสม<b className={cum >= 0 ? "pos" : "neg"}>{money(cum)} ลบ.</b>
            </div>
          </>
        }
      />

      <div className="steps">
        {PHASES.map((p, i) => (
          <div
            key={p.n}
            className={`step${i === phase ? " active" : ""}${i < phase ? " done" : ""}`}
          >
            <b>{p.n}</b>
            {p.d}
          </div>
        ))}
      </div>

      <div className="playgrid">
        <div>
          <div className="card">
            {/* ---------------- ระยะ 1 ---------------- */}
            {phase === 0 && (
              <>
                <h2>🔍 ระยะที่ 1 — Intelligence: ค้นหาและรับรู้ปัญหา</h2>
                <p className="muted">
                  ระยะนี้ยังไม่ต้องตัดสินใจ หน้าที่เดียวคือ<b>รับรู้ให้ได้ว่ากำลังเกิดอะไรขึ้น</b>{" "}
                  สังเกตว่าข้อมูลที่เห็นขึ้นกับระดับเครื่องมือที่เลือกไว้
                </p>
                <h3>สัญญาณที่ระบบของคุณจับได้</h3>
                {ev.signals[mode!].map((s, i) => (
                  <div className="sig" key={i}>
                    <span className="src">
                      {mode === "dss"
                        ? "ตัวแบบตรวจจับสัญญาณ"
                        : mode === "bi"
                        ? "รายงาน BI ย้อนหลัง"
                        : "ข่าวลือ / ประสบการณ์"}
                    </span>
                    {s}
                  </div>
                ))}
                {mode === "gut" && (
                  <div className="sig blur">
                    <span className="src">ข้อมูลที่คุณไม่มีสิทธิ์เข้าถึง</span>
                    ข้อมูลเชิงลึกถูกปิดกั้น เพราะองค์กรไม่มีระบบสารสนเทศรองรับ
                  </div>
                )}
                {ev.truth.priceCap && mode !== "dss" && (
                  <div className="sig blur">
                    <span className="src">ข้อมูลที่ระบบของคุณจับไม่ได้</span>
                    ข้อบังคับใหม่ที่มีผลต่อการตั้งราคา
                  </div>
                )}

                <h3>คุณวินิจฉัยว่าปัญหาหลักของไตรมาสนี้คืออะไร?</h3>
                {DIAGNOSES.map((o) => (
                  <div
                    key={o.k}
                    className={`alt pick${dx === o.k ? " sel" : ""}`}
                    style={{ padding: "10px 12px" }}
                    onClick={() => setDx(o.k)}
                  >
                    {o.t}
                  </div>
                ))}

                <div className="note">
                  <b>เชื่อมกับทฤษฎี:</b> ระยะ Intelligence คือจุดที่ Data Warehouse, OLAP
                  และการตรวจจับสัญญาณให้คุณค่าสูงสุด —
                  ถ้าวินิจฉัยปัญหาผิดตั้งแต่ระยะนี้ ทางเลือกที่ออกแบบในระยะถัดไปจะแก้ปัญหาผิดข้อทั้งหมด
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <div className="spacer" />
                  <button
                    className="primary"
                    disabled={!dx}
                    onClick={() => {
                      const ok = dx === ev.key;
                      setDxCorrect(ok);
                      addLog(
                        ok
                          ? `✅ วินิจฉัยปัญหาถูกต้อง (${ev.label})`
                          : `❌ วินิจฉัยปัญหาคลาดเคลื่อน — ความจริงคือ “${ev.label}”`
                      );
                      setAlts(defaultAlts(q, mode!));
                      setPhase(1);
                    }}
                  >
                    ไปสู่ระยะ Design ▶
                  </button>
                </div>
              </>
            )}

            {/* ---------------- ระยะ 2 ---------------- */}
            {phase === 1 && (
              <>
                <h2>✏️ ระยะที่ 2 — Design: สร้างทางเลือก</h2>
                <p className="muted">
                  ออกแบบทางเลือก 3 แบบที่<b>แตกต่างกันจริง</b> — ปรับราคาและงบการตลาดของแต่ละทางเลือก
                  ระยะนี้ยังไม่ต้องเลือก และ<b>ยังไม่เห็นผลพยากรณ์</b>
                </p>
                {ev.truth.priceCap && mode === "dss" && (
                  <div className="sig">
                    ⚖️ ข้อจำกัดที่ทราบ: ราคาสูงสุดตามกฎหมาย {ev.truth.priceCap} บาท —
                    ระบบล็อกสไลเดอร์ให้แล้ว
                  </div>
                )}
                <AltEditor
                  alts={alts}
                  setAlts={setAlts}
                  maxPrice={
                    mode === "dss" && ev.truth.priceCap ? ev.truth.priceCap : 899
                  }
                />
                <div className="note">
                  <b>เชื่อมกับทฤษฎี:</b>{" "}
                  คุณภาพของการตัดสินใจถูกจำกัดด้วยคุณภาพของทางเลือกที่คิดออก —
                  ถ้าทางเลือกทั้ง 3 คล้ายกันหมด ระยะ Choice จะไม่มีความหมาย
                  นี่คือเหตุผลที่ DSS ต้องมี Model Management ไว้ช่วยสร้างและจำลองทางเลือก
                  ไม่ใช่แค่เก็บข้อมูล
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <button onClick={() => setAlts(defaultAlts(q, mode!))}>คืนค่าเริ่มต้น</button>
                  <div className="spacer" />
                  <button className="primary" onClick={() => setPhase(2)}>
                    ไปสู่ระยะ Choice ▶
                  </button>
                </div>
              </>
            )}

            {/* ---------------- ระยะ 3 ---------------- */}
            {phase === 2 && (
              <>
                <h2>🎯 ระยะที่ 3 — Choice: เลือกทางเลือก</h2>
                {mode === "gut" && (
                  <div className="sig danger">
                    <span className="src">ข้อจำกัดของโหมดสัญชาตญาณ</span>
                    คุณมีเวลา <b>30 วินาที</b> ก่อนที่ประชุมบอร์ดจะเริ่ม —
                    ถ้าตัดสินใจไม่ทัน ระบบจะเลือกทางเลือกแรกให้อัตโนมัติ
                    <div className="row" style={{ marginTop: 8, alignItems: "baseline" }}>
                      <span className="timer">{timeLeft}</span>
                      <span className="muted">วินาที</span>
                    </div>
                    <div className="bar" style={{ marginTop: 6 }}>
                      <i style={{ width: `${(timeLeft / 30) * 100}%`, background: "var(--bad)" }} />
                    </div>
                  </div>
                )}
                <p className="muted">
                  {mode === "dss"
                    ? "ตัวแบบพยากรณ์ผลของแต่ละทางเลือกให้แล้ว พร้อมช่วงความไม่แน่นอน — แต่การตัดสินใจยังเป็นของคุณ"
                    : mode === "bi"
                    ? "คุณเห็นเฉพาะข้อมูลย้อนหลัง ไม่มีการพยากรณ์ว่าทางเลือกใดจะให้ผลอย่างไร"
                    : "ไม่มีข้อมูลสนับสนุนใดๆ"}
                </p>

                {alts.map((a, i) => (
                  <div key={i} className={`alt${chosen === i ? " sel" : ""}`}>
                    <div className="alt-head">
                      <b>{a.name}</b>
                      <button
                        className={chosen === i ? "primary" : ""}
                        onClick={() => setChosen(i)}
                      >
                        {chosen === i ? "เลือกแล้ว ✓" : "เลือกทางเลือกนี้"}
                      </button>
                    </div>
                    <div className="muted">
                      ราคา <span className="val">{a.price}</span> บาท/เดือน · งบการตลาด{" "}
                      <span className="val">{a.marketing}</span> ล้านบาท
                    </div>
                    {mode === "dss" ? (
                      <PredBox p={predict(market, a, ev.truth, "dss")} />
                    ) : mode === "bi" ? (
                      <div className="hidden-box">
                        📊 BI บอกได้แค่อดีต:{" "}
                        {history.length
                          ? `ไตรมาสก่อนราคา ${history[history.length - 1].price} บาท ได้กำไร ${money(
                              history[history.length - 1].profit
                            )} ลบ.`
                          : "ยังไม่มีข้อมูลย้อนหลังของแพ็กเกจนี้"}
                        <br />
                        <b>ไม่มีการพยากรณ์ผลของทางเลือกนี้</b>
                      </div>
                    ) : (
                      <div className="hidden-box">🧠 ไม่มีข้อมูลสนับสนุน — ตัดสินใจจากสัญชาตญาณ</div>
                    )}
                  </div>
                ))}

                {mode === "dss" && (
                  <>
                    <h3>🔬 การวิเคราะห์ความอ่อนไหว (Sensitivity Analysis)</h3>
                    <label>
                      ถ้าคู่แข่งตั้งราคาต่างจากที่ตัวแบบคาดไว้:{" "}
                      <span className="val">{sens > 0 ? "+" : ""}{sens}%</span>
                    </label>
                    <input
                      type="range"
                      min={-20}
                      max={20}
                      step={5}
                      value={sens}
                      onChange={(e) => setSens(+e.target.value)}
                    />
                    <div className="muted" style={{ marginTop: 6 }}>
                      {alts.map((a, i) => {
                        const t = {
                          ...ev.truth,
                          compPrice: ev.truth.compPrice * (1 + sens / 100),
                        };
                        const p = predict(market, a, t, "dss");
                        return (
                          <span key={i}>
                            {i > 0 && " · "}
                            {a.name}: กำไรคาดการณ์{" "}
                            <b className={p.profit >= 0 ? "pos" : "neg"}>{money(p.profit)}</b> ลบ.
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="note">
                  <b>เชื่อมกับทฤษฎี:</b>{" "}
                  {mode === "dss"
                    ? "นี่คือหน้าที่ของ Model Management Subsystem — ไม่ใช่ให้คำตอบเดียวจบ แต่ให้ผู้บริหารปรับตัวแปรแล้วเห็นผลทันที"
                    : mode === "bi"
                    ? "BI หยุดที่การรายงาน มนุษย์ต้องเดาต่อเองว่าอนาคตจะเป็นอย่างไร — นี่คือช่องว่างที่ Decision Intelligence พยายามอุด"
                    : "เมื่อข้อมูลและเวลาจำกัด มนุษย์จะไม่ optimize แต่จะ satisfice — เลือกสิ่งที่ “พอรับได้” ตามแนวคิด Bounded Rationality"}
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <div className="spacer" />
                  <button
                    className="primary"
                    disabled={chosen === null}
                    onClick={() => setPhase(3)}
                  >
                    ดำเนินการตามแผน ▶
                  </button>
                </div>
              </>
            )}

            {/* ---------------- ระยะ 4 ---------------- */}
            {phase === 3 && result && (
              <>
                <h2>🚀 ระยะที่ 4 — Implementation: ผลลัพธ์จริงและการเรียนรู้</h2>
                <div className="sig">
                  <span className="src">เหตุการณ์จริงที่เกิดขึ้นในไตรมาสนี้</span>
                  <b>{ev.label}</b> — ราคาคู่แข่งจริง {ev.truth.compPrice} บาท
                  {ev.truth.churnShock > 0 &&
                    ` · churn ส่วนเพิ่มจากเหตุการณ์ +${fmt(ev.truth.churnShock * 100, 0)} จุด`}
                  {ev.truth.costShock > 0 && ` · ต้นทุนพิเศษ ${ev.truth.costShock} ลบ.`}
                </div>

                <div className="pred" style={{ borderTop: "none", marginTop: 14 }}>
                  <div>
                    <span>ลูกค้าคงเหลือ</span>
                    <b>{fmt(result.res.subs)} พัน</b>
                  </div>
                  <div>
                    <span>อัตราการเลิกใช้จริง</span>
                    <b>{fmt(result.res.churn * 100)}%</b>
                  </div>
                  <div>
                    <span>กำไรไตรมาสนี้</span>
                    <b className={result.res.profit >= 0 ? "pos" : "neg"}>
                      {money(result.res.profit)} ลบ.
                    </b>
                  </div>
                </div>

                {result.res.fine > 0 && (
                  <div className="note warn">
                    <b>ถูกปรับจากหน่วยงานกำกับ {result.res.fine} ล้านบาท:</b>{" "}
                    คุณตั้งราคา {alts[chosen!].price} บาท ซึ่งเกินเพดาน {ev.truth.priceCap} บาท
                    ระบบบังคับลดราคาลงมาที่เพดานและปรับเงิน — นี่คือต้นทุนของการ
                    <b>ไม่รู้ข้อจำกัดในระยะ Intelligence</b>
                  </div>
                )}

                <h3>ตัวแบบพยากรณ์แม่นแค่ไหน?</h3>
                {mode === "dss" ? (
                  <>
                    <table>
                      <thead>
                        <tr>
                          <th>รายการ</th>
                          <th>ตัวแบบพยากรณ์</th>
                          <th>เกิดขึ้นจริง</th>
                          <th>คลาดเคลื่อน</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>กำไร (ลบ.)</td>
                          <td>{money(result.pred.profit)}</td>
                          <td>{money(result.res.profit)}</td>
                          <td
                            className={
                              Math.abs(result.res.profit - result.pred.profit) >
                              (result.pred.band ?? 10)
                                ? "neg"
                                : "pos"
                            }
                          >
                            {money(result.res.profit - result.pred.profit)}
                          </td>
                        </tr>
                        <tr>
                          <td>ลูกค้า (พัน)</td>
                          <td>{fmt(result.pred.subs)}</td>
                          <td>{fmt(result.res.subs)}</td>
                          <td>{money(result.res.subs - result.pred.subs)}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="note">
                      {Math.abs(result.res.profit - result.pred.profit) >
                      (result.pred.band ?? 10) ? (
                        <>
                          <b>บทเรียนสำคัญ:</b> ผลจริงหลุดออกนอกช่วงความไม่แน่นอนที่ตัวแบบระบุไว้ —
                          ตัวแบบ<b>ไม่ใช่ความจริง</b> มันคือแผนที่ ไม่ใช่ภูมิประเทศ
                          นี่คือเหตุผลที่ DSS ต้องมีมนุษย์กำกับเสมอ
                        </>
                      ) : (
                        <>
                          <b>ข้อสังเกต:</b> ผลจริงอยู่ในช่วงที่ตัวแบบคาดไว้ —
                          ตัวแบบทำงานได้ดีเมื่อสัญญาณถูกตรวจจับครบ
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="hidden-box">
                    โหมดนี้ไม่มีตัวแบบพยากรณ์ให้เปรียบเทียบ —
                    คุณไม่มีทางรู้เลยว่า “ถ้าเลือกอีกทางจะดีกว่าหรือไม่”
                  </div>
                )}

                {autoPicked && (
                  <div className="note warn">
                    <b>ผลของการหมดเวลา:</b>{" "}
                    คุณถูกบังคับให้เลือกทางเลือกแรกโดยไม่ได้พิจารณาครบ — นี่คือ Bounded
                    Rationality ในรูปธรรม
                  </div>
                )}
                {dxCorrect === false && (
                  <div className="note warn">
                    <b>ย้อนกลับไประยะ Intelligence:</b>{" "}
                    คุณวินิจฉัยปัญหาผิดตั้งแต่ต้นไตรมาส
                    ทางเลือกที่ออกแบบจึงมุ่งแก้ปัญหาคนละข้อกับที่เกิดขึ้นจริง
                  </div>
                )}

                <div className="row" style={{ marginTop: 14 }}>
                  <div className="spacer" />
                  <button className="primary" onClick={nextQuarter}>
                    {q + 1 >= NQ ? "ดูสรุปผลทั้งปี ▶" : `เริ่มไตรมาสที่ ${q + 2} ▶`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ---------------- แผงขวา ---------------- */}
        <div>
          <div className="card">
            <h2>📈 สถานะกิจการ</h2>
            <HistoryChart history={history} />
            <div className="legend">
              <span>
                <i style={{ background: "var(--acc)" }} />
                ลูกค้า (พันราย)
              </span>
              <span>
                <i style={{ background: "var(--gold)" }} />
                กำไร (ล้านบาท)
              </span>
            </div>
            {history.length > 0 && (
              <table style={{ marginTop: 10 }}>
                <thead>
                  <tr>
                    <th>ไตรมาส</th>
                    <th>ราคา</th>
                    <th>ลูกค้า</th>
                    <th>churn</th>
                    <th>กำไร</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((r, i) => (
                    <tr key={i}>
                      <td>Q{i + 1}</td>
                      <td>{r.price}</td>
                      <td>{fmt(r.subs)}</td>
                      <td>{fmt(r.churn * 100)}%</td>
                      <td className={r.profit >= 0 ? "pos" : "neg"}>
                        <b>{money(r.profit)}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="card">
            <h2>📜 บันทึกเหตุการณ์</h2>
            <div className="log">
              {logs.length ? (
                [...logs].reverse().map((l, i) => (
                  <div key={i} dangerouslySetInnerHTML={{ __html: l }} />
                ))
              ) : (
                <div className="muted">ยังไม่มีบันทึก</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <TeacherNote />
    </>
  );
}

/* ============================ ส่วนประกอบย่อย ============================ */

function Head({ hud }: { hud?: React.ReactNode }) {
  return (
    <div className="pagehead">
      <h1>
        🎛️ Decision Cockpit
        <small>จำลองการตัดสินใจตามกรอบของ Simon — สัปดาห์ที่ 1–2</small>
      </h1>
      <div className="row">{hud}</div>
    </div>
  );
}

function PredBox({ p }: { p: Outcome }) {
  return (
    <>
      <div className="pred">
        <div>
          <span>ลูกค้าที่คาดว่าจะเหลือ</span>
          <b>{fmt(p.subs)} พัน</b>
        </div>
        <div>
          <span>churn ที่คาดการณ์</span>
          <b>{fmt(p.churn * 100)}%</b>
        </div>
        <div>
          <span>กำไรที่คาดการณ์</span>
          <b className={p.profit >= 0 ? "pos" : "neg"}>
            {money(p.profit)} ± {fmt(p.band ?? 0, 0)}
          </b>
        </div>
      </div>
      <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
        ⚠️ ค่านี้มาจากตัวแบบ ไม่ใช่ความจริง — ช่วง ± คือความไม่แน่นอนที่ตัวแบบยอมรับว่ามี
      </div>
    </>
  );
}

function AltEditor({
  alts,
  setAlts,
  maxPrice,
}: {
  alts: Decision[];
  setAlts: (a: Decision[]) => void;
  maxPrice: number;
}) {
  const upd = (i: number, patch: Partial<Decision>) =>
    setAlts(alts.map((a, k) => (k === i ? { ...a, ...patch } : a)));
  return (
    <>
      {alts.map((a, i) => (
        <div className="alt" key={i}>
          <div className="alt-head">
            <b>{a.name}</b>
          </div>
          <label>
            ราคาแพ็กเกจ: <span className="val">{Math.min(a.price, maxPrice)}</span> บาท/เดือน
          </label>
          <input
            type="range"
            min={299}
            max={maxPrice}
            step={10}
            value={Math.min(a.price, maxPrice)}
            onChange={(e) => upd(i, { price: +e.target.value })}
          />
          <label style={{ marginTop: 8 }}>
            งบการตลาด: <span className="val">{a.marketing}</span> ล้านบาท/ไตรมาส
          </label>
          <input
            type="range"
            min={0}
            max={120}
            step={5}
            value={a.marketing}
            onChange={(e) => upd(i, { marketing: +e.target.value })}
          />
        </div>
      ))}
    </>
  );
}

function HistoryChart({ history }: { history: HistRow[] }) {
  if (!history.length)
    return (
      <p className="muted center" style={{ padding: "20px 0" }}>
        ยังไม่มีข้อมูล — จบไตรมาสแรกแล้วกราฟจะปรากฏ
      </p>
    );
  const W = 280,
    H = 120,
    P = 24;
  const maxS = Math.max(...history.map((r) => r.subs), 120);
  const profits = history.map((r) => r.profit);
  const maxP = Math.max(...profits, 10),
    minP = Math.min(...profits, -10);
  const x = (i: number) =>
    P + (history.length === 1 ? (W - 2 * P) / 2 : (i * (W - 2 * P)) / (history.length - 1));
  const yS = (v: number) => H - P - (v / maxS) * (H - 2 * P);
  const yP = (v: number) => H - P - ((v - minP) / (maxP - minP || 1)) * (H - 2 * P);
  const path = (vals: number[], f: (v: number) => number) =>
    vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${f(v).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="กราฟลูกค้าและกำไร">
      <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="var(--line)" />
      <path d={path(history.map((r) => r.subs), yS)} fill="none" stroke="var(--acc)" strokeWidth={2.5} />
      <path d={path(profits, yP)} fill="none" stroke="var(--gold)" strokeWidth={2.5} strokeDasharray="4 3" />
      {history.map((r, i) => (
        <circle key={`s${i}`} cx={x(i)} cy={yS(r.subs)} r={3} fill="var(--acc)" />
      ))}
      {profits.map((v, i) => (
        <circle key={`p${i}`} cx={x(i)} cy={yP(v)} r={3} fill="var(--gold)" />
      ))}
      {history.map((_, i) => (
        <text key={`t${i}`} x={x(i)} y={H - 6} fontSize={9} fill="var(--dim)" textAnchor="middle">
          Q{i + 1}
        </text>
      ))}
    </svg>
  );
}

function TeacherNote() {
  return (
    <div className="card">
      <h2>🎓 บันทึกสำหรับผู้สอน</h2>
      <p className="muted">
        การจำลองนี้ออกแบบให้เกิดข้อค้นพบ 4 ข้อ: (1) ระยะ Intelligence
        ที่อ่อนแอทำให้ทุกระยะถัดไปเสียเปล่า (2) BI ตอบได้แค่ “เกิดอะไรขึ้น”
        จึงยังตัดสินใจภายใต้ความไม่แน่นอนไม่ได้ (3) DSS ให้การพยากรณ์ที่ <b>ผิดได้</b> —
        ตัวแบบไม่ใช่ความจริง จึงต้องมีวิจารณญาณมนุษย์กำกับ (4)
        เวลาที่จำกัดบีบให้มนุษย์ satisfice ไม่ใช่ optimize ตามแนวคิด Bounded Rationality
      </p>
    </div>
  );
}
