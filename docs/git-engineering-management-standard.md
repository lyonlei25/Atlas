# Git 工程管理标准

> 这份标准用于 Atlas 自身开发，也作为未来 `atlas init` 可铺到其他工程的治理模板候选。
> 核心目标：让每个里程碑成为一个可独立查看、验证、回滚和发布的交付盒子。

---

## 分支职责

### `main`：存档主线

`main` 只保存已经归档的稳定快照。它不直接接收普通 feature，也不承担日常集成职责。

进入 `main` 的内容应当满足：

- 已经从 `release` 发布或归档。
- 有对应 tag，例如 `m2`、`v0.2.0`。
- 可以作为长期回看的历史基线。

### `release`：持续发布主线

`release` 表示当前可发布、可演示、可被用户使用的稳定线。里程碑完成后，整条里程碑分支合入 `release`。

`release` 允许：

- 接收完成验收的 `milestone/*`。
- 接收紧急发布修复 `fix/release-*`。
- 作为下一个里程碑分支的切出基线。

`release` 不允许：

- 直接接收普通 feature。
- 混入未完成的里程碑范围。

### `milestone/<id>-<name>`：里程碑集成分支

每个里程碑都有自己的独立集成分支，例如：

```text
milestone/m2-dogfood
milestone/m3-scope-freeze
```

里程碑分支必须从 `release` 的稳定点切出。它是该里程碑范围内所有 feature 的唯一集成目标。

这个分支的职责：

- 承载该里程碑被冻结后的 feature 集。
- 让该里程碑可以被单独测试、演示和验收。
- 在验收完成后一次性合入 `release`。

### `feature/<milestone>-<feature-id>`：功能分支

例如：

```text
feature/m2-git-flow
feature/m2-atlas-dogfood
feature/m3-scope-change-request
```

规则：

- 从所属 `milestone/*` 分支切出。
- PR 目标只能是所属 `milestone/*` 分支。
- 一个 feature 分支只服务一个可验收目标。
- feature 完成后不直接合 `release` 或 `main`。

### `fix/<milestone>-<bug-id>` 与 `fix/release-<bug-id>`：修复分支

里程碑内修复：

```text
fix/m2-board-progress
```

发布线热修：

```text
fix/release-node22-check
```

发布线热修合入 `release` 后，必须同步回所有仍活跃且受影响的 `milestone/*` 分支，避免里程碑最终合回时覆盖热修。

### `codex/*`：Agent 工作分支

`codex/*` 可以作为 Codex 的临时工作分支，但进入正式评审前必须满足两点：

- 在 PR 描述中声明对应的 feature 编号和目标里程碑。
- 合并目标仍然必须是正确的 `milestone/*`、`release` 或 `main`。

---

## 里程碑流转

标准流转：

```text
main
  └─ release
       └─ milestone/m2-dogfood
            ├─ feature/m2-git-flow
            ├─ feature/m2-atlas-dogfood
            └─ fix/m2-...
```

1. 从 `release` 创建 `milestone/<id>-<name>`。
2. 在看板中创建同名里程碑，并冻结 feature 范围。
3. 每个 feature 从里程碑分支切出独立分支。
4. feature PR 合入里程碑分支。
5. 里程碑分支整体验证。
6. 里程碑分支合入 `release`。
7. 打 tag。
8. `release` 合入 `main`，作为归档快照。

---

## 合并门禁

### Feature 合入里程碑分支前

必须满足：

- `atlas register` 已声明范围和验收。
- PR 目标是所属 `milestone/*`。
- `npm test` 通过。
- 如果改动涉及契约，契约测试必须通过。
- PR 描述写清范围、非范围、验证、风险和回滚。

### 里程碑合入 `release` 前

必须满足：

- 里程碑下所有必需 feature 已完成。
- 里程碑分支整体 `npm test` 通过。
- 越界项已处理或明确延期。
- 文档与开发计划已同步。
- 看板里程碑状态可以进入完成。

### `release` 合入 `main` 前

必须满足：

- `release` 已经代表一个稳定发布点。
- 已打 tag 或准备打 tag。
- 没有未决热修。
- `main` 只接收这次归档，不混入额外 feature。

---

## 机器门禁

本仓库已经提供最小机器门禁：

```bash
npm run governance:check
```

检查内容：

- 当前分支命名是否符合 Atlas 分支模型。
- GitHub PR 的来源分支和目标分支是否匹配。
- 本地提交是否直接发生在 `main`、`release`、`milestone/*` 上。
- 是否误提交本地 DB、`.atlas/`、日志、`.DS_Store`、`node_modules/`。

本地 hooks：

```bash
npm run hooks:install
```

安装后：

- `pre-commit` 运行治理检查，阻止错误分支直接提交。
- `commit-msg` 检查提交信息格式。
- `pre-push` 运行治理检查和完整测试。

CI 会重复执行：

```bash
npm run governance:check
npm test
```

GitHub 仓库设置中仍建议手动开启 branch protection，保护 `main`、`release` 和 `milestone/*`。

---

## 并行规则

默认只允许一个主开发里程碑处于活跃开发状态。

允许提前做下一个里程碑的设计文档，但不建议提前大量写代码。若必须并行开发，必须满足：

- 新里程碑不依赖当前里程碑未发布能力。
- 或者显式声明依赖，并接受后续 rebase / merge 成本。
- 每个并行里程碑都有独立 `milestone/*` 分支和看板范围。

---

## 回滚与热修

里程碑整体发布后，如果需要回滚，优先回滚 `release` 上的里程碑合并提交或发布 tag。

热修从 `release` 切出：

```bash
git switch release
git switch -c fix/release-<bug-id>
```

热修完成后：

1. 合入 `release`。
2. 打补丁版本 tag。
3. 同步回所有仍活跃且受影响的 `milestone/*`。
4. 记录到开发计划或看板事实中。

---

## Atlas 自身的当前应用

M1 视为已完成的最小可信纵切基线。

M2 开始前必须完成 Git 流程前置项：

1. 建立 `release` 分支。
2. 从 `release` 建立 `milestone/m2-dogfood`。
3. 把 M2 feature 全部挂到 `milestone/m2-dogfood`。
4. 将 PR 目标、feature 台账和看板里程碑统一到这套分支模型。
