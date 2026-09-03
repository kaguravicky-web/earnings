// 叙事闸门：发布前必须通过。任何一条不满足就 exit 1。
// 用法：node check-narratives.js
const fs = require('fs');

const s = fs.readFileSync('index.html', 'utf8');
const a = s.indexOf('const NARRATIVES = [');
const b = s.indexOf('const RECORDS = [');
if (a < 0 || b < 0) { console.error('FAIL: 找不到 NARRATIVES / RECORDS 锚点'); process.exit(1); }
const NARRATIVES = new Function(s.slice(a, b) + ';return NARRATIVES;')();

const MAX_PARA = 220;   // 单段上限
const errors = [];

NARRATIVES.forEach((n, idx) => {
  const where = 'rank ' + n.rank + '「' + n.theme + '」';

  if (!n || typeof n !== 'object') { errors.push('第 ' + (idx + 1) + ' 项为空'); return; }

  // 1) 不写负面主线：叙事只保留正向、可执行的主线
  if (/负面/.test(String(n.strength || ''))) {
    errors.push(where + '：strength 含“负面”。叙事不写负面主线，请删除该条或改写成可执行主线。');
  }

  // 2) 分段：长正文必须写成数组，避免渲染成一整块
  ['thesis', 'evidence', 'disconfirm'].forEach(f => {
    const v = n[f];
    if (v == null) return;
    if (typeof v === 'string' && v.length > MAX_PARA) {
      errors.push(where + '：' + f + ' 是长度 ' + v.length + ' 的单个字符串，超过 ' + MAX_PARA + '，必须改写成数组分段。');
    }
    if (Array.isArray(v)) {
      v.forEach((t, i) => {
        if (String(t).length > MAX_PARA) {
          errors.push(where + '：' + f + '[' + i + '] 长度 ' + String(t).length + '，超过单段上限 ' + MAX_PARA + '。');
        }
      });
    }
  });

  // 3) rank 连续
  if (n.rank !== idx + 1) errors.push(where + '：rank 应为 ' + (idx + 1) + '，实际 ' + n.rank + '，请重新编号。');

  // 4) 每条都要能被证伪
  const dc = Array.isArray(n.disconfirm) ? n.disconfirm.join('') : (n.disconfirm || '');
  if (!dc.trim()) errors.push(where + '：没有证伪条件。');
});


const REVIEW_DAYS = 7;  // 叙事每周复盘一次：超过这个天数未复盘就红
const num = v => parseFloat(String(v || '0').split('/')[0]) || 0;
const today = new Date();
const daysAgo = d => {
  const t = Date.parse(String(d) + 'T00:00:00Z');
  if (isNaN(t)) return null;
  return Math.floor((today - t) / 86400000);
};

// 5) 每周复盘：每条都要有 reviewedAt，且不得超过 REVIEW_DAYS 天
NARRATIVES.forEach(n => {
  const where = 'rank ' + n.rank + '「' + n.theme + '」';
  const d = daysAgo(n.reviewedAt);
  if (d === null) {
    errors.push(where + '：缺少 reviewedAt（YYYY-MM-DD）。叙事每周复盘一次，复盘后必须写回日期。');
  } else if (d > REVIEW_DAYS) {
    errors.push(where + '：reviewedAt 是 ' + n.reviewedAt + '，已 ' + d + ' 天未复盘，超过 ' + REVIEW_DAYS + ' 天上限。');
  }
});

// 6) 排名必须与强度一致：最热的排最前面，strength 降序
for (let i = 1; i < NARRATIVES.length; i++) {
  const prev = NARRATIVES[i - 1], cur = NARRATIVES[i];
  if (num(cur.strength) > num(prev.strength)) {
    errors.push('rank ' + cur.rank + '「' + cur.theme + '」strength ' + cur.strength +
      ' 高于前一条 rank ' + prev.rank + '「' + prev.theme + '」的 ' + prev.strength +
      '，但排在它后面。排名必须与强度一致，请重排或重打分。');
  }
}

// 7) 从未复盘过的要显式标出来，不能悄悄留着
NARRATIVES.forEach(n => {
  if (n.status === 'unreviewed' || n.statusAsOf === '待复盘') {
    console.warn('  ! rank ' + n.rank + '「' + n.theme + '」尚未做过状态复盘（strength ' + n.strength + ' 未经检验）。');
  }
});

if (errors.length) {
  console.error('叙事闸门未通过（' + errors.length + ' 项）：');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
console.log('narratives ok（' + NARRATIVES.length + ' 条，单段上限 ' + MAX_PARA + '，复盘周期 ' + REVIEW_DAYS + ' 天）');
