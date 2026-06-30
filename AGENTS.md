# Atlas Agent 工作规则

Atlas 用自己治理自己。任何 Agent 参与本仓库开发时，默认遵守这份入口规则；更细的分支、PR、里程碑和发布规则见 [`docs/git-engineering-management-standard.md`](docs/git-engineering-management-standard.md)。

## 当前 Git 流程

- `main`：存档主线，只接收已经发布或归档的稳定快照。
- `release`：持续发布主线，代表当前可发布、可演示的稳定状态。
- `milestone/<id>-<name>`：里程碑集成分支，从 `release` 的稳定点切出。
- `feature/<milestone>-<feature-id>`：功能分支，从所属里程碑分支切出，也只合回该里程碑分支。
- `fix/<milestone>-<bug-id>`：里程碑内修复。
- `fix/release-<bug-id>`：发布线热修。
- `codex/*`：临时工作分支；进入 PR 前应转成正式 `feature/*` 或 `fix/*`。

M2 当前目标分支是 `milestone/m2-dogfood`。M2 范围内的 feature 默认从这里切出，并向这里发 PR。

## 开发前

1. 确认 feature 已登记在 [`docs/feature-status.md`](docs/feature-status.md)。
2. 确认当前分支名符合 Git 流程。
3. 安装本地 hooks：

```bash
npm run hooks:install
```

4. 开工时用 Atlas 记录范围：

```bash
atlas register --feature <id> --files <文件或目录> --acceptance "验收标准"
```

## 交付前

必须提供可 review 交付包：

- Feature 编号与当前分支。
- 本次完成内容和明确不包含的范围。
- 改动文件地图。
- 已执行的验证命令和结果。
- 验收入口、核心流程和预期状态。
- 风险、回滚方式和后续事项。

至少执行：

```bash
npm run governance:check
npm test
```

## 硬规则

- 不直接在 `main`、`release`、`milestone/*` 上提交普通 feature。
- 不让 feature PR 直接指向 `main` 或 `release`。
- 不提交本地 DB、`.atlas/`、日志、`.DS_Store`、`node_modules/`。
- 不靠文字宣布完成；完成状态必须由测试、CI、契约或真实 diff 驱动。
