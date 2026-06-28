---
name: atlas-contract
description: 当一个 feature 依赖别的模块的共享接口时，把接口做成可执行契约测试并登记到看板，用测试通过这个事实驱动占位符替换。处理跨模块接口时调用。
---

# atlas-contract

多个模块共享一个接口时，**别直接改公共实现**——对契约编程。契约住看板、可执行、谁都不能单方面改。

```bash
# 登记契约（住看板，不住对话）
atlas contract create --id <cid> --feature <fid> --name "<接口名@版本>" --spec "接受X返回Y" --cmd "<跑契约测试的命令>"

# 跑契约测试：通过(事实) → 服务端翻 contract=fulfilled，关联 feature 随之 verified
atlas contract run --id <cid> --feature <fid> --cmd "node --test contract/"
```

规则（蓝图 04）：
- 契约做成**可执行的契约测试**，别用纯文字（纯文字会漂移）。
- **任何单个 Agent 不能单方面改契约**。实现不出来 → 撞线停，把"需改成 X"抛回去重新约定。
- 业务模块替换占位符的扳机 = **契约测试通过这个事实**，不是基础模块说"做好了"。
