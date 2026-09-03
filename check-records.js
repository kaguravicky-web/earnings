// 记录闸门：发布前必须通过。任何一条不满足就 exit 1。
// 用法：node check-records.js
//
// 核心规则：同一个数字不要在多个字段里反复复述。
// 每个字段各做各的事——数字住在 metrics，其他字段引用它、不重讲它。
//   accel                 方向：本季 → 下季，只讲方向
//   business.whatChanged  本季变了什么
//   decision              结论、if-then、证伪条件
//   metrics               数字本身（数字的家）
//   management_highlights 管理层口径与原话
//   narrative             多空双方怎么论证，不复述数字
//   vic_notes / outcome   独立观点与事后结果
const fs = require('fs');

const s = fs.readFileSync('index.html', 'utf8');
const a = s.indexOf('const RECORDS = [');
const e = s.indexOf('\n];', a);
if (a < 0 || e < 0) { console.error('FAIL: 找不到 RECORDS 锚点'); process.exit(1); }
const RECORDS = new Function(s.slice(a, e + 3) + ';return RECORDS;')();

const GATE_FROM = '2026-09-01';  // 只对这天起的新记录强制；更早的记录不回头改，只提示
const MAX_FIELDS = 3;   // 同一个数字最多允许出现在几个字段组里
const errors = [];
const warns = [];

const flat = v => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(flat).join(' ');
  if (typeof v === 'object') return Object.values(v).map(flat).join(' ');
  return String(v);
};

// 只数「有辨识度」的数字：百分比、金额。裸年份/小整数不算。
const tokens = t => {
  const out = new Set();
  (t.match(/[+\-−]?\d+(?:\.\d+)?\s*%/g) || []).forEach(x => out.add(x.replace(/[\s+\-−]/g, '') ));
  (t.match(/\d+(?:\.\d+)?\s*[亿万]美元/g) || []).forEach(x => out.add(x.replace(/\s/g, '')));
  return out;
};

RECORDS.forEach(r => {
  if (r.type !== 'earnings') return;
  const where = r.date + ' ' + r.ticker;

  const groups = {
    accel: flat(r.accel),
    whatChanged: flat(r.business && r.business.whatChanged),
    decision: flat(r.decision),
    metrics: flat(r.metrics),
    mgmt: flat(r.management_highlights),
    narrative: flat(r.narrative)
  };

  const seen = {};
  Object.keys(groups).forEach(g => {
    tokens(groups[g]).forEach(t => { (seen[t] = seen[t] || []).push(g); });
  });

  Object.keys(seen).forEach(t => {
    const gs = seen[t];
    if (gs.length > MAX_FIELDS) {
      (r.date >= GATE_FROM ? errors : warns).push(where + '：数字「' + t + '」在 ' + gs.length + ' 个字段里重复（' + gs.join('、') +
        '），上限 ' + MAX_FIELDS + '。数字住在 metrics，其他字段引用它、不要重讲。');
    }
  });

  // decision.summary 与 narrative.summary 高度重合 = 同一段写了两遍
  const ds = String((r.decision && r.decision.summary) || '');
  const ns = String((r.narrative && r.narrative.summary) || '');
  if (ds && ns) {
    const A = tokens(ds), B = tokens(ns);
    const inter = [...A].filter(x => B.has(x));
    if (A.size >= 3 && inter.length >= 3 && inter.length >= Math.min(A.size, B.size) * 0.6) {
      warns.push(where + '：decision.summary 与 narrative.summary 共用 ' + inter.length +
        ' 个相同数字（' + inter.join('、') + '），两段可能在讲同一件事。');
    }
  }
});

if (warns.length) console.warn('提示：' + warns.length + ' 项（' + GATE_FROM + ' 之前的历史记录，不回头改）');
if (errors.length) {
  console.error('记录闸门未通过（' + errors.length + ' 项）：');
  errors.forEach(x => console.error('  - ' + x));
  process.exit(1);
}
console.log('records ok（' + RECORDS.filter(r => r.type === 'earnings' && r.date >= GATE_FROM).length + ' 条新记录受闸门约束，单数字最多 ' + MAX_FIELDS + ' 个字段）');
