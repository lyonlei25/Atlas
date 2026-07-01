# 团队 Agent 工程治理收尾报告

## 治理目标

把 Atlas 的 Git 流程从文档建议落成仓库可执行流程，作为 M2 启动前置项。

目标分支模型：

```text
main
  -> release
       -> milestone/m2-dogfood
            -> feature/m2-*
```

## 已落地约束

- `main` 作为存档主线。
- `release` 作为持续发布主线。
- `milestone/m2-dogfood` 作为 M2 独立集成分支。
- `feature/m2-*` 只能合入 `milestone/m2-*`。
- `milestone/*` 只能合入 `release`。
- `release` 只能作为归档快照合入 `main`。
- `codex/*` 只作为临时工作分支，进入 PR 前应转为正式 feature 或 fix 分支。

## 当前分支和状态

| 分支 | 角色 | 当前状态 |
|---|---|---|
| `main` | 存档主线 | 已存在 |
| `release` | 持续发布主线 | 已推送远端 |
| `milestone/m2-dogfood` | M2 集成分支 | 已推送远端，并接收 `m2-git-flow` |
| `feature/m2-git-flow` | M2 前置治理 feature | 已推送远端，已合入 M2 里程碑分支 |

## 机器门禁

新增：

- `scripts/git-governance-check.mjs`
- `scripts/git-governance-lib.mjs`
- `.githooks/pre-commit`
- `.githooks/commit-msg`
- `.githooks/pre-push`
- `.github/pull_request_template.md`
- `.github/ISSUE_TEMPLATE/feature.md`

CI 已接入：

```bash
npm run governance:check
npm test
```

## Feature 拆分和交付标准

新增：

- [`docs/feature-flow.md`](../feature-flow.md)
- [`docs/feature-status.md`](../feature-status.md)
- [`docs/templates/team-agent-governance-standard.md`](../templates/team-agent-governance-standard.md)

## 验证结果

已执行：

```bash
npm run governance:check
npm test
```

结果：

- `npm run governance:check` 通过。
- `npm test` 通过，41/41。

## 仍需人工确认的清理项

- 是否要求所有后续 PR 必须使用 `feature/*`，完全禁止 `codex/*` 进入 PR。
- 是否在 GitHub 仓库设置中配置 branch protection，限制直接推送 `main`、`release` 和 `milestone/*`。

## 其他工程复用步骤

1. 复制 Git 工程管理标准。
2. 定义项目自己的 `release` 和 `milestone/*` 分支。
3. 建立 feature 台账。
4. 接入 `governance:check`。
5. 安装 hooks。
6. 在 CI 中重复执行治理检查和测试。
