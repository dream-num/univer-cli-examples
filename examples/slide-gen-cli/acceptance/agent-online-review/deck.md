# Agent 如何用 slide-gen-cli 把想法变成可在线评审的 Univer Slide

## 受众与目标

- 受众：正在评估 `slide-gen-cli` example 的工程团队。
- 决策：判断这个 example 是否给 Agent 提供了完整、可复验的 Slide 生成闭环。
- 叙事：先看端到端路径，再看任务目录如何承载中间产物，最后看在线评审与质量回路。

## 视觉规范

- 页面：960 × 540，16:9。
- 字体：Arial、PingFang SC；标题 36–40 px，正文 14–18 px，元数据 11–12 px。
- 主色：墨黑蓝 `#0B1020`，白 `#F6F8FF`，灰蓝 `#98A6C7`。
- 强调色：青绿 `#4DE2C5`，蓝 `#5B8CFF`，紫 `#A77BFF`，橙 `#FFB454`。
- 视觉语言：深色工程控制台、细线连接、圆角卡片、明确页码；同一强调色在三页保持相同语义。
- 资源：第 1 页使用 canonical stable handle `example-tabler-outline/ai-agent`，表示执行 authoring skill 的 Agent。

## 页面契约

1. `page-01-from-brief-to-review.svg`：一句话结论和四步流水线，建立完整心智模型。
2. `page-02-task-directory.svg`：展示任务级目录如何把输入、源码、中间产物和交付证据放在一起。
3. `page-03-quality-loop.svg`：展示 compile → execute → inspect/lint → screenshot 的修订回路，以及 Ready、PPTX、在线 URL 三种交付结果。

## 精确文案

- 核心结论：Agent 不是“画一张图”，而是在同一个 Worktree revision 上生成、验证并交付一份可在线评审的 deck。
- 第 1 页步骤：理解 Brief / 编写 SVG / 提交 Worktree / 在线评审。
- 第 2 页字段：输入、页面源码、稳定资源、生成程序、验收证据。
- 第 3 页门槛：compiler warnings 可解释；layout lint = 0；逐页截图人工阅读；commit = confirmed。
