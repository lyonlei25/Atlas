// 基础模块：报价服务（接口 quote-provider@v1 背后的真实实现）。
// 业务模块不直接 import 这里的内部，只对契约编程；替换由"事实(契约测试通过)"驱动。
export function getQuote(symbol) {
  const table = { NVDA: 1234.5, AAPL: 210.2, TSLA: 333.3 };
  return { symbol, price: table[symbol] ?? 100, currency: 'USD' };
}

export default { getQuote };
