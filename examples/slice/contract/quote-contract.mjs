// 可执行契约：报价接口 quote-provider@v1 的形状 + 校验函数。
// 契约住看板（注册 id=quote-contract），且是"可执行"的——任何实现不符，下面的校验就抛错。
// 这正是蓝图 04 规则一：往"可执行"那侧拼命拉，别用纯文字（纯文字会漂移）。

export const QUOTE_CONTRACT = {
  id: 'quote-contract',
  name: 'quote-provider@v1',
  spec: 'getQuote(symbol:string) -> { symbol:string, price:number>0, currency:string }',
};

/** 校验某个实现是否满足契约。base 模块和 business 模块都对这份契约编程。 */
export function assertSatisfies(provider) {
  if (!provider || typeof provider.getQuote !== 'function')
    throw new Error('实现缺少 getQuote(symbol)');
  const q = provider.getQuote('NVDA');
  if (!q || q.symbol !== 'NVDA') throw new Error('返回的 symbol 不匹配');
  if (typeof q.price !== 'number' || !(q.price > 0)) throw new Error('price 必须是正数');
  if (typeof q.currency !== 'string' || !q.currency) throw new Error('缺少 currency');
  return true;
}
