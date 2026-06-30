# Feature 状态台账

> 这份台账记录 Atlas 自身开发的 feature 边界、目标分支和集成状态。状态事实最终应由 Atlas 看板承载；在 M2 dogfood 完成前，本文档作为过渡台账。

## 状态说明

| 状态 | 含义 |
|---|---|
| `planned` | 已进入计划，还未开工 |
| `in_progress` | 正在开发 |
| `ready_for_review` | 已提交评审 |
| `changes_requested` | 评审要求修改 |
| `accepted` | 已验收，等待合并 |
| `merged_to_milestone` | 已合入里程碑分支 |
| `released` | 已随 `release` 发布或归档 |

## M2 前置

| 编号 | Feature | 状态 | 依赖 | 分支 / PR | 验收入口 | 集成状态 | 备注 |
|---|---|---|---|---|---|---|---|
| `m2-git-flow` | 落地 Git 流程、PR 模板、基础治理检查 | `in_progress` | M1 基线、Node 22 环境初始化 | `feature/m2-git-flow` | `npm run governance:check && npm test` | 未合入 | M2 启动前置 |

## M2 · Atlas dogfood

| 编号 | Feature | 状态 | 依赖 | 分支 / PR | 验收入口 | 集成状态 | 备注 |
|---|---|---|---|---|---|---|---|
| `m2-self-board-seed` | 创建 Atlas 项目、M2 里程碑和第一批 feature | `planned` | `m2-git-flow` | `feature/m2-self-board-seed` | 看板出现 Atlas 项目与 M2 里程碑 | 未合入 | 让 Atlas 管理自身开发 |
| `m2-dogfood-docs` | 把 Atlas 自身开发流程写进贡献文档 | `planned` | `m2-self-board-seed` | `feature/m2-dogfood-docs` | 贡献文档可按流程完成一次 feature | 未合入 | 面向后续贡献者 |
| `m2-ci-verify` | 让 CI 成为 Atlas 看板的事实源 | `planned` | `m2-self-board-seed` | `feature/m2-ci-verify` | CI 结果能驱动或记录看板事实 | 未合入 | M2 dogfood 的关键事实源 |
