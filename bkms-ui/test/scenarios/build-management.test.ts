/**
 * 场景级测试：构建管理（路径清单见 docs/vitest/guides/TEST_SCENARIOS_ROUTES.md S18）
 *
 * 覆盖三组用户可感知行为：
 *   镜像仓库来源禁用执行构建 / 代码仓库来源可执行构建 / 点击后弹出执行配置 → V = 3
 *
 * 说明：构建历史为列表（vxe），本场景聚焦「构建入口」的判定与弹层；
 * RepoRefSelect 为重型子件（依赖代码仓库接口），stub 为标记元素。
 */
import { cleanup, render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { createPinia } from 'pinia';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installVxeShims } from './helpers/vxe-shims';

// 页面含 vxe 构建历史表格，需先装垫片（同 S14/S9）
installVxeShims();
// 重型列表页冷启动接近默认超时，放宽单条用例超时
vi.setConfig({ testTimeout: 15_000 });

beforeAll(() => {
  installVxeShims();
});

const harness = vi.hoisted(() => ({
  sourceType: 'imageRegistry' as string,
  /** 任意 service：任何方法调用都返回 resolved（列表类返回空列表），避免逐个猜方法名 */
  anyService: () =>
    new Proxy({} as Record<string, unknown>, {
      get: () => vi.fn().mockResolvedValue({ list: [], total: 0 }),
    }),
}));

vi.mock('vue-i18n', async importOriginal => ({
  ...(await importOriginal<object>()),
  useI18n: () => ({ t: (s: string) => s, te: () => true }),
}));
vi.mock('vue-router', async importOriginal => ({
  ...(await importOriginal<object>()),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), currentRoute: { value: { query: {} } } }),
  useRoute: () => ({
    path: '/ws-1/app/app-a/detail/app-build',
    fullPath: '/ws-1/app/app-a/detail/app-build',
    name: 'app-build',
    query: {},
    params: { space: 'ws-1' },
    meta: {},
    matched: [],
  }),
}));
vi.mock('~/api/modules/v1', () => ({
  BuildsService: harness.anyService(),
  BkintegrationsBkciService: harness.anyService(),
}));
vi.mock('~/api/modules/bkmsserver', () => ({
  // 页面经 use-recommend-tag 拉取推荐镜像 tag，需 mock 否则发起真实请求
  ApiServerService: harness.anyService(),
}));
vi.mock('~/stores/app-detail', () => ({
  useAppDetail: () => ({
    appID: 'app-a',
    appDetail: { buildConfig: { sourceType: harness.sourceType } },
    updateAppName: vi.fn(),
    updateAppID: vi.fn(),
  }),
}));
// 代码仓库选择器：依赖外部仓库接口，stub 为标记元素
vi.mock('~/components/repo-ref-select.vue', async () => {
  const { defineComponent } = await import('vue');
  return { default: defineComponent({ name: 'RepoRefSelectStub', template: '<div>repo-ref-select</div>' }) };
});

beforeEach(() => {
  vi.clearAllMocks();
  harness.sourceType = 'imageRegistry';
});

async function renderPage() {
  const { default: BuildManagement } = await import(
    '~/pages/application/detail/app-build/build-management.vue'
  );
  return render(BuildManagement as never, {
    global: { plugins: [createPinia()], mocks: { $t: (s: string) => s } } as never,
  });
}

afterEach(cleanup);

describe('构建管理：构建入口按镜像来源分发', () => {
  it('当应用镜像来源为镜像仓库时，执行构建应被禁用', async () => {
    await renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: '执行构建' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '执行构建' })).toBeDisabled();
  });

  it('当应用镜像来源为代码仓库时，执行构建应可用', async () => {
    harness.sourceType = 'codeRepository';
    await renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: '执行构建' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '执行构建' })).toBeEnabled();
  });

  it('当用户点击执行构建时，应弹出执行配置', async () => {
    harness.sourceType = 'codeRepository';
    await renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: '执行构建' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: '执行构建' }));
    await waitFor(() => expect(screen.getByText('执行配置')).toBeInTheDocument());
  });
});
