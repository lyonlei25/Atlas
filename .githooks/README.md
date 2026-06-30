# Atlas 本地 Git Hooks

安装：

```bash
npm run hooks:install
```

当前 hooks：

- `pre-commit`：检查当前分支是否允许直接提交，并拦截运行期文件。
- `commit-msg`：检查提交信息格式。
- `pre-push`：推送前运行 Git 治理检查和完整测试。

这些 hook 是本地防线；CI 仍然会在远端重复执行关键检查。
