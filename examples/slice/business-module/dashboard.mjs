// 业务模块：消费报价。是否把占位符替换成真实基础模块，取决于看板上的【事实状态】，
// 不是基础模块 Agent 说一句"我做好了"（蓝图 04 规则三：替换扳机挂在事实上，不挂在通知上）。
import priceService from '../base-module/price-service.mjs';

// 基础模块没兑现前，业务先用占位符顶着，不阻塞自己开发。
const placeholderProvider = {
  getQuote: (symbol) => ({ symbol, price: 0, currency: 'USD', placeholder: true }),
};

/** 查看板：契约事实状态 = fulfilled 时才用真实实现。 */
export async function pickProvider(serverUrl, contractId) {
  try {
    const res = await fetch(`${serverUrl.replace(/\/$/, '')}/api/board`);
    const { projects } = await res.json();
    const c = projects.flatMap((p) => p.contracts).find((x) => x.id === contractId);
    if (c && c.status === 'fulfilled') {
      return { provider: priceService, source: 'REAL(基础模块)' };
    }
  } catch {
    /* 看板连不上就退化到占位符 */
  }
  return { provider: placeholderProvider, source: 'PLACEHOLDER(占位符)' };
}

export async function render(serverUrl, contractId, symbol = 'NVDA') {
  const { provider, source } = await pickProvider(serverUrl, contractId);
  return { source, quote: provider.getQuote(symbol) };
}
