#!/usr/bin/env node
// atlas —— 事实引擎 CLI 入口。工具无关，Claude Code / Codex / 人 / CI 共用。
import { register } from '../src/register.js';
import { submit } from '../src/submit.js';
import { contract } from '../src/contract.js';
import { board } from '../src/board.js';
import { init } from '../src/init.js';
import { whoami } from '../src/whoami.js';

const HELP = `atlas —— AI-Native 工程治理 · 事实引擎

用法:
  atlas init [--server URL] [--project ID]        把集成模板铺进当前工程
  atlas register --feature <id> --files a.js,src/ [--acceptance "..."]
                                                  开工：声明范围(基准线)
  atlas submit   --feature <id> [--claimed a.js]  收工：抓真实 diff 交服务端比对
  atlas contract create --id <cid> [--feature <fid>] [--cmd "..."] [--spec "..."]
  atlas contract run    --id <cid> --cmd "node --test contract/" [--feature <fid>]
                                                  跑可执行契约，测试结果驱动状态
  atlas board [--feature <id>]                    看全局(按开发者分组)/单 feature 状态
  atlas whoami                                    看当前身份 / 服务端 / project
  atlas help

内核：状态由事实(测试/diff)翻牌，比对在服务端做，不信 Agent 自陈。`;

// 极简 flag 解析：--key value / --key=value / --key(布尔)
function parseArgs(argv) {
  const args = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq !== -1) {
        args[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        const key = a.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) {
          args[key] = next;
          i++;
        } else {
          args[key] = true;
        }
      }
    } else {
      positional.push(a);
    }
  }
  return { args, positional };
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { args, positional } = parseArgs(rest);

  try {
    switch (cmd) {
      case 'init':
        return await init(args);
      case 'register':
        return await register(args);
      case 'submit':
        return await submit(args);
      case 'contract':
        return await contract(args, positional[0]);
      case 'board':
        return await board(args);
      case 'whoami':
        return await whoami(args);
      case 'help':
      case '--help':
      case '-h':
      case undefined:
        return console.log(HELP);
      default:
        console.error(`未知命令: ${cmd}\n`);
        console.log(HELP);
        process.exitCode = 1;
    }
  } catch (e) {
    console.error('✗ ' + (e && e.message ? e.message : e));
    process.exitCode = 1;
  }
}

main();
