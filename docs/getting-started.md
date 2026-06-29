# 5 分钟上手 Atlas

从 clone 到"在看板上看到第一条事实"。需要 **Node ≥ 22.5**（零外部依赖）。

## 1. 起共享大脑（看板服务端）

```bash
git clone https://github.com/lyonlei25/Atlas.git && cd Atlas
npm run init-env    # 先看本机 Node 22 安装/切换指引
npm run check-env   # 必须通过：Node >= 22.5 且 node:sqlite 可用
npm run server
```

浏览器开 `http://localhost:4317/` —— 现在是空看板。

仓库带 `.node-version` 和 `.nvmrc`，如果你使用 `fnm`、`nvm`、`asdf` 或 `volta`，可以直接按工具提示切到 Node 22。macOS 上也可以用 Homebrew：

```bash
brew install node@22
brew link --overwrite node@22
npm run check-env
```

## 2. 让 `atlas` 成为命令

```bash
npm link        # 在 Atlas 仓库里执行一次，atlas 就上 PATH 了
atlas whoami    # 确认身份 / 服务端 / project
```

> 不想 `npm link` 也行：把 `atlas` 换成 `node /路径/Atlas/cli/bin/atlas.js`。

## 3. 接入你的工程

```bash
cd /path/to/你的项目      # 必须是 git 仓库
atlas init                # 铺 CLAUDE.md↔AGENTS.md、skills、hook、atlas.config.json
```

打开 `atlas.config.json`，确认 `serverUrl`、`projectId`、`userId/userName`（这就是看板上"你是谁"）。

## 4. 走一个 feature，把事实交上去

```bash
atlas register --feature my-first --files src/ --acceptance "随便改点 src 下的东西"
# ... 改几行 src/ 里的代码 ...
atlas submit              # 抓真实 git diff 交服务端机械比对
atlas board               # 看全局（按开发者分组）
```

回到 `http://localhost:4317/`：你会看到 **你的名字下**有一个 feature，状态由事实翻牌；如果你改了声明范围外的文件，会**标红**。

## 5.（可选）自动收工

`atlas init` 装了一个 Claude Code 的 Stop hook：开发结束时自动 `atlas submit`，事实源不依赖你/Agent 记得手动交。需要 `atlas` 在 PATH（见第 2 步）。

## 6.（可选）把 CI 接成"事实源"

feature 进「完成」**只能由事实**驱动：测试/CI 通过 **且无越界**。本地或 CI 里都用同一条命令：

```bash
atlas verify --feature my-first --cmd "npm test"
# 通过且无越界 → feature 进「完成」(done)；有越界即便测试过也进不去（会提示先清越界）
```

- 人不能手动把 feature 拖到「完成」——`atlas feature status --feature X --status done` 会被服务端拒绝。
- 意图状态（待办/已排期/受阻）可以人工设：`atlas feature status --feature X --status blocked`。
- GitHub Actions 示例见 `atlas init` 铺进来的 `.github/workflows/atlas.yml`（改 feature id 和测试命令）。

---

下一步：读 `docs/`（设计蓝图，讲为什么是事实驱动），或 `examples/slice/`（最小纵切 demo）。
