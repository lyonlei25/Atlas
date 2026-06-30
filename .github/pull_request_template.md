## Feature 编号与目标分支

- Feature 编号：
- 来源分支：
- 目标分支：
- 所属里程碑：
- 状态台账：

## 可 Review 交付包

### 变更摘要

- 本次完成：
- 本次不包含：

### 改动文件地图

| 文件或目录 | 作用 | 评审重点 |
|---|---|---|
|  |  |  |

### 验证命令与结果

| 命令 | 结果 | 说明 |
|---|---|---|
| `npm run governance:check` |  |  |
| `npm test` |  |  |

### 验收入口

- 页面入口：
- API / CLI 入口：
- 核心流程：
- 预期状态：

## 风险与回滚

- 主要风险：
- 回滚方式：

## Agent 自检

- [ ] 分支名符合 `docs/git-engineering-management-standard.md`。
- [ ] 目标分支正确：feature/fix → 所属 `milestone/*`，milestone → `release`，release → `main`。
- [ ] Feature 状态台账已更新。
- [ ] 没有提交运行期数据、本地 DB、`.atlas/` 或临时文件。
- [ ] 已列出验证命令和结果。
