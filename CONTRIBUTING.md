# 给 Atlas 贡献

Atlas 用自己治理自己（dogfood）：贡献时也走"事实驱动状态"那一套。

## 前置

- Node ≥ 22.5（用到内置 `node:sqlite` / `node:http` / `node:test`，**零外部依赖**，不用 `npm install`）。

## 本地跑起来

```bash
git clone https://github.com/lyonlei25/Atlas.git && cd Atlas
npm run server          # 共享大脑 http://localhost:4317
node --test             # 跑测试（CI 跑同一条）
node examples/slice/demo.mjs   # 看最小纵切端到端
```

## 开发约定

- **状态由事实驱动**：任何"完成/通过"都不能靠在代码或 PR 里宣布——让测试/CI 翻牌。改动了状态机，先想"这条状态是不是由某个事实触发的"。
- **比对在服务端**：越界检测只在 `server/compare.js` 做，别把判断挪进客户端或让 Agent 自审。
- **改动要落事实**：开发时可用 Atlas 自己记账——`atlas register` 声明范围、`atlas submit` 交真实 diff（见 `docs/getting-started.md`）。
- **保持零依赖**：优先用 Node 内置模块；加外部依赖要在 PR 里说明理由。
- **测试**：逻辑改动配 `node:test` 用例（见 `test/`）。`server/compare.js` 这类纯函数务必有单测。

## 提 PR

1. 从 `main` 切分支。
2. `node --test` 全绿。
3. PR 描述写清"改了什么 / 为什么 / 怎么验证"。
4. CI（GitHub Actions 跑 `node --test`）必须绿。

## 设计原则

动手前建议读 `docs/`（7 份蓝图）。核心：控制点放在 Agent 外面，用事实而非自陈驱动状态。任何新功能都该问一句——**它是不是又让某个黑盒自己汇报自己了？**
