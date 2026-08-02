"use client";

import { useEffect, useMemo, useState } from "react";
import { Row, baht, loadCSV, num, pctStr } from "@/lib/csv";

const DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.UTC(2025, 8, 1 + i));
  return d.toISOString().slice(0, 10);
});

type Drift = "fail" | "ignore" | "automap";
type Partitioning = "fileDate" | "txnDate";

type Cfg = { fullReload: boolean; dedup: boolean; drift: Drift; part: Partitioning };

type DayLog = {
  day: string;
  fileRows: number;
  loaded: number;
  skipped: number;
  amount: number;
  status: "ok" | "empty" | "failed" | "partial";
  note: string;
};

type RunResult = {
  logs: DayLog[];
  totalRows: number;
  uniqueRows: number;
  totalAmount: number;
  misdated: number;
  failedDays: number;
};

function simulate(files: Row[][], cfg: Cfg): RunResult {
  const seen = new Set<string>();
  const logs: DayLog[] = [];
  let warehouse: { id: string; amount: number; partition: string; txnDate: string }[] = [];
  let failedDays = 0;

  files.forEach((rows, i) => {
    const day = DAYS[i];
    const hasDrift = i + 1 >= 12; // แฟ้มตั้งแต่วันที่ 12 เปลี่ยน schema
    let loaded = 0, skipped = 0, amount = 0;
    let status: DayLog["status"] = "ok";
    let note = "";

    if (rows.length === 0) {
      logs.push({ day, fileRows: 0, loaded: 0, skipped: 0, amount: 0, status: "empty",
        note: "แฟ้มว่าง — ต้องแยกให้ออกจาก “ท่อข้อมูลล้มเหลว”" });
      return;
    }

    if (hasDrift && cfg.drift === "fail") {
      failedDays++;
      logs.push({ day, fileRows: rows.length, loaded: 0, skipped: rows.length, amount: 0,
        status: "failed", note: "โครงสร้างไฟล์เปลี่ยน — งานล้มเหลว ข้อมูลทั้งวันไม่ถูกโหลด" });
      return;
    }

    if (cfg.fullReload) {
      warehouse = [];
      seen.clear();
    }

    for (const r of rows) {
      // อ่านคอลัมน์ยอดเงินตามวิธีจัดการ schema drift
      let amt: number;
      if (!hasDrift) amt = num(r.amount);
      else if (cfg.drift === "automap") amt = num(r.net_amount);
      else amt = num(r.amount); // "ignore" → คอลัมน์เดิมไม่มีแล้ว จึงได้ 0

      if (cfg.dedup && seen.has(r.txn_id)) { skipped++; continue; }
      seen.add(r.txn_id);

      const partition = cfg.part === "txnDate" ? r.txn_date : day;
      warehouse.push({ id: r.txn_id, amount: amt, partition, txnDate: r.txn_date });
      loaded++;
      amount += amt;
    }

    if (hasDrift && cfg.drift === "ignore" && amount === 0) {
      status = "partial";
      note = "โหลดแถวได้ครบ แต่คอลัมน์ยอดเงินกลายเป็น 0 เพราะชื่อคอลัมน์เปลี่ยน";
    } else if (skipped > 0) {
      note = `ข้ามแถวซ้ำ ${skipped} แถว`;
    } else if (i + 1 === 18) {
      note = "มีข้อมูลย้อนหลังของวันที่ 16–17 ปนมาในแฟ้มนี้";
    } else if (i + 1 === 23) {
      note = cfg.dedup ? "แฟ้มถูกส่งซ้ำ — ระบบตรวจจับได้" : "⚠️ แฟ้มถูกส่งซ้ำและถูกโหลดเข้าไปอีกรอบ";
    }

    logs.push({ day, fileRows: rows.length, loaded, skipped, amount, status, note });
  });

  const uniq = new Set(warehouse.map((w) => w.id));
  const misdated = warehouse.filter((w) => w.partition !== w.txnDate).length;

  return {
    logs,
    totalRows: warehouse.length,
    uniqueRows: uniq.size,
    totalAmount: warehouse.reduce((s, w) => s + w.amount, 0),
    misdated,
    failedDays,
  };
}

export default function EtlPipelineSim() {
  const [files, setFiles] = useState<Row[][] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [cfg, setCfg] = useState<Cfg>({ fullReload: false, dedup: false, drift: "ignore", part: "fileDate" });

  useEffect(() => {
    Promise.all(DAYS.map((d) => loadCSV(`/datasets/week03/daily_batches/batch_${d}.csv`)))
      .then(setFiles)
      .catch((e) => setErr(String(e)));
  }, []);

  const truth = useMemo(
    () => (files ? simulate(files, { fullReload: false, dedup: true, drift: "automap", part: "txnDate" }) : null),
    [files]
  );
  const run = useMemo(() => (files ? simulate(files, cfg) : null), [files, cfg]);

  if (err) return <div className="card"><h2>โหลดข้อมูลไม่สำเร็จ</h2><p className="muted">{err}</p></div>;
  if (!files || !truth || !run)
    return <div className="card"><h2>กำลังโหลดแฟ้มรายวัน 30 ไฟล์ …</h2></div>;

  const rowGap = run.totalRows - truth.uniqueRows;
  const amtGap = run.totalAmount - truth.totalAmount;
  const perfect = rowGap === 0 && Math.abs(amtGap) < 0.01 && run.misdated === 0;

  return (
    <>
      <div className="pagehead">
        <h1>
          🔁 ETL Pipeline Sim
          <small>รันท่อข้อมูล 30 วัน ที่มี schema drift ข้อมูลมาช้า และแฟ้มส่งซ้ำ — สัปดาห์ที่ 3</small>
        </h1>
        <div className="row">
          <div className="chip">แถวในคลัง<b className={rowGap === 0 ? "pos" : "neg"}>{baht(run.totalRows)}</b></div>
          <div className="chip">ควรเป็น<b>{baht(truth.uniqueRows)}</b></div>
        </div>
      </div>

      <div className="card">
        <h2>สถานการณ์</h2>
        <p>
          ระบบส่งแฟ้มยอดขายมาให้วันละหนึ่งไฟล์ ตลอดเดือนกันยายน 2025 แต่มีเหตุการณ์ 4 อย่างเกิดขึ้นระหว่างทาง —
          และ<b>ไม่มีใครแจ้งทีมข้อมูลล่วงหน้าสักเรื่องเดียว</b>
        </p>
        <ul className="symptoms">
          <li>วันที่ 12 — ต้นทางเปลี่ยนโครงสร้างไฟล์ เพิ่มคอลัมน์ <code>channel</code> และเปลี่ยนชื่อ <code>amount</code> → <code>net_amount</code></li>
          <li>วันที่ 18 — ข้อมูลของวันที่ 16 และ 17 มาช้า ปนมากับแฟ้มของวันนี้</li>
          <li>วันที่ 23 — ระบบส่งแฟ้มของวันที่ 22 ซ้ำมาอีกรอบ</li>
          <li>วันที่ 27 — แฟ้มมาถึงแต่ไม่มีข้อมูลข้างใน</li>
        </ul>
      </div>

      <div className="etlgrid">
        <div className="card">
          <h2>⚙️ ตั้งค่าท่อข้อมูล</h2>

          <h3>โหมดการโหลด</h3>
          <div className={`opt${!cfg.fullReload ? " sel" : ""}`} onClick={() => setCfg({ ...cfg, fullReload: false })}>
            <div className="opt-top"><b>Incremental — ต่อท้ายทุกวัน</b></div>
            <span className="muted">เร็วและถูก แต่ต้องจัดการเรื่องแถวซ้ำเอง</span>
          </div>
          <div className={`opt${cfg.fullReload ? " sel" : ""}`} onClick={() => setCfg({ ...cfg, fullReload: true })}>
            <div className="opt-top"><b>Full reload — ล้างแล้วโหลดใหม่ทุกวัน</b></div>
            <span className="muted">ปลอดภัยจากข้อมูลซ้ำ แต่เหลือเฉพาะข้อมูลของแฟ้มล่าสุด</span>
          </div>

          <h3>คีย์กันซ้ำ (Idempotency)</h3>
          <div className={`opt${cfg.dedup ? " sel" : ""}`} onClick={() => setCfg({ ...cfg, dedup: !cfg.dedup })}>
            <div className="opt-top"><b>{cfg.dedup ? "✅ ตรวจ txn_id ก่อนโหลด" : "⬜ ไม่ตรวจ"}</b></div>
            <span className="muted">รันท่อเดิมซ้ำแล้วผลต้องไม่เปลี่ยน — คุณสมบัติที่เรียกว่า idempotent</span>
          </div>

          <h3>จัดการ schema drift</h3>
          {([
            ["fail", "หยุดงานทันทีเมื่อโครงสร้างเปลี่ยน", "ปลอดภัยที่สุดแต่ข้อมูลหยุดไหลจนกว่าคนจะมาแก้"],
            ["ignore", "โหลดต่อไปโดยไม่สนใจคอลัมน์ที่เปลี่ยน", "งานไม่ล้ม แต่ค่าที่ได้อาจกลายเป็นศูนย์เงียบๆ"],
            ["automap", "จับคู่ชื่อคอลัมน์ใหม่กับของเดิม", "ต้องเขียนกฎ mapping ไว้ล่วงหน้าและมีการทดสอบ"],
          ] as [Drift, string, string][]).map(([k, l, d]) => (
            <div key={k} className={`opt${cfg.drift === k ? " sel" : ""}`} onClick={() => setCfg({ ...cfg, drift: k })}>
              <div className="opt-top"><b>{l}</b></div>
              <span className="muted">{d}</span>
            </div>
          ))}

          <h3>การจัดพาร์ทิชันข้อมูล</h3>
          {([
            ["fileDate", "ตามวันที่ของแฟ้ม", "ง่ายที่สุด แต่ข้อมูลที่มาช้าจะถูกบันทึกผิดวัน"],
            ["txnDate", "ตามวันที่เกิดธุรกรรมจริง", "รายงานย้อนหลังถูกต้อง แต่ต้องยอมให้ตัวเลขเก่าเปลี่ยนได้"],
          ] as [Partitioning, string, string][]).map(([k, l, d]) => (
            <div key={k} className={`opt${cfg.part === k ? " sel" : ""}`} onClick={() => setCfg({ ...cfg, part: k })}>
              <div className="opt-top"><b>{l}</b></div>
              <span className="muted">{d}</span>
            </div>
          ))}
        </div>

        <div>
          <div className="card">
            <h2>📊 ผลลัพธ์หลังรันครบ 30 วัน</h2>
            <div className="kpis">
              <div className="kpi big">
                <span>แถวในคลังข้อมูล</span>
                <b className={rowGap === 0 ? "pos" : "neg"}>{baht(run.totalRows)}</b>
              </div>
              <div className="kpi"><span>ควรเป็น</span><b>{baht(truth.uniqueRows)}</b></div>
              <div className="kpi">
                <span>ยอดรวม</span>
                <b className={Math.abs(amtGap) < 0.01 ? "pos" : "neg"}>{baht(run.totalAmount)}</b>
              </div>
              <div className="kpi">
                <span>คลาดจากยอดจริง</span>
                <b className={Math.abs(amtGap) < 0.01 ? "pos" : "neg"}>
                  {pctStr(amtGap / truth.totalAmount, 1)}
                </b>
              </div>
              <div className="kpi">
                <span>แถวที่ถูกบันทึกผิดวัน</span>
                <b className={run.misdated === 0 ? "pos" : "neg"}>{baht(run.misdated)}</b>
              </div>
              <div className="kpi">
                <span>วันที่งานล้มเหลว</span>
                <b className={run.failedDays === 0 ? "pos" : "neg"}>{run.failedDays}</b>
              </div>
            </div>

            {perfect ? (
              <div className="note good">
                <b>ท่อข้อมูลถูกต้องครบทุกมิติ ✓</b> — จำนวนแถวตรง ยอดเงินตรง และไม่มีแถวใดถูกบันทึกผิดวัน
                นี่คือชุดการตั้งค่าที่ควรใช้ในระบบจริง
              </div>
            ) : (
              <div className="note warn">
                <b>ยังมีปัญหา:</b>{" "}
                {rowGap > 0 && `มีแถวเกินมา ${baht(rowGap)} แถว · `}
                {rowGap < 0 && `ข้อมูลหายไป ${baht(-rowGap)} แถว · `}
                {Math.abs(amtGap) >= 0.01 && `ยอดเงินคลาด ${pctStr(amtGap / truth.totalAmount, 1)} · `}
                {run.misdated > 0 && `${baht(run.misdated)} แถวถูกบันทึกผิดวัน`}
              </div>
            )}

            {cfg.fullReload && (
              <div className="note warn">
                <b>Full reload ทุกวันคือกับดัก:</b> คลังข้อมูลเหลือเฉพาะข้อมูลของแฟ้มวันสุดท้ายเท่านั้น
                ประวัติทั้งเดือนหายไป — เป็นความผิดพลาดที่พบบ่อยเมื่อทีมกลัวข้อมูลซ้ำมากเกินไป
              </div>
            )}
            {cfg.drift === "ignore" && (
              <div className="note warn">
                <b>ความล้มเหลวที่เงียบที่สุด:</b> ตั้งแต่วันที่ 12 เป็นต้นไป จำนวนแถวยังครบทุกวัน
                งานไม่เคยล้ม ไม่มี error แต่<b>ยอดเงินกลายเป็นศูนย์</b> — รายงานยังออกได้ตามปกติ
                และไม่มีใครรู้จนกว่าจะมีคนสังเกตว่ายอดขายหายไปครึ่งเดือน
              </div>
            )}
          </div>

          <div className="card">
            <h2>📜 บันทึกการทำงานรายวัน</h2>
            <div className="tbl-wrap" style={{ maxHeight: 340, overflowY: "auto" }}>
              <table>
                <thead>
                  <tr><th>วันที่</th><th>แถวในแฟ้ม</th><th>โหลดเข้า</th><th>ยอดเงิน</th><th>หมายเหตุ</th></tr>
                </thead>
                <tbody>
                  {run.logs.map((l) => (
                    <tr key={l.day}>
                      <td>{l.day.slice(5)}</td>
                      <td>{baht(l.fileRows)}</td>
                      <td className={l.status === "failed" ? "neg" : ""}>{baht(l.loaded)}</td>
                      <td className={l.status === "partial" ? "neg" : ""}>{baht(l.amount)}</td>
                      <td style={{ textAlign: "left" }} className="muted">{l.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>🧪 ต่อยอดใน Google Colab</h2>
        <div className="row">
          <a href="/datasets/week03/daily_batches/batch_2025-09-01.csv" download>
            <button>⬇ ตัวอย่างแฟ้มวันที่ 1</button>
          </a>
          <a href="/datasets/week03/daily_batches/batch_2025-09-12.csv" download>
            <button>⬇ แฟ้มวันที่ 12 (schema เปลี่ยน)</button>
          </a>
        </div>
        <div className="note">
          <b>งานใน Colab:</b> เขียน incremental load ที่ idempotent (รันสองรอบแล้วจำนวนแถวต้องเท่าเดิม) ·
          ตรวจจับ schema drift อัตโนมัติ · จัดพาร์ทิชันตาม <code>txn_date</code> ·
          ทำ <code>etl_audit</code> รายวันแล้วพิสูจน์ว่ายอดรวมเท่ากับ{" "}
          <b>{baht(truth.totalAmount)} บาท</b> และมี <b>{baht(truth.uniqueRows)}</b> แถว
        </div>
      </div>

      <div className="card">
        <h2>🎓 บันทึกสำหรับผู้สอน</h2>
        <p className="muted">
          ให้ผู้เรียนเปรียบเทียบ 3 สถานการณ์: (1) ไม่มีคีย์กันซ้ำ → เห็นแถวเกินจากแฟ้มวันที่ 23
          (2) จัดการ schema drift แบบ “ไม่สนใจ” → เห็นว่าจำนวนแถวถูกต้องแต่ยอดเงินหาย
          (3) จัดพาร์ทิชันตามวันที่ของแฟ้ม → เห็นว่ารายงานวันที่ 16–17 ขาดหายทั้งที่ข้อมูลอยู่ในระบบแล้ว
          ทั้งสามกรณี <b>ท่อข้อมูลรายงานว่าทำงานสำเร็จทุกวัน</b> ซึ่งคือประเด็นทั้งหมดของบทเรียนนี้
        </p>
      </div>
    </>
  );
}
