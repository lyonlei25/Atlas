#!/usr/bin/env node
import {
  collectEnvironment,
  formatEnvironmentReport,
  formatOkReport,
  isEnvironmentReady,
} from './env-lib.mjs';

const env = await collectEnvironment();

console.log('Atlas 环境初始化');
console.log('');

if (isEnvironmentReady(env)) {
  console.log(formatOkReport(env));
  console.log('');
  console.log('下一步：npm run server');
} else {
  console.log(formatEnvironmentReport(env));
}
