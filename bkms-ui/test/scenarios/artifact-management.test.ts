/**
 * 场景级测试：制品管理（路径清单见 docs/vitest/guides/TEST_SCENARIOS_ROUTES.md S11）
 *
 * 覆盖两组用户可感知行为：
 *   Helm-like 应用显示双页签 / 非 Helm-like 不显示页签直接展示容器镜像 → V = 2
 *   （第 3 条路径「切换页签」在 jsdom 下不可行，见文件末注释）
 *
 * 说明：被测核心是 index.vue 的「应用类型 → 视图分发」与 Tab 切换逻辑；
 * container-image / helm-chart 为重型子页（含表格与上传交互），此处 stub 为标记文本，
 * 其行为留待各自场景覆盖。
 */
import userEvent from '@testing-library/user-event';
import { cleanup, render, screen, waitFor } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';


const harness = vi.hoisted(() => ({
  appType: 'helm' as string,
}));

vi.mock('vue-i18n', async importOriginal => ({
  ...(await importOriginal<object>()),
  useI18n: () => ({ t: (s: string) => s, te: () => true }),
}));
vi.mock('vue-router', async importOriginal => ({
  ...(await importOriginal<object>()),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), currentRoute: { value: { query: {} } } }),
  useRoute: () => ({
    path: '/ws-1/app/app-a/detail/artifact',
    fullPath: '/ws-1/app/app-a/detail/artifact',
    name: 'artifact',
    query: {},
    params: { space: 'ws-1' },
    meta: {},
    matched: [],
  }),
}));
vi.mock('~/stores/app-detail', () => ({
  useAppDetail: () => ({
    appType: harness.appType,
    updateAppName: vi.fn(),
    updateAppID: vi.fn(),
  }),
}));
// 重型子页 stub：仅保留可断言的标记文本
vi.mock('~/pages/application/detail/artifact/container-image.vue', async () => {
  const { defineComponent } = await import('vue');
  return { default: defineComponent({ name: 'ContainerImageStub', template: '<div>container-image-content</div>' }) };
});
vi.mock('~/pages/application/detail/artifact/helm-chart.vue', async () => {
  const { defineComponent } = await import('vue');
  return { default: defineComponent({ name: 'HelmChartStub', template: '<div>helm-chart-content</div>' }) };
});

beforeEach(() => {
  vi.clearAllMocks();
  harness.appType = 'helm';
});

async function renderPage() {
  const { default: ArtifactPage } = await import('~/pages/application/detail/artifact/index.vue');
  return render(ArtifactPage as never, {
    global: { mocks: { $t: (s: string) => s } } as never,
  });
}

afterEach(cleanup);

describe('制品管理：按应用类型分发视图', () => {
  it('当应用为 Helm-like 类型时，应展示容器镜像与 Helm Chart 两个制品页签', async () => {
    await renderPage();
    await waitFor(() => expect(screen.getByText('容器镜像')).toBeInTheDocument());
    expect(screen.getByText('Helm Chart')).toBeInTheDocument();
    // 默认落在第一个页签：容器镜像
    expect(screen.getByText('container-image-content')).toBeInTheDocument();
  });

  it('当应用非 Helm-like 类型时，应直接展示容器镜像而不显示页签', async () => {
    harness.appType = 'default';
    await renderPage();
    await waitFor(() => expect(screen.getByText('container-image-content')).toBeInTheDocument());
    expect(screen.queryByText('Helm Chart')).not.toBeInTheDocument();
  });

  // 未覆盖：点击页签切换内容（V 的第 3 条路径）。
  // 原因：activeTab 经 useUrlQuerySync 与路由 query 双向同步，mock 路由下点击后 URL 不回写，
  // 组件不切换（jsdom 下非缺陷表现，需真实路由或改写同步方式才能测）。
  // 已登记 ai_unsure.md 与评审 backlog，待专项处理。
});
