/**
 * 场景级测试：应用列表页（路径清单见 docs/vitest/guides/TEST_SCENARIOS_ROUTES.md S14）
 *
 * 覆盖：有数据 / 空列表 / 加载失败 / 进入详情 → V = 4
 *
 * 局部尺寸垫片说明：`@blueking/table`（内部 vxe-table）依赖元素尺寸决定是否渲染行，
 * jsdom 中 offsetHeight/clientHeight 恒为 0 会导致表格不渲染任何行。此处仅在本文件内
 * 注入固定尺寸与真实的 ResizeObserver 回调（不改全局 setup，避免影响既有测试）。
 */
import { cleanup, render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listApps: vi.fn(),
  push: vi.fn(),
}));

vi.mock('~/api/modules/bkmsserver', () => ({
  ApiServerService: { ListApps: mocks.listApps },
}));
vi.mock('vue-router', async importOriginal => ({
  ...(await importOriginal<object>()),
  useRouter: () => ({ push: mocks.push, currentRoute: { value: { query: {} } } }),
  useRoute: () => ({
    path: '/ws-1/app',
    fullPath: '/ws-1/app',
    name: 'app',
    query: {},
    params: { space: 'ws-1' },
    meta: {},
    matched: [],
  }),
}));
vi.mock('~/stores/space', () => ({ useSpaceStore: () => ({ currentSpace: 'ws-1' }) }));
vi.mock('~/stores/app-detail', () => ({
  useAppDetail: () => ({ updateAppName: vi.fn(), updateAppID: vi.fn() }),
}));
vi.mock('vue-i18n', async importOriginal => ({
  ...(await importOriginal<object>()),
  useI18n: () => ({ t: (s: string) => s, te: () => true }),
}));

beforeAll(() => {
  // vxe-table 的 DOM 工具会引用 HTMLDocument 判断文档类型，jsdom 未暴露该全局
  (globalThis as Record<string, unknown>).HTMLDocument = Document;
  // jsdom 未实现元素滚动 API，vxe 虚拟滚动会调用
  Element.prototype.scrollTo = function scrollTo() {};
  const size = (value: number) => ({ configurable: true, get: () => value });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', size(600));
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', size(1200));
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', size(600));
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', size(1200));
  globalThis.ResizeObserver = class {
    cb: ResizeObserverCallback;
    constructor(cb: ResizeObserverCallback) {
      this.cb = cb;
    }
    observe(target: Element) {
      this.cb([{ target } as ResizeObserverEntry], this as never);
    }
    unobserve() {}
    disconnect() {}
  } as never;
});

const app = (name: string) => ({
  name,
  type: 'default',
  language: 'go',
  creator: 'tester',
  deployedEnvs: [],
  createdAt: '2026-09-01T10:00:00Z',
  lastOperatedAt: '2026-09-01T10:00:00Z',
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listApps.mockResolvedValue([app('app-a')]);
});

async function renderPage() {
  const { default: Application } = await import('~/pages/application/application.vue');
  return render(Application as never, {
    props: { space: 'ws-1' } as never,
    global: {
      mocks: { $t: (s: string) => s },
      // 空态/异常态文案由 <i18n-t> 插值组件渲染，直译为 keypath 供断言
      components: {
        'i18n-t': {
          props: { keypath: { type: String, default: '' } },
          template: '<span>{{ keypath }}</span>',
        },
      },
    } as never,
  });
}

afterEach(cleanup);

describe('应用列表：数据状态与导航', () => {
  it('当应用列表加载完成时，应展示应用名称', async () => {
    await renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'app-a' })).toBeInTheDocument());
  });

  it('当应用列表为空时，应结束加载且不显示任何应用', async () => {
    mocks.listApps.mockResolvedValue([]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('创建应用')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'app-a' })).not.toBeInTheDocument();
    // 注：表格 #empty 插槽的「暂无数据」文案在 jsdom 下未渲染（vxe 空态依赖布局），
    // 故此处断言「加载结束 + 无数据行」；空态文案待解，见评审 backlog
  });

  it('当应用列表加载失败时，应结束加载状态且不渲染任何应用数据', async () => {
    mocks.listApps.mockRejectedValue(new Error('network error'));
    await renderPage();
    // 失败后必须退出骨架屏（源码 .catch 复位 isLoading），否则用户会一直看到加载中
    await waitFor(() => expect(screen.getByText('创建应用')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'app-a' })).not.toBeInTheDocument();
  });

  it('当用户点击应用名称时，应进入该应用详情', async () => {
    await renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'app-a' }));
    expect(mocks.push).toHaveBeenCalled();
  });
});
