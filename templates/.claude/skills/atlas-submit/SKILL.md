---
name: atlas-submit
description: 收工一个 feature 时把真实 git diff 交给 Atlas 服务端做机械比对(声称/承诺 vs 实际)，越界自动标红。完成开发后调用。
---

# atlas-submit

干完活后，把**真实改动**交给服务端审判。你不下"我没越界"的结论——服务端用 diff 机械比对。

```bash
atlas submit --feature <id>           # 或不带 id，用 register 记下的当前 feature
atlas submit --feature <id> --claimed <你自陈改了的文件>   # 额外抓"瞒报"
```

- 自动抓当前工作区相对 HEAD 的真实改动文件。
- 服务端比对**承诺范围 vs 实际改动**（抓范围蔓延），可选比对**自陈 vs 实际**（抓瞒报）。
- 有越界时命令以非 0 退出，看板上该 feature 标红。
- **不要**手动去把 feature 状态改成"完成"——状态只由事实翻牌。
