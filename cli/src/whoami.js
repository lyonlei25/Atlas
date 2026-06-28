// atlas whoami —— 打印当前身份 / 服务端 / project。多人协作时先确认"我是谁"。
import { loadConfig } from './api.js';

export async function whoami() {
  const cfg = loadConfig();
  console.log(`开发者: ${cfg.userName} (${cfg.userId})`);
  console.log(`project: ${cfg.projectName} [${cfg.projectId}]`);
  console.log(`服务端:  ${cfg.serverUrl}`);
  console.log(`配置:    ${cfg.configPath || '(无 atlas.config.json，用默认/环境变量)'}`);
  console.log(`\n改身份: 编辑 atlas.config.json 的 userId/userName，或设 ATLAS_USER / ATLAS_USER_NAME`);
}
