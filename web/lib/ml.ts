/**
 * ฟังก์ชันพื้นฐานของ Data Mining ที่สื่อจำลองสัปดาห์ที่ 5–6 ใช้ร่วมกัน
 *
 * ทุกฟังก์ชันเป็นฟังก์ชันบริสุทธิ์และให้ผลเหมือนเดิมทุกครั้ง (deterministic)
 * เพื่อให้ตัวเลขบนหน้าจอตรงกับที่นักศึกษาคำนวณเองด้วย pandas/sklearn ใน Colab
 */

// ============================================================
// Confusion matrix และต้นทุนของความผิดพลาด
// ============================================================

export type Confusion = { tp: number; fp: number; fn: number; tn: number };

/** นับ TP/FP/FN/TN เมื่อทำนายว่า "ใช่" ทุกกรณีที่คะแนน >= threshold */
export function confusionAt(scores: number[], labels: number[], threshold: number): Confusion {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (let i = 0; i < scores.length; i++) {
    const pred = scores[i] >= threshold;
    if (labels[i] === 1) {
      if (pred) tp++; else fn++;
    } else if (pred) fp++;
    else tn++;
  }
  return { tp, fp, fn, tn };
}

export const precision = (c: Confusion) => (c.tp + c.fp ? c.tp / (c.tp + c.fp) : 0);
export const recall = (c: Confusion) => (c.tp + c.fn ? c.tp / (c.tp + c.fn) : 0);
export const accuracy = (c: Confusion) =>
  (c.tp + c.tn) / (c.tp + c.fp + c.fn + c.tn || 1);

export function f1(c: Confusion) {
  const d = 2 * c.tp + c.fp + c.fn;
  return d ? (2 * c.tp) / d : 0;
}

/** ต้นทุนรวมของความผิดพลาด — หัวใจของการเลือก threshold ในโลกจริง */
export const totalCost = (c: Confusion, costFN: number, costFP: number) =>
  c.fn * costFN + c.fp * costFP;

// ============================================================
// AUC (Mann–Whitney U) รองรับคะแนนที่ซ้ำกันด้วยอันดับเฉลี่ย
// ============================================================

export function auc(scores: number[], labels: number[]): number {
  const n = scores.length;
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => scores[a] - scores[b]);

  const rank = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && scores[idx[j + 1]] === scores[idx[i]]) j++;
    const avg = (i + j) / 2 + 1; // อันดับเริ่มที่ 1
    for (let k = i; k <= j; k++) rank[idx[k]] = avg;
    i = j + 1;
  }

  let nPos = 0, sumRankPos = 0;
  for (let k = 0; k < n; k++) {
    if (labels[k] === 1) { nPos++; sumRankPos += rank[k]; }
  }
  const nNeg = n - nPos;
  if (!nPos || !nNeg) return 0.5;
  return (sumRankPos - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
}

// ============================================================
// Entropy และ Information Gain สำหรับต้นไม้ตัดสินใจ
// ============================================================

/** entropy ของการจำแนกสองกลุ่ม รับจำนวนบวกและจำนวนทั้งหมด */
export function entropy(pos: number, n: number): number {
  if (n === 0) return 0;
  const p = pos / n;
  if (p === 0 || p === 1) return 0;
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

export type SplitResult = {
  gain: number;
  nLeft: number; nRight: number;
  posLeft: number; posRight: number;
  entLeft: number; entRight: number;
  entParent: number;
};

/**
 * ประเมินการแบ่งสองทาง
 * @param labels ป้ายกำกับ 0/1 ของทุกแถวในโหนดนี้
 * @param goLeft ผลของเงื่อนไขการแบ่งของแต่ละแถว
 */
export function evaluateSplit(labels: number[], goLeft: boolean[]): SplitResult {
  const n = labels.length;
  let nLeft = 0, posLeft = 0, pos = 0;
  for (let i = 0; i < n; i++) {
    if (labels[i] === 1) pos++;
    if (goLeft[i]) { nLeft++; if (labels[i] === 1) posLeft++; }
  }
  const nRight = n - nLeft;
  const posRight = pos - posLeft;
  const entParent = entropy(pos, n);
  const entLeft = entropy(posLeft, nLeft);
  const entRight = entropy(posRight, nRight);
  const weighted = (nLeft / n) * entLeft + (nRight / n) * entRight;
  return {
    gain: n === 0 ? 0 : entParent - weighted,
    nLeft, nRight, posLeft, posRight, entLeft, entRight, entParent,
  };
}

// ============================================================
// Logistic regression — gradient descent แบบเต็มชุด
//
// ตั้งใจใช้อัลกอริทึมที่เรียบง่ายและกำหนดค่าเริ่มต้นเป็นศูนย์
// เพื่อให้ผลลัพธ์ตรงกับโค้ด numpy ที่ให้นักศึกษาใน Colab ทุกทศนิยม
// ============================================================

export type Standardizer = { mu: number[]; sd: number[] };

export function fitStandardizer(X: number[][]): Standardizer {
  const d = X[0]?.length ?? 0;
  const mu = new Array(d).fill(0);
  const sd = new Array(d).fill(0);
  for (const row of X) for (let j = 0; j < d; j++) mu[j] += row[j];
  for (let j = 0; j < d; j++) mu[j] /= X.length;
  for (const row of X) for (let j = 0; j < d; j++) sd[j] += (row[j] - mu[j]) ** 2;
  // ใช้ตัวหาร n-1 ให้ตรงกับค่าเริ่มต้นของ pandas .std()
  for (let j = 0; j < d; j++) sd[j] = Math.sqrt(sd[j] / (X.length - 1)) || 1;
  return { mu, sd };
}

export const applyStandardizer = (X: number[][], s: Standardizer) =>
  X.map((row) => row.map((v, j) => (v - s.mu[j]) / s.sd[j]));

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** คืนค่าน้ำหนัก โดยตำแหน่งที่ 0 คือ intercept */
export function fitLogistic(X: number[][], y: number[], epochs = 400, lr = 0.5): number[] {
  const n = X.length;
  const d = X[0]?.length ?? 0;
  const w = new Array(d + 1).fill(0);

  for (let e = 0; e < epochs; e++) {
    const grad = new Array(d + 1).fill(0);
    for (let i = 0; i < n; i++) {
      let z = w[0];
      for (let j = 0; j < d; j++) z += w[j + 1] * X[i][j];
      const err = sigmoid(z) - y[i];
      grad[0] += err;
      for (let j = 0; j < d; j++) grad[j + 1] += err * X[i][j];
    }
    for (let j = 0; j <= d; j++) w[j] -= (lr * grad[j]) / n;
  }
  return w;
}

export function predictLogistic(X: number[][], w: number[]): number[] {
  return X.map((row) => {
    let z = w[0];
    for (let j = 0; j < row.length; j++) z += w[j + 1] * row[j];
    return sigmoid(z);
  });
}

export const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);

// ============================================================
// K-Means และการประเมินคุณภาพการแบ่งกลุ่ม
//
// ค่าเริ่มต้นของ centroid เลือกแบบกำหนดตายตัว (จุดที่ตำแหน่ง i×n/k)
// ไม่ใช่การสุ่ม เพื่อให้ผลเหมือนกันทุกครั้งและตรงกับโค้ด Python ใน Colab
// ============================================================

export type KMeansResult = { labels: number[]; centroids: number[][]; inertia: number };

const dist2 = (a: number[], b: number[]) => {
  let s = 0;
  for (let j = 0; j < a.length; j++) s += (a[j] - b[j]) ** 2;
  return s;
};

export function kmeans(X: number[][], k: number, maxIter = 100): KMeansResult {
  const n = X.length;
  const d = X[0].length;
  const centroids = Array.from({ length: k }, (_, i) => [...X[Math.floor((i * n) / k)]]);
  let labels = new Array<number>(n).fill(0);

  for (let it = 0; it < maxIter; it++) {
    const next = X.map((p) => {
      let best = 0, bestD = Infinity;
      for (let j = 0; j < k; j++) {
        const dd = dist2(p, centroids[j]);
        if (dd < bestD) { bestD = dd; best = j; }
      }
      return best;
    });
    if (next.every((v, i) => v === labels[i])) break;
    labels = next;

    for (let j = 0; j < k; j++) {
      const members = X.filter((_, i) => labels[i] === j);
      if (!members.length) continue;
      for (let c = 0; c < d; c++) {
        centroids[j][c] = members.reduce((s, p) => s + p[c], 0) / members.length;
      }
    }
  }

  const inertia = X.reduce((s, p, i) => s + dist2(p, centroids[labels[i]]), 0);
  return { labels, centroids, inertia };
}

/**
 * Silhouette score เฉลี่ยของทั้งชุด (ค่าอยู่ระหว่าง −1 ถึง 1)
 *
 * คำเตือนเชิงการสอน: ค่านี้ขึ้นกับ "สเกลของฟีเจอร์" จึงเทียบข้ามการปรับสเกลไม่ได้
 */
export function silhouette(X: number[][], labels: number[], k: number): number {
  const n = X.length;
  const groups: number[][] = Array.from({ length: k }, () => []);
  labels.forEach((l, i) => groups[l].push(i));

  let total = 0;
  for (let i = 0; i < n; i++) {
    const own = groups[labels[i]];
    if (own.length <= 1) continue;

    let a = 0;
    for (const j of own) if (j !== i) a += Math.sqrt(dist2(X[i], X[j]));
    a /= own.length - 1;

    let b = Infinity;
    for (let g = 0; g < k; g++) {
      if (g === labels[i] || !groups[g].length) continue;
      let sum = 0;
      for (const j of groups[g]) sum += Math.sqrt(dist2(X[i], X[j]));
      b = Math.min(b, sum / groups[g].length);
    }
    if (b === Infinity) continue;
    total += (b - a) / Math.max(a, b);
  }
  return total / n;
}
