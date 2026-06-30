# Feature 流程

> 这份文档把 Git 分支、Atlas 看板和 PR 评审串成一条可执行流程。

## 生命周期

```text
planned
  -> in_progress
  -> ready_for_review
  -> changes_requested
  -> accepted
  -> merged_to_milestone
  -> released
```

## 创建 Feature

每个 feature 必须先有稳定编号，并登记到 [`feature-status.md`](feature-status.md)。

登记时至少写清：

- 所属里程碑。
- 分支名。
- 合入目标。
- 依赖和阻塞项。
- 验收入口。
- 验证命令。
- 回滚方式。

## 开发分支

M2 采用：

```text
release
  -> milestone/m2-dogfood
       -> feature/m2-*
       -> fix/m2-*
```

feature 开工：

```bash
git switch milestone/m2-dogfood
git switch -c feature/m2-<feature-id>
```

发布线热修：

```bash
git switch release
git switch -c fix/release-<bug-id>
```

## 开工记录

开工前用 Atlas 写基准线：

```bash
atlas register --feature <id> --files <文件或目录> --acceptance "验收标准"
```

这条记录是后续 `submit` 比对范围的硬锚。

## 收工记录

提交评审前：

```bash
atlas submit --feature <id>
npm run governance:check
npm test
```

PR 描述必须使用仓库 PR 模板，写清：

- 本次完成。
- 本次不包含。
- 改动文件地图。
- 验证命令和结果。
- 风险和回滚。

## 合并顺序

- `feature/m2-*` 只能合入 `milestone/m2-dogfood`。
- `fix/m2-*` 只能合入 `milestone/m2-dogfood`。
- `milestone/m2-dogfood` 整体验证通过后合入 `release`。
- `release` 到达稳定发布点后合入 `main` 并打 tag。

## 越界处理

如果实际改动超出 `atlas register` 声明范围：

- 可逆且局部：在 PR 中显式声明，等待 review。
- 撤不回或影响公共契约：停止当前 feature，开新 feature 或变更请求。
- 不允许默默把新范围吞进当前 feature。
