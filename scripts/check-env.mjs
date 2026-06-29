#!/usr/bin/env node
import {
  collectEnvironment,
  formatEnvironmentReport,
  formatOkReport,
  isEnvironmentReady,
} from './env-lib.mjs';

const env = await collectEnvironment();

if (isEnvironmentReady(env)) {
  console.log(formatOkReport(env));
} else {
  console.error(formatEnvironmentReport(env));
  process.exitCode = 1;
}
