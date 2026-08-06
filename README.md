# 财报助手

从财报、业绩会、公司公告、X、采访和视频中提炼市场叙事，并持续验证上一季度的判断。

- 在线页面：<https://kaguravicky-web.github.io/earnings/>
- GitHub：<https://github.com/kaguravicky-web/earnings>
- 页面：白底、移动端优先、所有个股可展开和收起
- 定位：基本面与市场叙事研究，不提供买卖建议

## 仓库结构

| 路径 | 用途 |
|---|---|
| `index.html` | GitHub Pages 页面；包含记录、叙事、并购跟踪、样式和交互 |
| `HANDOVER.md` | 给下一位 AI 的完整接手说明，修改前先读 |
| `prompts/系统提示词.md` | 当前唯一有效的研究规则 |
| `DATA_SOURCES.md` | 数据源优先级、常见失败和替代来源 |
| `EXAMPLES.md` | 新增记录和板块扩展记录的代码示例 |
| `TODO.md` | 当前技术债和下一步建议 |
| `reports/` | 重要板块级研究的 Markdown 版本 |

## 最短维护流程

1. 在 `index.html` 的 `/* __RECORDS_INSERT_POINT__ */` 后加入最新记录。
2. 只有能改变板块定价逻辑的财报才增加 `extended` 板块扩展。
3. 更新 `NARRATIVES`，但不要把同一内容重复成两套叙事区块。
4. 校验 JavaScript、展开/收起、板块筛选、两种排序和手机宽度。
5. 提交并推送 `main`；GitHub Pages 通常会在几十秒内更新。

详细规则见 [HANDOVER.md](HANDOVER.md)。
