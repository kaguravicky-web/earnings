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

// 2026-09-10 Vic：「字太多、大段文字，读起来很累」。
// 排版那一半已经在 index.html 的 prose() 里收口（按句切段、真加粗），
// 但**单句 100~199 字**是排版救不了的——切不开就只能一路读到底，全站还剩 101 处。
// 所以字数这一半必须在写的时候就卡住。
//
// 阈值取自 9/1~9/9 那 14 条新记录的实际分布，对最肥的两个字段是真收紧不是走过场：
//   vic_notes 中位 414 → 上限 300；outcome 中位 435 → 上限 300。
// 单句上限 90 与 prose() 的 PROSE_SOFT 对齐：超过它排版就无能为力了。
const LEN_GATE_FROM = '2026-09-10';   // 长度闸门从今天起强制，之前的只提示
const MAX_SENTENCE = 90;
// outcome = 市场反应（2026-09-10 Vic 定名：「其实是市场反应，写的精简点」）。
// 它只该装两样东西：涨跌数据（起止价、区间、口径日）＋一句这说明什么。
// 现状是把解读、跨批次对比、对评分体系的议论全塞进来——ZS 那条 455 字。
// 上限压到 180：行情本身约 110 字，剩下 70 字只够写一句结论，写不下第二段议论。
const LIMITS = {
  'vic_notes': 300,
  'outcome': 180,
  'narrative.summary': 120,
  'narrative.consensus': 150,
  'narrative.divergence': 170,
  'decision.stance': 70,
  'business.plain': 130,
};
const pick = (r, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), r);
const longestSentence = t => Math.max(0, ...String(t || '')
  .split(/(?<=[。！？])/).map(x => x.trim().length));

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

  // 字数与单句长度
  const lenBucket = r.date >= LEN_GATE_FROM ? errors : warns;
  Object.keys(LIMITS).forEach(path => {
    const t = pick(r, path);
    if (typeof t !== 'string' || !t.trim()) return;
    if (t.length > LIMITS[path]) {
      lenBucket.push(where + '：' + path + ' ' + t.length + ' 字，超上限 ' + LIMITS[path] +
        '。删掉复述和铺垫，别把同一件事换个说法再讲一遍。');
    }
    const ls = longestSentence(t);
    if (ls > MAX_SENTENCE) {
      lenBucket.push(where + '：' + path + ' 有单句 ' + ls + ' 字（上限 ' + MAX_SENTENCE +
        '）。这种句子排版切不开，只能一路读到底——写的时候就断成两句。');
    }
  });

  // 跨行业比股价反应 / 评分排序（2026-09-10 Vic：「请不要跨行业对比股票财报反应」）
  // 起因：9/3 那批把 LULU（服装零售）和 PATH / GWRE / ZS / IOT（软件）放在一张分数表里比五日收益，
  // 写出「LULU 只有 38 分却跑赢了 68 分的 PATH 和 71 分的 GWRE」。
  // 不同板块的估值基准、资金属性、事件驱动都不一样，收益排序本来就不可比，
  // 这么写会让「评分不准」看起来是模型问题，其实只是把不该放一起的东西放一起了。
  // 同板块之间比是允许的——判据是同一句里是否出现跨板块的多个代码。
  const SECTOR = {
    LULU: '消费', WMT: '消费', COST: '消费', NKE: '消费',
    PATH: '软件', GWRE: '软件', ZS: '软件', IOT: '软件', SNOW: '软件', CRM: '软件',
    MDB: '软件', TTAN: '软件', S: '软件', CRWD: '软件', NET: '软件',
    AVGO: '半导体', MU: '半导体', NVDA: '半导体', CRDO: '半导体', DELL: '硬件', HPE: '硬件',
  };
  const CMP_RE = /跑赢|跑输|强于|弱于|优于|逊于|排序|相对反应|同一晚|同一批/;
  [flat(r.outcome), flat(r.vic_notes)].forEach(text => {
    String(text).split(/(?<=[。！？])/).forEach(sn => {
      if (!CMP_RE.test(sn)) return;
      const secs = [...new Set((sn.match(/\b[A-Z]{2,5}\b/g) || [])
        .map(t => SECTOR[t]).filter(Boolean))];
      if (secs.length > 1) {
        (r.date >= LEN_GATE_FROM ? errors : warns).push(where + '：跨行业比了股价反应（' +
          secs.join(' vs ') + '）——「' + sn.trim().slice(0, 40) +
          '…」。不同板块的估值基准和资金属性不同，收益排序不可比；要比就只比同板块。');
      }
    });
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
