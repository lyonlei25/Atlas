# Atlas

> AI-Native 工程治理工具包。把控制点放在 Agent 外面，用**事实**（git diff / 测试 / CI）而非**自陈**驱动状态。
> 跨 **Claude Code / Codex**，可嵌入任意工程。

完整设计蓝图见 [`docs/`](docs/)（8 份蓝图文档 + Git 工程管理标准），或启动服务端后访问 `/docs` 看可视化版。

**新手从这开始** → [5 分钟上手](docs/getting-started.md) · **想贡献** → [CONTRIBUTING](CONTRIBUTING.md) · 开源协议 MIT · 零外部依赖（Node ≥ 22.5）

---

## 一句话内核

> **控制点全部放在 Agent 外面。** 共享的 / 别人依赖的 / 撤不回的东西 → 放进谁都改不动的地方，用「事实」而非「自陈」驱动状态。
> **不赌 Agent 不犯错，赌系统接得住它犯错。**

Atlas 自己也吃自己的狗粮：feature 状态只由**测试结果 / 真实 diff** 翻牌，比对在服务端做，绝不让 Agent 自审。

从 M2 开始，Atlas 自身开发也要把 Git 流程纳入需求约束：`main` 只做存档主线，`release` 作为持续发布主线，每个里程碑从稳定的 `release` 点切出独立 `milestone/*` 分支，feature 只能合回所属里程碑分支。这样每个里程碑都能独立查看、验证、回滚，并在验收后一次性合入 `release`。

---

## 三个部件

| 部件 | 是什么 | 目录 |
|---|---|---|
| **共享大脑（看板）** | 集中存数据的 Web 服务端 —— 全局可见所有开发者/Agent 的事实状态 | [`server/`](server/) · [`web/`](web/) |
| **事实引擎（CLI）** | 工具无关的命令行内核：抓 diff、跑契约、交事实。Claude Code / Codex / 人 / CI 都调它 | [`cli/`](cli/) |
| **集成模板** | `atlas init` 铺进任意工程：CLAUDE.md↔AGENTS.md、skills、hook | [`templates/`](templates/) |

---

## 最小纵切（本版跑通的内核，蓝图 06）

```
register 声明范围(基准线)  ──►  干活  ──►  契约测试通过
                                              │ 事实
                                              ▼
                              服务端自动翻 contract=fulfilled / feature=done
                                              │
                                              ▼
                              业务模块读到「事实状态」才替换占位符（不认通知）
submit 交真实 diff ──► 服务端机械比对 declared vs actual ──► 越界标红
```

**「跑通了」的判据**：feature 状态没人手动点过、纯靠测试结果翻牌；声称 vs 实际一旦有差，不用读代码就能在看板上看到标红。

---

## Quickstart

需要 **Node ≥ 22.5**（用到内置 `node:sqlite` / `node:http` / `node:test`，零外部依赖）。

```bash
# 0. 初始化/检查本机环境（发布版推荐先跑）
npm run init-env               # 给出 Node 22 安装/切换指引
npm run check-env              # 严格检查 Node >= 22.5 且 node:sqlite 可用
npm run hooks:install          # 可选：安装本地 Git 治理 hooks
npm run governance:check       # 检查分支、PR 目标和本地运行期文件

# 1. 启动共享大脑（看板 + API）
npm run server                 # -> http://localhost:4317

# 2. 跑通示范纵切（另开一个终端）
cd examples/slice
node demo.mjs                  # 一键演示：状态翻牌 + 越界标红

# 3. 打开看板看全局
open http://localhost:4317/
```

仓库内提供 `.node-version` 和 `.nvmrc`，`fnm` / `nvm` / `asdf` / `volta` 等版本管理器可据此切到 Node 22。Atlas 不会把 Node runtime 提交进仓库，也不会默认静默改你的全局环境。

把 Atlas 接进你自己的工程：

```bash
cd /path/to/your/project
node /path/to/Atlas/cli/bin/atlas.js init     # 铺 CLAUDE.md/AGENTS.md/skills/hook/atlas.config.json
```

CLI 命令一览：

```bash
atlas register --feature <id> --files a.js,src/ --acceptance "..."   # 开工：声明范围(基准线)
atlas submit   --feature <id>                                        # 收工：抓真实 diff 交服务端比对
atlas contract run --id <cid> --cmd "node --test contract/"          # 跑可执行契约，通过则驱动状态
atlas board                                                          # 看全局/单 feature 状态
```

---

## 设计出处

`docs/` 里是这套方案的完整论证（为什么是事实驱动、为什么不让 Agent 自陈、三级可信度看板……）。
源自 `Downloads/project` 的蓝图，已落为单一信息源。本版只实现内核纵切 + 脚手架；L1 机器强制全集、L2 范围冻结流程、L3 越界处置全流程、说法层 wiki 贬值等留给「往外长」。

## 贡献 & 协议

欢迎贡献，见 [CONTRIBUTING.md](CONTRIBUTING.md)。CI 在每次 push/PR 跑 `node --test`（GitHub Actions）。
开源协议：[MIT](LICENSE)。
