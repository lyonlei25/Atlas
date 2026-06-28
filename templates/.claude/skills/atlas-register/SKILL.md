---
name: atlas-register
description: 开工一个 feature 时声明范围(基准线)+验收，登记到 Atlas 看板。在开始写任何代码前调用，确立后面判定越界的硬锚。
---

# atlas-register

开始做一个 feature **之前**，先声明你打算碰哪些文件、验收标准是什么。这是后面判定你有没有越界的基准线（硬锚）。

```bash
atlas register --feature <id> --files <文件,逗号分隔> --acceptance "验收标准"
```

- `--files` 写你**计划**碰的文件或目录（目录以 `/` 结尾，支持 `*`）。范围要诚实——收工时真实 diff 会和它机械比对。
- 这条范围一旦登记就是硬锚：你能定"怎么做"，定不了"做到哪"。
- 登记后会记下"当前 feature"，收工 `atlas submit` 可不带参数。

发现需要超出范围 → 别直接扩，把它作为新项吐回看板让人决策。
