# 财报助手

先回答“这家公司好不好”，再把交易动作绑定到明确证据、价格结构和时间，并持续验证上一季度的判断。

- 在线页面：<https://kaguravicky-web.github.io/earnings/>
- GitHub：<https://github.com/kaguravicky-web/earnings>
- 页面：白底、移动端优先、所有个股可展开和收起
- 研究框架：研究分析 + 交易决策两个页面
- 板块扩展：重要公司使用独立完整页面，再从主页链接进入
- 扩展交易模板：证伪清单 → 价格结构 → 事件日历 → 期权定价 → 情境树 → 反方检核，并在下季度 Loop

## 仓库结构

| 路径 | 用途 |
|---|---|
| `index.html` | GitHub Pages 页面；包含记录、叙事、并购跟踪、样式和交互 |
| `HANDOVER.md` | 给下一位 AI 的完整接手说明，修改前先读 |
| `prompts/系统提示词.md` | 当前唯一有效的研究规则 |
| `DATA_SOURCES.md` | 数据源优先级、常见失败和替代来源 |
| `EXAMPLES.md` | 新增记录和板块扩展记录的代码示例 |
| `TODO.md` | 当前技术债和下一步建议 |
| `reports/` | 板块扩展独立网页、共享样式与 Markdown 研究底稿 |

## 最短维护流程

1. 在 `index.html` 的 `/* __RECORDS_INSERT_POINT__ */` 后加入最新记录。
2. 每份新分析先用白话回答：卖什么、客户是谁、怎么赚钱、为什么难复制、本季发生什么。
3. 研究内容分成“研究分析”和“交易决策”；交易动作必须使用 if-then 证据门槛。
4. 只有能改变板块定价逻辑的财报才增加独立扩展页，并通过 `detailPage` 链回主页。
5. 更新 `NARRATIVES`，但不要把同一内容重复成两套叙事区块。
6. 校验 JavaScript、标签切换、展开/收起、板块筛选、两种排序和手机宽度。
7. 提交并推送 `main`；GitHub Pages 通常会在几十秒内更新。

详细规则见 [HANDOVER.md](HANDOVER.md)。
