# 团队 Agent 工程治理标准模板

> 这是从 Atlas 自身 Git 流程抽出的可复用模板。其他项目接入 Atlas 时，可按项目名、里程碑编号和验证命令替换。

## 分支模型

```text
main
  -> release
       -> milestone/<id>-<name>
            -> feature/<milestone>-<feature-id>
            -> fix/<milestone>-<bug-id>
```

## 分支职责

- `main`：存档主线，只保存已发布或已归档的稳定快照。
- `release`：持续发布主线，代表当前可发布状态。
- `milestone/*`：里程碑集成分支，从 `release` 稳定点切出。
- `feature/*`：单个可验收 feature。
- `fix/*`：里程碑内修复或发布线热修。

## Feature 必备字段

- 编号。
- 所属里程碑。
- 负责人或 Agent。
- 分支名。
- 合入目标。
- 依赖和阻塞项。
- 验收入口。
- 验证命令。
- 回滚方式。

## PR 必备内容

- Feature 编号和目标分支。
- 本次完成与本次不包含。
- 改动文件地图。
- 验证命令和结果。
- 风险与回滚。
- 状态台账更新位置。

## 推荐机器门禁

本地：

```bash
npm run hooks:install
npm run governance:check
```

CI：

```bash
npm run governance:check
npm test
```

最少检查：

- 分支命名。
- PR 来源和目标分支关系。
- 提交信息格式。
- 运行期文件是否误提交。
- 测试是否通过。
