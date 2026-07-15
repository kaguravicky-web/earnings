# 操作示例

## 1. 新增一条财报分析记录

打开 `财报交易助手.html`，找到 `const RECORDS = [` 后面的 `/* __RECORDS_INSERT_POINT__ */` 标记，在它下面插入一个新的对象字面量（新记录放最上面，旧记录往下排）。**注意这是 JavaScript 源码里的对象字面量，不是严格 JSON**——`report` 字段用反引号模板字符串包裹，可以直接写多行文本、直接用中文引号，不需要转义。

```js
const RECORDS = [
/* __RECORDS_INSERT_POINT__ */
{
  type: "earnings",
  date: "2026-07-16",
  ticker: "TSLA",
  company: "特斯拉",
  score: 62,
  rec: "repricing",
  dims: {quality:20, marketread:22, fundamentals:20},
  report: `【TSLA · 特斯拉】财报深度分析 · 2026-07-16
综合评分：62 / 100（财报成色，非买卖信号）
解读结论：🔄 预期重定价

─────────────────
（……这里放完整报告正文，格式参照系统提示词里"模式一标准输出格式"……）`,
  vic_notes: "",
  outcome: ""
},
{
  type: "earnings",
  date: "2026-07-14",
  ticker: "IBM",
  ...  // 已有的旧记录，保持不动
},
];
```

**插入后必须做的语法校验**（防止漏改收尾 `];` 导致页面崩溃，本次交接文档写作期间真实发生过这个事故）：

```bash
node -e "
const fs=require('fs');
const html=fs.readFileSync('财报交易助手.html','utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function fakeEl(){return {innerHTML:'',style:{},value:'',textContent:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelector(){return fakeEl();},querySelectorAll(){return [];},dataset:{}};}
global.document={querySelectorAll(){return [];},getElementById(){return fakeEl();},addEventListener(){}};
global.navigator={clipboard:{writeText(){return Promise.resolve();}}};
eval(script + ';globalThis.__R=RECORDS;');
console.log('OK, records=', globalThis.__R.length);
globalThis.__R.forEach(r=>console.log(r.ticker, r.score, r.rec));
"
```

如果这段脚本报错（比如 `Unexpected token`），说明对象字面量或数组括号没配平，回去检查刚插入的那段。如果正常打印出记录数量和列表，说明语法正确，再提交推送。

## 2. 补充 Vic 观点或复盘结果（T+更新）

找到对应 `ticker` + `date` 的那条记录，直接修改 `vic_notes` 或 `outcome` 字段（其余字段不动）：

```js
{
  type: "earnings",
  date: "2026-07-14",
  ticker: "IBM",
  company: "国际商业机器",
  score: 18,
  rec: "deterioration",
  dims: {quality:0, marketread:8, fundamentals:10},
  report: `……原有报告正文不动……`,
  vic_notes: "7/22电话会确认了全年指引下修，管理层承认客户预算转移比预期更持续，不是一次性的。",
  outcome: "-8.3%，T+5未能收复缺口，倾向于确认是结构性问题而非过度反应"
},
```

**约定：**
- `outcome` 字段如果以 `-`、"亏"、"止损"开头，页面会自动显示为红色，其余显示绿色——写复盘结论时留意这个隐式规则，别因为用词习惯（比如写"回撤"而不是"亏"）导致颜色显示和实际盈亏方向不符
- `vic_notes` 和 `outcome` 没有格式要求，自然语言即可，但建议注明是第几个交易日的复盘（T+几），因为目前没有专门字段记录复盘发生在哪一天

同样的语法校验步骤（见上）在改完之后也应该跑一遍。
