/**
 * 场景级测试：提交部署 / 部署管理（路径清单见 docs/vitest/guides/TEST_SCENARIOS_ROUTES.md S2）
 *
 * 覆盖两组用户可感知行为（聚焦部署入口的权限分发）：
 *   模型类应用展示特性环境入口 / 非模型类应用不展示该入口 → V = 2
 *
 * 说明：页面为部署总览容器（Tab + 环境选择 + 部署入口），子页（实例列表/部署历史/资源拓扑）
 * 各自体量大，本轮 stub 为标记文本；「点击部署走 precheck 与提交」路径依赖 precheck 流程，
 * 见评审 backlog。
 */
import { cleanup, render, screen, waitFor } from '@testing-library/vue';
import { createPinia } from 'pinia';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installVxeShims } from './helpers/vxe-shims';

// 页面含实例列表等 vxe 表格；且为重型页面，冷启动逼近默认超时
installVxeShims();
vi.setConfig({ testTimeout: 20_000 });

beforeAll(() => {
  installVxeShims();
});

const harness = vi.hoisted(() => ({
  appType: 'trpc' as string,
  anyService: () => new Proxy({} as Record<string, unknown>, { get: () => vi.fn().mockResolvedValue({ list: [], total: 0 }) }),
}));

vi.mock('vue-i18n', async importOriginal => ({
  ...(await importOriginal<object>()),
  useI18n: () => ({ t: (s: string) => s, te: () => true }),
}));
vi.mock('vue-router', async importOriginal => ({
  ...(await importOriginal<object>()),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), currentRoute: { value: { query: {} } } }),
  useRoute: () => ({
    path: '/ws-1/app/app-a/detail/deploy',
    fullPath: '/ws-1/app/app-a/detail/deploy',
    name: 'deploy',
    query: {},
    params: { space: 'ws-1' },
    meta: {},
    matched: [],
  }),
}));
vi.mock('~/api/modules/v1', () => new Proxy({} as Record<string, unknown>, { get: () => harness.anyService() }));
vi.mock('~/api/modules/bkmsserver', () => new Proxy({} as Record<string, unknown>, { get: () => harness.anyService() }));
vi.mock('~/stores/app-detail', () => ({
  useAppDetail: () => ({
    appID: 'app-a',
    appType: harness.appType,
    appDetail: {},
    updateAppName: vi.fn(),
    updateAppID: vi.fn(),
  }),
}));

// 重子页 stub 为标记文本
const subPageStub = async (name: string) => {
  const { defineComponent } = await import('vue');
  return { default: defineComponent({ name, template: `<div>${name}</div>` }) };
};
vi.mock('~/pages/application/detail/deploy/overview/deploy-overview.vue', () => subPageStub('DeployOverviewStub'));
vi.mock('~/pages/application/detail/deploy/deploy-history.vue', () => subPageStub('DeployHistoryStub'));
vi.mock('~/pages/application/detail/deploy/quickly-deploy.vue', () => subPageStub('QuicklyDeployStub'));
vi.mock('~/pages/application/detail/deploy/instance-list/full-update.vue', () => subPageStub('FullUpdateStub'));

beforeEach(() => {
  vi.clearAllMocks();
  harness.appType = 'trpc';
});

async function renderPage() {
  const { default: DeployPage } = await import('~/pages/application/detail/deploy/deploy.vue');
  return render(DeployPage as never, {
    global: {
      plugins: [createPinia()],
      mocks: { $t: (s: string) => s },
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

describe('部署管理：特性环境入口按应用类型分发', () => {
  it('当应用为模型类（trpc）时，应展示特性环境入口', async () => {
    await renderPage();
    await waitFor(() => expect(screen.getByText(/应用关联的特性环境/)).toBeInTheDocument());
  });

  it('当应用非模型类时，不应展示特性环境入口', async () => {
    harness.appType = 'default';
    await renderPage();
    await waitFor(() => expect(screen.getByText('部署管理')).toBeInTheDocument());
    expect(screen.queryByText(/应用关联的特性环境/)).not.toBeInTheDocument();
  });
});
