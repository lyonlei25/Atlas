// 契约测试（node:test）：基础模块是否兑现 quote-provider@v1。
// "atlas contract run" 跑的就是它；它通过/失败这个【事实】驱动服务端翻牌。
import test from 'node:test';
import assert from 'node:assert';
import { assertSatisfies } from './quote-contract.mjs';
import priceService from '../base-module/price-service.mjs';

test('基础模块满足报价契约 quote-provider@v1', () => {
  assert.ok(assertSatisfies(priceService));
});
