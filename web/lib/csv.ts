/**
 * ตัวช่วยโหลดและแปลง CSV สำหรับสื่อจำลอง
 *
 * สื่อจำลองอ่านไฟล์ CSV "ชุดเดียวกัน" กับที่นักศึกษาใช้ใน Google Colab
 * (public/datasets/ ถูกคัดลอกมาจาก datasets/ ที่ระดับ repo)
 * ตัวเลขที่เห็นบนหน้าจอกับที่ได้จากโค้ด Python จึงตรงกันเป๊ะ
 */

export type Row = Record<string, string>;

/** แปลงข้อความ CSV เป็นอาเรย์ของอ็อบเจกต์ รองรับฟิลด์ที่อยู่ในเครื่องหมายคำพูด */
export function parseCSV(text: string): Row[] {
  // ตัด BOM ที่มากับไฟล์ utf-8-sig
  const clean = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").trim();
  if (!clean) return [];

  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      cur.push(field);
      field = "";
    } else if (c === "\n") {
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
    } else field += c;
  }
  cur.push(field);
  rows.push(cur);

  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o: Row = {};
    header.forEach((h, i) => (o[h] = r[i] ?? ""));
    return o;
  });
}

export async function loadCSV(path: string): Promise<Row[]> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`โหลดไฟล์ไม่สำเร็จ: ${path} (${res.status})`);
  return parseCSV(await res.text());
}

export const num = (v: string | undefined): number => {
  const n = parseFloat((v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export const baht = (n: number, digits = 0) =>
  n.toLocaleString("th-TH", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const pctStr = (n: number, digits = 1) =>
  (n * 100).toLocaleString("th-TH", { minimumFractionDigits: digits, maximumFractionDigits: digits }) + "%";

/** ปุ่มดาวน์โหลดข้อมูลกลับเป็น CSV เพื่อนำไปใช้ต่อใน Colab */
export function downloadCSV(filename: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = [header.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const blob = new Blob(["﻿" + body], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
