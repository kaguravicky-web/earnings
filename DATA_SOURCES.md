# 数据源清单

> 前提说明：这份清单反映的是**本次会话（2026-07-14 GS/IBM分析）实际用过、验证过能用的方式**，不是一份预先设计好的数据架构。除了实时价格用了结构化的 LongBridge MCP 接口，其余全部通过通用网页搜索（WebSearch）临场查找，没有固定的"每次都查这个URL"的清单——下面列的网站/来源都是**这次搜索结果里出现过、且看起来可靠的**，不代表下次搜索一定还会命中同样的网站。

---

## 1. 财报实际值和市场预期（EPS/营收 actual vs consensus）

- **获取方式：** WebSearch，查询形如 `"{公司} Q{季度} {年份} earnings EPS revenue beat guidance"`
- **是否需要登录/订阅/API：** 否，纯网页搜索
- **本次实际命中的来源：** SEC 8-K 官方文件（sec.gov/Archives/edgar/...）、Alphastreet、gurufocus、CNBC、Yahoo Finance、Investing.com、MarketBeat
- **常见失败情况：** 不同聚合网站给出的"consensus 预期值"经常不完全一致（本次 IBM 的营收预期就出现过 $17.86B 和 $17.9B 两个版本），因为不同数据商（FactSet/Zacks/Refinitiv等）汇总分析师预期的方法本来就不完全一样
- **替代来源：** 如果 WebSearch 搜不到，可以直接查公司官方 Investor Relations 页面的 8-K/press release
- **冲突时以谁为准：** 本次采用的优先级是 **SEC官方文件 > 大型财经媒体（CNBC等）> 聚合类网站（Zacks式）**，但这是我自己定的惯例，不是 Vic 明确批准过的规则

## 2. 公司指引和分析师一致预期（forward guidance）

- **获取方式：** 同上，通常和"实际值vs预期"在同一批搜索结果里出现；管理层原话建议额外搜索 `"{公司} earnings call transcript"`
- **是否需要登录：** 否
- **本次命中来源：** Motley Fool（`fool.com/earnings/call-transcripts/...`）、Investing.com 会发布免费文字稿
- **常见失败情况：** 有些公司（尤其是银行/金融股）不发布传统意义上的"下季度EPS指引数字"，只有管理层定性表态——见 `HANDOVER.md` 第1.3节第2条
- **替代来源：** 公司官方 IR 页面的 webcast/transcript
- **冲突时以谁为准：** 官方文字稿 > 媒体转述

## 3. 近四季度历史惊喜（historical EPS/revenue surprise）

- **获取方式：** WebSearch，通常需要**逐季度分开搜索**才能拿到干净数字，例如 `"{公司} Q3 2025 earnings EPS actual estimate beat"`，一次性搜"近四季度"经常拿到时间线混乱或数字对不上的结果（本次就出现过一次搜索返回的"最近一季"和"上一季"数字明显不合理，怀疑是聚合页面缓存了不同ticker/不同时期的模板文本）
- **是否需要登录：** 否
- **本次命中来源：** gurufocus、公司官方8-K/press release、Zacks式聚合摘要
- **常见失败情况：** 见上——聚合类摘要有时给出的历史EPS绝对值和当季数量级明显不匹配（比如报了$4.33/$4.52这种和其他季度不在一个量级的数字），需要用常识判断是否被污染
- **替代来源（未验证，仅记录）：** ChartMill.com（`chartmill.com/stock/quote/{TICKER}/earnings`）、Seeking Alpha 的 "EPS Surprise Summary" 页面（`seekingalpha.com/symbol/{TICKER}/earnings/eps-surprise-summary`）——这两个在搜索结果标题里出现过，专门做这类历史归档，但本次没有实际打开验证是否要登录/是否好用，是一个值得下次尝试的效率优化点
- **冲突时以谁为准：** 逐季度交叉搜索、用同一数量级/同一份公司官方稿件校验，发现明显不合理的数字（和其他季度量级不符）就弃用重搜

## 4. 盘前、盘中、盘后价格

- **获取方式：** LongBridge MCP 工具 `quote-realtime-info`，传入 `symbol: ["TICKER.US"]`
- **是否需要登录/API：** 是，需要预先配置 LongBridge 连接器或官方 SDK。若运行环境没有现成连接器，需要另行配置（见 `HANDOVER.md` 第3节）
- **返回结构：** 顶层 `open/high/low/lastDone/prevClose/turnover/volume`（常规盘），加上独立的 `preMarketQuote{high,low,lastDone,prevClose,timestamp,turnover,volume}` 和 `postMarketQuote{同上}` 对象
- **常见失败情况：** 部分特殊代码（如 `BRK.B`）据了解无法用 `TICKER.US` 格式查询，会报 "Symbol must be in ticker.region format"（本次GS/IBM没有遇到，未在本项目内验证）
- **替代来源：** 已知可行的方案——直接用 `longport` 官方 Python SDK + 用户自己的 API 凭证（环境变量），绕开 MCP 层
- **冲突时以谁为准：** 结构化行情数据优先，但关键价格仍建议与交易所、公司公告或第二行情源核对

## 5. 成交量和历史平均成交量

- **获取方式：** 本应通过 LongBridge MCP `quote-history-candlesticks` 拉近20-30天K线算均量，**但该工具确认损坏**（见 `HANDOVER.md` 第3节第2条，无论传什么参数都报同一个 Zod 校验错误）
- **本次实际替代做法：** 从新闻报道里摘取定性描述（比如"创纪录成交日""公司史上最差交易日"这类措辞）配合报道里偶尔提到的具体股数/成交额，**没有真正算出"均量倍数"这个数字**，报告里对此如实标注了"待确认"或"精确均量倍数未能算出"
- **替代来源（已知可行但本项目未接入）：** `longport` Python SDK 直连，绕开 MCP
- **冲突时以谁为准：** 目前没有真实数据可比较

## 6. 分析师评级及目标价调整

- **获取方式：** WebSearch，查询形如 `"{公司} stock analyst price target raised reaction"`
- **是否需要登录：** 否
- **本次命中来源：** Benzinga、TipRanks、MarketBeat
- **常见失败情况：** 有时只能搜到"某几家上调"的摘要，凑不齐"总共多少家升评/降评"的精确计数（本次IBM就没搜到具体家数，报告里坦承了这个缺口）
- **替代来源：** 无特别验证过的替代
- **冲突时以谁为准：** 多篇报道列出的具体分析师+目标价数字如果一致，直接采用；凑不齐总数时如实标注信息不完整

## 7. 期权 IV、Put/Call 数据

- **获取方式：** **本项目至今没有真正获取过这类数据**，每次都标注"请提供barchart数据"，由 Vic 自己截图/手动提供
- **是否需要登录：** Barchart.com 有免费账号但页面浏览次数有限（未在本项目内实测过具体额度）
- **获取步骤（理论可行，本项目未采用）：** 若有浏览器自动化能力，可尝试直连 Barchart 对应页面（如 `/stocks/quotes/{TICKER}/max-pain-chart`、`/gamma-exposure`、`/put-call-ratios`）提取纯文本
- **常见失败情况：** 免费账号的页面浏览次数有限，超额会被限制，具体额度需自行验证
- **替代来源：** 无其他免费源验证过
- **冲突时以谁为准：** 不适用（没有多源数据）

## 8. 机构资金、暗池数据

- **获取方式：** **本项目至今没有找到任何来源**，每次都标注"待确认"
- **是否需要登录：** 未知
- **常见失败情况：** 没有尝试过具体网站
- **替代来源：** 未探索
- **冲突时以谁为准：** 不适用

## 9. 内部人交易

- **获取方式：** WebSearch，查询形如 `"{公司} insider trading 90 days SEC filings"`
- **是否需要登录：** 否
- **本次命中来源：** Benzinga（`/quote/{TICKER}/insider-trades`）、OpenInsider（`openinsider.com/{TICKER}`）、Quiver Quantitative、Yahoo Finance（`/quote/{TICKER}/insider-transactions`）、Fintel、GuruFocus
- **常见失败情况：** 不同来源披露的时间窗口和"买卖总额/次数"统计口径不完全一致，需要抓2个来源交叉确认
- **替代来源：** SEC EDGAR 官方 Form 4 filings 原始检索（`sec.gov`）
- **冲突时以谁为准：** SEC官方文件 > 三方聚合站

## 10. 行业指数和可比公司数据（同业read-through）

- **获取方式：** WebSearch，针对具体同业/同周期财报做定向搜索（如本次搜 `"JPMorgan Citigroup Wells Fargo Bank of America Q2 2026 earnings results"`）
- **是否需要登录：** 否
- **常见失败情况：** 部分行业找不到同期可比公司数据（本次 IBM 想找 Accenture/HPE/Dell 的同期数据但没搜到，报告里如实标注为信息缺口）
- **替代来源：** 无
- **冲突时以谁为准：** 不适用（数据本身稀缺，能拿到多少用多少）

## 11. SEC 文件、公司公告及电话会文字稿

- **获取方式：** WebSearch 通常会直接返回 sec.gov 的原始 8-K 链接；电话会文字稿另搜 `"earnings call transcript"`
- **是否需要登录：** 否（sec.gov 完全公开）
- **本次命中来源：** sec.gov/Archives/edgar/data/...、Motley Fool 文字稿
- **常见失败情况：** 无明显问题，这是本清单里最稳定可靠的一类来源
- **替代来源：** 公司官方 Investor Relations 页面
- **冲突时以谁为准：** SEC官方文件本身就是最高权威，不需要再比对
