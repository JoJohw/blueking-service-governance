/**
 * 场景级测试：构建管理（路径清单见 docs/vitest/guides/TEST_SCENARIOS_ROUTES.md S18）
 *
 * 覆盖三组用户可感知行为：
 *   镜像仓库来源禁用执行构建 / 代码仓库来源可执行构建 / 点击后弹出执行配置 → V = 3
 *
 * 说明：构建历史为列表（vxe），本场景聚焦「构建入口」的判定与弹层；
 * CodeRevisionField 为重型子件，使用与宿主 wiring 对齐的契约 stub；FlexRow 仅保留 left 插槽。
 */
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/vue';
import { createPinia } from 'pinia';
import { defineComponent, h } from 'vue';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { i18nGlobalMocks } from '../helpers/mock-i18n';
import { installVxeShims } from '../helpers/mock-table';

// 页面含 vxe 构建历史表格，需先装垫片（同 S14/S9）
vi.mock('@blueking/table', async () => {
  const { tableMockFactory } = await import('../helpers/mock-table');
  return tableMockFactory();
});

beforeAll(() => {
  installVxeShims();
});

const harness = vi.hoisted(() => ({
  sourceType: 'imageRegistry' as string,
}));

vi.mock('vue-i18n', async () => (await import('../helpers/mock-i18n')).i18nMockFactory());
vi.mock('vue-router', async () => {
  const { createRouterMock } = await import('../helpers/mock-router');
  return createRouterMock({
    route: { path: '/ws-1/app/app-a/detail/app-build', name: 'app-build', params: { space: 'ws-1' } },
  });
});
vi.mock('~/api/modules/v1', async () => {
  const { createAnyServiceMock } = await import('../helpers/mock-service');
  return {
    BuildsService: createAnyServiceMock('BuildsService'),
    BkintegrationsBkciService: createAnyServiceMock('BkintegrationsBkciService'),
  };
});
vi.mock('~/api/modules/bkmsserver', async () => {
  const { createAnyServiceMock } = await import('../helpers/mock-service');
  // 页面经 use-recommend-tag 拉取推荐镜像 tag，需 mock 否则发起真实请求
  return { ApiServerService: createAnyServiceMock('ApiServerService') };
});
vi.mock('~/stores/app-detail', () => ({
  useAppDetail: () => ({
    appID: 'app-a',
    appDetail: { buildConfig: { sourceType: harness.sourceType } },
    updateAppName: vi.fn(),
    updateAppID: vi.fn(),
  }),
}));
beforeEach(() => {
  vi.clearAllMocks();
  harness.sourceType = 'imageRegistry';
});

async function renderPage() {
  const { default: BuildManagement } = await import('~/pages/application/detail/app-build/build-management.vue');
  return render(BuildManagement as never, {
    global: {
      plugins: [createPinia()],
      mocks: i18nGlobalMocks,
      stubs: {
        CodeRevisionField: defineComponent({
          name: 'CodeRevisionFieldStub',
          setup(_, { expose }) {
            expose({
              containsTarget: () => false,
              dismissIfOutside: () => undefined,
              hidePopover: () => undefined,
              prepare: (preferred = '') => preferred,
              reset: () => undefined,
            });
            return () => h('div', { 'data-testid': 'code-revision-field' });
          },
        }),
        FlexRow: defineComponent({
          name: 'FlexRowStub',
          setup(_, { slots }) {
            return () => h('div', slots.left?.());
          },
        }),
      },
    } as never,
  });
}

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
