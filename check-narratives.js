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

if (errors.length) {
  console.error('叙事闸门未通过（' + errors.length + ' 项）：');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
console.log('narratives ok（' + NARRATIVES.length + ' 条，单段上限 ' + MAX_PARA + '）');
