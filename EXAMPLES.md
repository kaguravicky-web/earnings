# 维护示例

## 新增普通财报记录

在 `index.html` 的 `/* __RECORDS_INSERT_POINT__ */` 后插入：

```js
{
  type: "earnings",
  date: "2026-08-06",
  ticker: "XYZ",
  company: "Example Corp",
  sector: "tech",
  score: 72,
  rec: "doubt",
  dims: {quality:30, marketread:20, fundamentals:22},
  compare: {revenueGrowth:28, revenueGuidance:24},
  metrics: [
    {label:"Q2收入", value:"12.3亿美元", sub:"+28% YoY；高于约12.0亿美元预期", tone:"beat", pct:82},
    {label:"Q3收入指引", value:"13.0亿至13.2亿美元", sub:"中点隐含约+24% YoY", tone:"flat", pct:68},
    {label:"股价反应", value:"-6%", sub:"好数字未能满足高预期", tone:"down", pct:55}
  ],
  management_highlights: ["仅在大盘股、权重股或重要板块公司中填写管理层重点。"],
  narrative: {
    summary: "一句话说明市场正在交易什么。",
    consensus: "支持当前叙事的证据。",
    divergence: "最重要的分歧与反证。",
    signals: ["下一季度可以证实或证伪的指标。"]
  },
  sources: [{type:"公司公告", label:"Q2 results", url:"https://example.com"}],
  report: `【XYZ】2026 Q2财报分析

结论先说：……`,
  vic_notes: "",
  outcome: ""
},
```

`rec` 可用值：`resonance`、`doubt`、`repricing`、`deterioration`、`event`。

## 板块扩展字段

只有符合 `HANDOVER.md` 触发标准时才增加：

```js
extended: {
  coreConflict: "市场最重要的争论，不是重复财报数字。",
  growthPath: [
    {label:"Q1实际", value:"收入 +40%"},
    {label:"Q2实际", value:"收入 +52%"},
    {label:"Q3指引", value:"约 +47%"}
  ],
  managementClaim: "管理层如何解释增长、miss或指引。",
  externalEvidence: "第三方数据、价格反应与反叙事。",
  transmission: [
    {level:"直接受益", tickers:"AAA · BBB", impact:"具体传导机制和验证指标。"},
    {level:"竞争关系", tickers:"CCC · DDD", impact:"预算可能扩张，也可能被抢占。"},
    {level:"情绪高Beta", tickers:"EEE", impact:"只属于情绪映射，尚无基本面确认。"}
  ],
  checkpoints: ["下一季需要达到的数字或经营条件。"]
},
```

## 修改后的最低验证

```powershell
node -e "const fs=require('fs');const s=fs.readFileSync('index.html','utf8');const m=s.match(/<script>([\s\S]*?)<\/script>/);new Function(m[1]);console.log('script ok')"
git diff --check
```
