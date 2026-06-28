# 最小纵切 demo

跑通蓝图 06 的内核：**事实驱动状态**，端到端只用一条命令。

```bash
# 终端 A：启动共享大脑
cd ../../ && npm run server

# 终端 B：跑 demo
cd examples/slice && node demo.mjs
```

## 这个 demo 证明了什么

| 步骤 | 证明的原则 |
|---|---|
| ② 替换前用占位符 | 业务模块不阻塞等基础模块，先对契约编程 |
| ③ 契约测试通过 → 服务端翻牌 | **状态由测试结果(事实)驱动，不是 Agent 宣布"完成"** |
| ④ 业务读到事实状态才替换占位符 | **替换扳机挂在事实上，不挂在通知上**（蓝图 04 规则三） |
| ⑤ 注入越界 → 服务端比对标红 | **声称/承诺 vs 实际的差由服务端机械抓出**，不靠 Agent 自审（蓝图 03） |

## 组成

- `contract/quote-contract.mjs` —— 可执行契约（接口形状 + 校验函数）
- `base-module/price-service.mjs` —— 基础模块（契约背后的实现）
- `contract/quote.test.mjs` —— 契约测试（`atlas contract run` 跑它）
- `business-module/dashboard.mjs` —— 业务模块，按看板事实状态选占位符/真实实现

## 用真正的 CLI 跑（非 demo 脚本）

```bash
atlas register --feature quote-feature --files examples/slice/base-module/,examples/slice/business-module/,examples/slice/contract/
atlas contract run --id quote-contract --feature quote-feature --cmd "node --test examples/slice/contract/quote.test.mjs"
atlas board
```
