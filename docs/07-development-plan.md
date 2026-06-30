# 07 · 开发计划

> 开发计划把蓝图转成可执行里程碑。每个里程碑先冻结范围，再让 Agent 进入对应的里程碑分支开发。

---

## 当前状态

M1 已完成最小可信纵切：

- 共享大脑：服务端、看板、API。
- 事实引擎：`register`、`submit`、`verify`、`contract`、`board`。
- 事实驱动状态：`done` 只能由测试或契约事实触发。
- 机械比对：服务端抓范围蔓延和瞒报。
- 最小示例：`examples/slice` 跑通契约兑现、占位符替换和越界标红。

M1 不是全套治理系统完成，而是可继续往外长的基线。

---

## P0 · M2 前置：Git 流程落地

M2 开始前，先把 Git 流程作为工程约束落地。它属于 L1 的机器治理与 L2 的里程碑冻结之间的接缝。

目标：

- `main` 成为存档主线。
- `release` 成为持续发布主线。
- 每个里程碑都有独立 `milestone/*` 集成分支。
- feature 只能合入所属里程碑分支。
- 里程碑整体验证后一次性合入 `release`。

验收：

- `docs/git-engineering-management-standard.md` 成为 Git 流程权威文档。
- 建立 `release` 和 `milestone/m2-dogfood` 分支。
- M2 feature 台账中的每个 feature 都有目标分支。
- PR 模板和治理检查能阻止常见错误目标分支。
- 根目录 `AGENTS.md`、本地 hooks、CI 和 PR 模板都接入同一套规则。

落地文件：

- [`git-engineering-management-standard.md`](git-engineering-management-standard.md)
- [`feature-flow.md`](feature-flow.md)
- [`feature-status.md`](feature-status.md)
- [`../AGENTS.md`](../AGENTS.md)

---

## M2 · Atlas dogfood

目标：用 Atlas 管理 Atlas 自己的开发。

范围：

- 建立 Atlas 自身看板项目和 M2 里程碑。
- 所有 M2 feature 开工前都执行 `atlas register`。
- 所有 M2 feature 收工时都执行 `atlas submit`。
- `done` 只由 `atlas verify --cmd "npm test"` 触发。
- 看板能看到 M2 进度、越界和事实流水。

建议 feature：

| Feature | 目标 | 目标分支 |
|---|---|---|
| `m2-git-flow` | 落地 Git 流程、PR 模板、基础治理检查 | `feature/m2-git-flow` |
| `m2-self-board-seed` | 创建 Atlas 项目、M2 里程碑和第一批 feature | `feature/m2-self-board-seed` |
| `m2-dogfood-docs` | 把 Atlas 自身开发流程写进贡献文档 | `feature/m2-dogfood-docs` |
| `m2-ci-verify` | 让 CI 成为 Atlas 看板的事实源 | `feature/m2-ci-verify` |

---

## M3 · 范围冻结与越界处置

目标：把 L2 / L3 的范围冻结、范围变更和越界处置产品化。

建议 feature：

- `m3-milestone-freeze`：冻结后限制 feature 增删和范围改写。
- `m3-scope-change-request`：超范围发现吐回看板成为待决策项。
- `m3-overstep-policy`：区分可逆局部越界和撤不回撞线。
- `m3-board-breach-view`：看板清楚展示越界类型、文件和处置状态。

---

## M4 · 契约层产品化

目标：让契约从 demo 能力变成团队协作能力。

建议 feature：

- `m4-contract-list-view`：看板单独展示契约层。
- `m4-contract-versioning`：契约支持版本和依赖关系。
- `m4-contract-breakage`：契约失败时展示影响范围。
- `m4-contract-template`：把 `examples/slice` 抽成可复用模板。

---

## M5 · 发布与多人使用

目标：从本地工具走向可公开使用的小产品。

建议 feature：

- `m5-install-docs`：完善安装、升级、故障排查。
- `m5-auth-lite`：为共享服务端提供最小认证。
- `m5-db-ops`：明确生产/本地 DB 路径、备份和迁移策略。
- `m5-release-package`：决定 npm 发布、版本号和 CHANGELOG。
- `m5-pr-template`：沉淀贡献者 PR 流程。
