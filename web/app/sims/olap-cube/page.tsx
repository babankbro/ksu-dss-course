"use client";

import { useMemo, useState } from "react";
import {
  Cell,
  Challenge,
  Cube,
  DIMKEYS,
  DIMS,
  DimKey,
  FACTS,
  MEASURE_NAME,
  MONTHS,
  Measure,
  aggregate,
  baht,
  buildChallenges,
  buildSQL,
  combine,
  fmtMeasure,
  initialCube,
  lv,
  membersOf,
  passDice,
  val,
} from "@/lib/olap";

type Log = { op: string; text: string };

export default function OlapCubeExplorer() {
  const [cube, setCube] = useState<Cube>(initialCube);
  const [logs, setLogs] = useState<Log[]>([
    { op: "START", text: `โหลดลูกบาศก์: ${FACTS.length.toLocaleString("th-TH")} แถวข้อเท็จจริง · 3 มิติ` },
  ]);
  const [mark, setMark] = useState<string | null>(null);
  const [drill, setDrill] = useState<{ r: string; c: string } | null>(null);

  // โหมดท้าทาย
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [ops, setOps] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; ans: string } | null>(null);
  const [hintShown, setHintShown] = useState(false);

  const log = (op: string, text: string) => {
    setLogs((L) => [...L, { op, text }]);
    if (challenges && op !== "DRILL-THROUGH") setOps((o) => o + 1);
  };
  const update = (patch: Partial<Cube>, op: string, text: string) => {
    setCube((c) => ({ ...c, ...patch }));
    log(op, text);
  };

  /* ---------- คำนวณตาราง ---------- */
  const agg = useMemo(() => aggregate(cube), [cube]);
  const rowMembers = useMemo(
    () => membersOf(cube.rows, cube.level[cube.rows]).filter((v) => agg.has(v)),
    [agg, cube]
  );
  const colMembers = useMemo(
    () =>
      membersOf(cube.cols, cube.level[cube.cols]).filter((v) =>
        [...agg.values()].some((rm) => rm.has(v))
      ),
    [agg, cube]
  );

  const layerMembers = membersOf(cube.layer, cube.level[cube.layer]).filter(
    (v) => !cube.dice[cube.layer] || cube.dice[cube.layer]!.includes(v)
  );

  /* ---------- การกระทำ ---------- */
  const rollUp = (d: DimKey) => {
    const next = { ...cube, level: { ...cube.level, [d]: cube.level[d] - 1 } };
    if (d === cube.layer) next.slice = "ALL";
    setCube(next);
    log("ROLL-UP", `${DIMS[d].label} → ระดับ ${DIMS[d].levels[cube.level[d] - 1].label}`);
  };
  const drillDown = (d: DimKey) => {
    const next = {
      ...cube,
      level: { ...cube.level, [d]: cube.level[d] + 1 },
      dice: { ...cube.dice, [d]: null },
    };
    if (d === cube.layer) next.slice = "ALL";
    setCube(next);
    log("DRILL-DOWN", `${DIMS[d].label} → ระดับ ${DIMS[d].levels[cube.level[d] + 1].label}`);
  };
  const toggleDice = (d: DimKey, v: string) => {
    const mem = membersOf(d, cube.level[d]);
    let sel = cube.dice[d] ? [...cube.dice[d]!] : [...mem];
    sel = sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v];
    if (!sel.length) return; // ห้ามปิดหมด
    const nextSel = sel.length === mem.length ? null : sel;
    const next = { ...cube, dice: { ...cube.dice, [d]: nextSel } };
    if (cube.slice !== "ALL" && d === cube.layer && nextSel && !nextSel.includes(cube.slice))
      next.slice = "ALL";
    setCube(next);
    log("DICE", `${DIMS[d].label}: เลือก ${nextSel ? nextSel.length : mem.length} จาก ${mem.length} สมาชิก`);
  };
  const pivot = () =>
    update(
      { rows: cube.cols, cols: cube.rows },
      "PIVOT",
      `สลับแกน: แถว=${DIMS[cube.cols].label} คอลัมน์=${DIMS[cube.rows].label}`
    );
  const rotate = () =>
    update(
      { layer: cube.rows, rows: cube.cols, cols: cube.layer, slice: "ALL" },
      "ROTATE",
      `หมุนแกน: ชั้น=${DIMS[cube.rows].label}`
    );

  const drillThrough = (r: string, c: string) => {
    setMark(`${r}|${c}`);
    setDrill({ r, c });
    log("DRILL-THROUGH", `เจาะถึงธุรกรรมของช่อง “${r} × ${c}”`);
  };

  const drillRows = useMemo(() => {
    if (!drill) return [];
    return FACTS.filter(
      (f) =>
        passDice(cube, f) &&
        (cube.slice === "ALL" || lv(cube, cube.layer).get(f) === cube.slice) &&
        lv(cube, cube.rows).get(f) === drill.r &&
        lv(cube, cube.cols).get(f) === drill.c
    );
  }, [drill, cube]);

  /* ---------- โหมดท้าทาย ---------- */
  const startChallenge = () => {
    setChallenges(buildChallenges());
    setQIndex(0);
    setOps(0);
    setScore(0);
    setAnswer("");
    setFeedback(null);
    setHintShown(false);
    setLogs([{ op: "CHALLENGE", text: "เริ่มโหมดท้าทาย — ตอบให้ถูกโดยใช้การดำเนินการน้อยที่สุด" }]);
  };
  const submitAnswer = () => {
    if (!answer || !challenges) return;
    const c = challenges[qIndex];
    const ok = answer === c.ans;
    if (ok) setScore((s) => s + 1);
    setFeedback({ ok, ans: c.ans });
    setLogs((L) => [
      ...L,
      { op: "ANSWER", text: `ข้อ ${qIndex + 1}: ตอบ “${answer}” — ${ok ? "ถูก" : "ผิด (เฉลย " + c.ans + ")"}` },
    ]);
  };
  const nextQuestion = () => {
    setQIndex((i) => i + 1);
    setAnswer("");
    setFeedback(null);
    setHintShown(false);
  };

  /* ---------- ยอดรวม ---------- */
  const colTotals: Record<string, Cell> = {};
  colMembers.forEach((c) => (colTotals[c] = { sales: 0, units: 0 }));
  let grand: Cell = { sales: 0, units: 0 };
  const rowTotals: Record<string, Cell> = {};
  rowMembers.forEach((r) => {
    let t: Cell = { sales: 0, units: 0 };
    colMembers.forEach((c) => {
      const cell = agg.get(r)?.get(c);
      t = combine(t, cell);
      colTotals[c] = combine(colTotals[c], cell);
    });
    rowTotals[r] = t;
    grand = combine(grand, t);
  });

  return (
    <>
      <div className="pagehead">
        <h1>
          🧊 OLAP Cube Explorer
          <small>ลูกบาศก์ข้อมูล · Roll-up / Drill-down / Slice / Dice / Pivot — สัปดาห์ที่ 3–4</small>
        </h1>
        <div className="row">
          <button onClick={startChallenge}>🎯 โหมดท้าทาย</button>
          <button
            onClick={() => {
              setCube(initialCube());
              setDrill(null);
              setMark(null);
              log("RESET", "กลับสู่มุมมองเริ่มต้น");
            }}
          >
            ↺ เริ่มใหม่
          </button>
        </div>
      </div>

      {/* ---------- แถบโหมดท้าทาย ---------- */}
      {challenges &&
        (qIndex >= challenges.length ? (
          <div className="card">
            <h2>🏁 จบโหมดท้าทาย</h2>
            <p>
              ตอบถูก <b className="ok">{score}</b> จาก <b>{challenges.length}</b> ข้อ · ใช้การดำเนินการทั้งหมด{" "}
              <b>{ops}</b> ครั้ง
            </p>
            <div className="note">
              <b>ตีความคะแนน:</b> จำนวนการดำเนินการที่น้อยลงหมายถึงคุณ
              <b>แปลงคำถามธุรกิจเป็นเส้นทาง OLAP</b> ได้ตรงขึ้น
              ซึ่งเป็นทักษะที่ข้อสอบกลางภาคส่วน C วัดโดยตรง
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <button className="primary" onClick={startChallenge}>
                เล่นอีกครั้ง
              </button>
              <button onClick={() => setChallenges(null)}>กลับสู่โหมดสำรวจอิสระ</button>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="quest">
              <b>คำถามที่ {qIndex + 1}/{challenges.length}:</b> {challenges[qIndex].q}
            </div>
            <div className="row">
              <select
                style={{ maxWidth: 280 }}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              >
                <option value="">— เลือกคำตอบ —</option>
                {challenges[qIndex].opts.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              {feedback ? (
                <button className="primary" onClick={nextQuestion}>
                  ข้อถัดไป ▶
                </button>
              ) : (
                <button className="primary" onClick={submitAnswer} disabled={!answer}>
                  ตอบ
                </button>
              )}
              <button onClick={() => setHintShown(true)}>💡 ดูคำใบ้</button>
              <div className="spacer" />
              <div className="scoreline">
                <span>
                  ถูก <b className="ok">{score}</b>
                </span>
                <span>
                  ใช้ไปแล้ว <b>{ops}</b> การดำเนินการ
                </span>
                <span>
                  เกณฑ์มาตรฐานข้อนี้ <b>{challenges[qIndex].par}</b>
                </span>
              </div>
            </div>
            {hintShown && !feedback && (
              <div className="note">
                <b>คำใบ้:</b> {challenges[qIndex].hint}
              </div>
            )}
            {feedback && (
              <div className={`note ${feedback.ok ? "good" : "warn"}`}>
                {feedback.ok ? (
                  <b>ถูกต้อง ✓</b>
                ) : (
                  <>
                    <b>ยังไม่ถูก ✗</b> คำตอบที่ถูกคือ <b>{feedback.ans}</b>
                  </>
                )}
                <br />
                <span className="muted">เส้นทางที่สั้นที่สุด: {challenges[qIndex].hint}</span>
              </div>
            )}
          </div>
        ))}

      <div className="olap">
        {/* ---------- ซ้าย: แผงควบคุมมิติ ---------- */}
        <div>
          <div className="card">
            <h2>📐 มิติของลูกบาศก์</h2>
            <p className="muted" style={{ marginTop: -4 }}>
              แต่ละมิติวางอยู่บนแกนใดแกนหนึ่ง และมี “ระดับ” ของลำดับชั้นที่ปรับได้
            </p>
            {DIMKEYS.map((d) => {
              const axis =
                cube.rows === d ? "แถว (rows)" : cube.cols === d ? "คอลัมน์ (cols)" : "ชั้น (layers)";
              const isLayer = cube.layer === d;
              const L = DIMS[d].levels;
              const i = cube.level[d];
              const mem = membersOf(d, i);
              const sel = cube.dice[d];
              return (
                <div className="dimbox" key={d}>
                  <div className="t">
                    <span>{DIMS[d].label}</span>
                    <span className={`axis${isLayer ? " layer" : ""}`}>{axis}</span>
                  </div>
                  <div className="lvl">
                    ระดับปัจจุบัน: <b>{L[i].label}</b>{" "}
                    <span className="muted">
                      ({L.map((_, k) => (k === i ? "●" : "○")).join("")} {i + 1}/{L.length})
                    </span>
                  </div>
                  <div className="row">
                    <button className="mini" disabled={i === 0} onClick={() => rollUp(d)}>
                      ⬆ Roll-up
                    </button>
                    <button className="mini" disabled={i === L.length - 1} onClick={() => drillDown(d)}>
                      ⬇ Drill-down
                    </button>
                  </div>
                  {isLayer && (
                    <>
                      <label style={{ marginTop: 8 }}>Slice — เลือกดูชั้นเดียว</label>
                      <select
                        value={cube.slice}
                        onChange={(e) =>
                          update(
                            { slice: e.target.value },
                            "SLICE",
                            e.target.value === "ALL"
                              ? "ยกเลิกการตัดชั้น (ดูรวมทุกชั้น)"
                              : `ตัดเฉพาะชั้น “${e.target.value}”`
                          )
                        }
                      >
                        <option value="ALL">ทุกชั้นรวมกัน (ALL)</option>
                        {mem.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </>
                  )}
                  <label style={{ marginTop: 8 }}>Dice — กรองสมาชิก (คลิกเพื่อเปิด/ปิด)</label>
                  <div className="chips">
                    {mem.map((v) => (
                      <span
                        key={v}
                        className={`chk${!sel || sel.includes(v) ? " on" : ""}`}
                        onClick={() => toggleDice(d, v)}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="row" style={{ marginTop: 8 }}>
              <button onClick={pivot}>🔄 Pivot (สลับแถว↔คอลัมน์)</button>
              <button onClick={rotate}>🎲 หมุนแกน (เปลี่ยนมิติที่เป็นชั้น)</button>
            </div>
          </div>

          <div className="card">
            <h2>📏 ตัววัด (Measure)</h2>
            <select
              value={cube.measure}
              onChange={(e) =>
                update(
                  { measure: e.target.value as Measure },
                  "MEASURE",
                  `เปลี่ยนตัววัดเป็น ${MEASURE_NAME[e.target.value as Measure]}`
                )
              }
            >
              <option value="sales">ยอดขาย (บาท)</option>
              <option value="units">จำนวนชิ้น</option>
              <option value="asp">ราคาเฉลี่ยต่อชิ้น (บาท)</option>
            </select>
            <div className="note">
              <b>สังเกต:</b> “ราคาเฉลี่ยต่อชิ้น” เป็นตัววัดที่<b>รวมยอดตรงๆ ไม่ได้</b> (non-additive)
              ต้องคำนวณจากยอดขายหารจำนวนชิ้นในทุกระดับ — เป็นกับดักคลาสสิกของการออกแบบคลังข้อมูล
            </div>
          </div>
        </div>

        {/* ---------- กลาง: ลูกบาศก์ + ตาราง ---------- */}
        <div>
          <div className="card">
            <h2>🧊 มุมมองลูกบาศก์</h2>
            <CubeView
              cube={cube}
              layers={layerMembers}
              nRows={rowMembers.length}
              nCols={colMembers.length}
            />
            <div className="muted center" style={{ marginTop: 6 }}>
              {cube.slice === "ALL" ? (
                <>
                  กำลังดู <b>ทุกชั้นรวมกัน</b> — จำนวนช่องข้อมูลทั้งหมด {rowMembers.length}×
                  {colMembers.length}×{layerMembers.length} ={" "}
                  <b>{rowMembers.length * colMembers.length * layerMembers.length}</b> เซลล์
                </>
              ) : (
                <>
                  <b>Slice:</b> ตัดเฉพาะชั้น “{cube.slice}” จาก {layerMembers.length} ชั้น — เหลือ{" "}
                  {rowMembers.length}×{colMembers.length} ={" "}
                  <b>{rowMembers.length * colMembers.length}</b> เซลล์
                </>
              )}
            </div>
          </div>

          <div className="card">
            <h2>
              📋 {MEASURE_NAME[cube.measure]}
              {cube.slice !== "ALL" && ` · เฉพาะ “${cube.slice}”`}
              {cube.measure === "asp" && (
                <span className="muted" style={{ fontWeight: 400 }}>
                  {" "}
                  — แถว/คอลัมน์ “รวม” คำนวณใหม่จากยอดขาย÷จำนวนชิ้น ไม่ใช่การบวกค่าเฉลี่ย
                </span>
              )}
            </h2>
            <div className="tbl-wrap">
              <table className="pivot">
                <thead>
                  <tr>
                    <th>
                      {DIMS[cube.rows].label} · {lv(cube, cube.rows).label}
                    </th>
                    {colMembers.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                    <th>รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {rowMembers.map((r) => (
                    <tr key={r}>
                      <td>{r}</td>
                      {colMembers.map((c) => {
                        const cell = agg.get(r)?.get(c);
                        const key = `${r}|${c}`;
                        return (
                          <td
                            key={c}
                            className={`cell${mark === key ? " mark" : ""}`}
                            onClick={() => drillThrough(r, c)}
                          >
                            {cell ? fmtMeasure(cube, val(cube, cell)) : "—"}
                          </td>
                        );
                      })}
                      <td className="tot">{fmtMeasure(cube, val(cube, rowTotals[r]))}</td>
                    </tr>
                  ))}
                  <tr className="tot">
                    <td>รวม</td>
                    {colMembers.map((c) => (
                      <td key={c}>{fmtMeasure(cube, val(cube, colTotals[c]))}</td>
                    ))}
                    <td>{fmtMeasure(cube, val(cube, grand))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="muted" style={{ marginTop: 8 }}>
              คลิกที่ช่องใดก็ได้เพื่อ <b>Drill-through</b> ดูข้อมูลธุรกรรมที่ประกอบเป็นตัวเลขนั้น
            </div>
            {drill && (
              <div className="note">
                <b>Drill-through:</b> ช่อง “{drill.r} × {drill.c}” ประกอบขึ้นจากธุรกรรม{" "}
                {drillRows.length} แถว (แสดง {Math.min(6, drillRows.length)} แถวแรก)
                <table style={{ marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th>ปี-เดือน</th>
                      <th>หมวด</th>
                      <th>แบรนด์</th>
                      <th>จังหวัด</th>
                      <th>ชิ้น</th>
                      <th>ยอดขาย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drillRows.slice(0, 6).map((f, i) => (
                      <tr key={i}>
                        <td>
                          {f.year}-{MONTHS[f.month]}
                        </td>
                        <td>{f.cat}</td>
                        <td>{f.brand}</td>
                        <td>{f.prov}</td>
                        <td>{baht(f.units)}</td>
                        <td>{baht(f.sales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ---------- ขวา: SQL + log ---------- */}
        <div>
          <div className="card">
            <h2>🧮 SQL ที่เทียบเท่า</h2>
            <pre>
              <SqlHighlight sql={buildSQL(cube)} />
            </pre>
            <div className="note">
              <b>ประเด็นสำคัญ:</b> ทุกการดำเนินการ OLAP แปลงเป็น SQL ได้เสมอ — OLAP ไม่ใช่เวทมนตร์
              แต่คือชั้นที่ทำให้การถาม-ตอบข้อมูลหลายมิติทำได้เร็วและเป็นภาษาของธุรกิจ
            </div>
          </div>
          <div className="card">
            <h2>📜 บันทึกการดำเนินการ</h2>
            <div className="log">
              {[...logs].reverse().slice(0, 40).map((l, i) => (
                <div key={i}>
                  <span className="op">{l.op}</span>
                  <b>{l.text}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          ชุดข้อมูลถูกฝัง “ความผิดปกติ” ไว้สองจุดโดยเจตนา: (1)
          ยอดขายภาคอีสานตกผิดปกติในไตรมาส 3 ปี 2025 และ (2)
          หมวดเครื่องใช้ไฟฟ้ามีราคาเฉลี่ยต่อชิ้นสูงแต่จำนวนชิ้นต่ำ ทั้งสองจุด
          <b>มองไม่เห็นที่ระดับปีหรือระดับภูมิภาครวม</b> ต้อง drill-down ลงไปจึงจะพบ —
          ใช้สาธิตว่าเหตุใดการรายงานแบบสรุปรวมอย่างเดียวจึงทำให้ผู้บริหารพลาดปัญหา
          (และเป็นบทนำที่ดีสู่ Simpson&apos;s paradox)
        </p>
      </div>
    </>
  );
}

/* ============================ ส่วนประกอบย่อย ============================ */

function SqlHighlight({ sql }: { sql: string }) {
  const KEYWORDS = [
    "SELECT","FROM","JOIN","ON","WHERE","AND","GROUP BY","ORDER BY","ROLLUP","IN","AS",
  ];
  const parts = sql.split(/(\b(?:GROUP BY|ORDER BY|SELECT|FROM|JOIN|ON|WHERE|AND|ROLLUP|IN|AS)\b|SUM|NULLIF|'[^']*')/g);
  return (
    <>
      {parts.map((p, i) => {
        if (KEYWORDS.includes(p)) return <span key={i} className="kw">{p}</span>;
        if (p === "SUM" || p === "NULLIF") return <span key={i} className="fn">{p}</span>;
        if (p?.startsWith("'")) return <span key={i} className="st">{p}</span>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function CubeView({
  cube,
  layers,
  nRows,
  nCols,
}: {
  cube: Cube;
  layers: string[];
  nRows: number;
  nCols: number;
}) {
  const nR = Math.min(nRows, 12);
  const nC = Math.min(nCols, 12);
  const cs = Math.max(7, Math.min(15, 130 / Math.max(nR, nC, 1)));
  const a = 0.866 * cs;
  const b = 0.5 * cs;
  const W = 520;
  const H = 300;
  const baseX = W / 2 - 30;
  const baseY = 80 + layers.length * 13;

  // ความเข้มของแต่ละชั้นตามค่ารวม
  const layerVals = layers.map((L) => {
    let s = 0;
    for (const f of FACTS) {
      if (!passDice(cube, f)) continue;
      if (lv(cube, cube.layer).get(f) !== L) continue;
      s += cube.measure === "units" ? f.units : f.sales;
    }
    return s;
  });
  const mx = Math.max(...layerVals, 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="ลูกบาศก์ข้อมูล">
      {layers.map((L, k) => {
        const active = cube.slice === "ALL" || cube.slice === L;
        const dz = -k * 26;
        const tint = 0.25 + 0.75 * (layerVals[k] / mx);
        const cells = [];
        for (let r = 0; r < nR; r++)
          for (let c = 0; c < nC; c++) {
            const x0 = baseX + c * a - r * a;
            const y0 = baseY + c * b + r * b + dz;
            cells.push(
              <polygon
                key={`${r}-${c}`}
                points={`${x0},${y0} ${x0 + a},${y0 + b} ${x0},${y0 + 2 * b} ${x0 - a},${y0 + b}`}
                fill={cube.slice === L ? "#5b8cff" : "#8b5cf6"}
                fillOpacity={0.2 + 0.55 * tint}
                stroke="rgba(255,255,255,.22)"
                strokeWidth={0.6}
              />
            );
          }
        return (
          <g key={L} opacity={active ? 1 : 0.16}>
            {cells}
            <text
              x={baseX - nR * a - 12}
              y={baseY + nR * b + dz + 4}
              fontSize={11}
              fill={cube.slice === L ? "var(--acc)" : "var(--dim)"}
              textAnchor="end"
            >
              {L}
            </text>
          </g>
        );
      })}
      <text x={baseX + (nC * a) / 2 + 16} y={baseY + (nC * b) / 2 - 14} fontSize={11.5} fill="var(--acc)">
        ▸ {DIMS[cube.cols].label} · {lv(cube, cube.cols).label} ({nCols})
      </text>
      <text
        x={baseX - (nR * a) / 2 - 16}
        y={baseY + (nR * b) / 2 + 30}
        fontSize={11.5}
        fill="var(--acc)"
        textAnchor="end"
      >
        ◂ {DIMS[cube.rows].label} · {lv(cube, cube.rows).label} ({nRows})
      </text>
      <text x={W - 8} y={18} fontSize={11.5} fill="var(--acc2)" textAnchor="end">
        ⬍ {DIMS[cube.layer].label} · {lv(cube, cube.layer).label} ({layers.length} ชั้น)
      </text>
    </svg>
  );
}
