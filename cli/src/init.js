// atlas init —— 把集成模板铺进当前工程：CLAUDE.md↔AGENTS.md、skills、hook、atlas.config.json。
// 一条命令完成跨 Agent 接入。已存在的文件不覆盖（保护用户产物），只提示。
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  symlinkSync,
  writeFileSync,
  unlinkSync,
} from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = join(__dirname, '..', '..', 'templates');

export async function init(args) {
  const target = process.cwd();
  const serverUrl = args.server || process.env.ATLAS_SERVER || 'http://localhost:4317';
  const projectId = args.project || basename(target);
  const userId = args.user || process.env.ATLAS_USER || process.env.USER || 'unknown';
  const userName = args['user-name'] || process.env.ATLAS_USER_NAME || userId;
  let created = [];
  let skipped = [];

  const copyFile = (src, dest) => {
    if (existsSync(dest)) {
      skipped.push(relative(target, dest));
      return;
    }
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
    created.push(relative(target, dest));
  };

  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const src = join(dir, entry);
      const rel = relative(TEMPLATES, src);
      const dest = join(target, rel);
      // AGENTS.md 在模板里是符号链接 → 在目标也建符号链接（单一信息源）
      if (entry === 'AGENTS.md') continue; // 单独处理
      if (entry === 'atlas.config.json') continue; // 生成而非拷贝
      if (statSync(src).isDirectory()) {
        mkdirSync(dest, { recursive: true });
        walk(src);
      } else {
        copyFile(src, dest);
      }
    }
  };

  walk(TEMPLATES);

  // AGENTS.md → CLAUDE.md 软链（Codex 读，单一信息源）
  const agentsPath = join(target, 'AGENTS.md');
  if (existsSync(agentsPath)) {
    skipped.push('AGENTS.md');
  } else if (existsSync(join(target, 'CLAUDE.md'))) {
    try {
      symlinkSync('CLAUDE.md', agentsPath);
      created.push('AGENTS.md → CLAUDE.md');
    } catch (e) {
      // 文件系统不支持软链时退化为拷贝
      cpSync(join(target, 'CLAUDE.md'), agentsPath);
      created.push('AGENTS.md (copy)');
    }
  }

  // 确保 .atlas/（Atlas 运行时状态）被 git 忽略，不污染事实源 diff
  const giPath = join(target, '.gitignore');
  const giLine = '.atlas/';
  if (existsSync(giPath)) {
    const cur = readFileSync(giPath, 'utf8');
    if (!cur.split(/\r?\n/).includes(giLine)) {
      writeFileSync(giPath, cur.replace(/\n?$/, '\n') + giLine + '\n');
      created.push('.gitignore (+ .atlas/)');
    }
  } else {
    writeFileSync(giPath, giLine + '\n');
    created.push('.gitignore');
  }

  // atlas.config.json：按目标工程生成
  const cfgPath = join(target, 'atlas.config.json');
  if (existsSync(cfgPath)) {
    skipped.push('atlas.config.json');
  } else {
    writeFileSync(
      cfgPath,
      JSON.stringify(
        { serverUrl, projectId, projectName: projectId, userId, userName, owner: userId },
        null,
        2
      ) + '\n'
    );
    created.push('atlas.config.json');
  }

  console.log(`Atlas 已接入  [${projectId}]  服务端 ${serverUrl}\n`);
  if (created.length) console.log('新建:\n' + created.map((f) => '  + ' + f).join('\n'));
  if (skipped.length) console.log('\n已存在(未覆盖):\n' + skipped.map((f) => '  · ' + f).join('\n'));
  console.log('\n下一步: 编辑 atlas.config.json 确认服务端地址；CLAUDE.md 里有给 Agent 的工作流。');
}
