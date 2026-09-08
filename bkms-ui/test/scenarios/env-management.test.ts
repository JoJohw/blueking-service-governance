/**
 * 场景级测试：环境管理（路径清单见 docs/vitest/guides/TEST_SCENARIOS_ROUTES.md S9）
 *
 * 覆盖七组用户可感知行为：
 *   列表有数据 / 空列表 / 打开删除确认 / 名称不一致时禁用删除 / 删除成功 / 删除失败 / 有部署应用时告警 → V = 7
 *
 * 表格处理：vxe（@blueking/table）的纯 field 字段单元格在 jsdom 下不产出 DOM，
 * 故将 Table/TableColumn stub 为「按 data 渲染行 + 透传列插槽」的极简表格（模板见 skill conventions.md）；
 * 页面上的 CustomFilter / useElementHeight 仍触碰 vxe DOM 工具，故尺寸垫片与 stub 并用。
 *
 * 业务约定：HTTP 错误由 fetch interceptor 统一反馈，删除失败时组件静默（仅不关闭弹窗），
 * 用例按现状行为断言，不额外要求错误提示。
 */
import { cleanup, render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// 同 application-list：重型列表页冷启动渲染约 5s，逼近默认超时，放宽单条用例超时。
vi.setConfig({ testTimeout: 15_000 });

const mocks = vi.hoisted(() => ({
  listEnvs: vi.fn(),
  deleteEnv: vi.fn(),
  getEnv: vi.fn(),
}));

beforeAll(() => {
  (globalThis as Record<string, unknown>).HTMLDocument = Document;
  const size = (value: number) => ({ configurable: true, get: () => value });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', size(600));
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', size(1200));
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', size(600));
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', size(1200));
  Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return { width: 1200, height: 600, top: 0, left: 0, bottom: 600, right: 1200, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
  };
  Element.prototype.scrollTo = function scrollTo() {};
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

vi.mock('@blueking/table', async () => {
  const { defineComponent, h, Comment } = await import('vue');
  const TableColumnStub = defineComponent({
    props: { field: { type: String, default: '' }, label: { type: String, default: '' }, type: { type: String, default: '' } },
    setup(_props, { slots }) {
      return () => (slots.default ? h('span', slots.default({ row: {}, rowIndex: 0 })) : h(Comment, ''));
    },
  });
  const TableStub = defineComponent({
    props: { data: { type: Array, default: () => [] } },
    setup(props, { slots }) {
      return () => {
        const columns = (slots.default?.() ?? []).filter(Boolean);
        const rows = props.data as Record<string, unknown>[];
        const body = rows.length
          ? rows.map((row, rowIndex) =>
              h('div', { key: rowIndex, 'data-testid': 'table-row' },
                columns.map((col: { props?: { field?: string }; children?: { default?: (s: unknown) => unknown } }, i: number) =>
                  h('span', { key: i }, [
                    col.children?.default ? col.children.default({ row, rowIndex }) : String(row?.[col.props?.field ?? ''] ?? '--'),
                  ]))),
            )
          : slots.empty?.();
        return h('div', { 'data-testid': 'table-stub' }, [body]);
      };
    },
  });
  return { Table: TableStub, TableColumn: TableColumnStub };
});

vi.mock('~/api/modules/v1', () => ({
  EnvService: { listEnvs: mocks.listEnvs, getEnv: mocks.getEnv, deleteEnv: mocks.deleteEnv },
  WorkspaceService: { getWorkspace: vi.fn().mockResolvedValue({}) },
  BkintegrationsBkmonitorService: { listApms: vi.fn().mockResolvedValue([]) },
}));
vi.mock('vue-router', async importOriginal => ({
  ...(await importOriginal<object>()),
  useRouter: () => ({ push: vi.fn(), currentRoute: { value: { query: {} } } }),
  useRoute: () => ({
    path: '/ws-1/env',
    fullPath: '/ws-1/env',
    name: 'env',
    query: {},
    params: { space: 'ws-1' },
    meta: {},
    matched: [],
  }),
}));
vi.mock('~/stores/space', () => ({ useSpaceStore: () => ({ currentSpace: 'ws-1' }) }));
vi.mock('vue-i18n', async importOriginal => ({
  ...(await importOriginal<object>()),
  useI18n: () => ({ t: (s: string) => s, te: () => true }),
}));

// 各字段取不同值，避免多列渲染出相同文本导致查询歧义
const env = (name: string) => ({
  id: 'env-id-1',
  name,
  displayName: '环境A',
  type: 'test',
  appCount: 0,
  creator: 'tester',
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listEnvs.mockResolvedValue([env('env-a')]);
  mocks.getEnv.mockResolvedValue(undefined); // 无部署应用 → 直接打开删除确认
  mocks.deleteEnv.mockResolvedValue({});
});

async function renderPage() {
  const { default: EnvPage } = await import('~/pages/env/env.vue');
  return render(EnvPage as never, {
    props: { space: 'ws-1' } as never,
    global: {
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

/** 打开删除确认弹窗，返回弹窗内的确认按钮（页面上最后一个「删除」按钮） */
async function openDeleteDialog() {
  await waitFor(() => expect(screen.getByText('env-a')).toBeInTheDocument());
  await userEvent.click(screen.getByText('删除'));
  await waitFor(() => expect(screen.getByText(/确定删除环境/)).toBeInTheDocument());
  const buttons = screen.getAllByRole('button', { name: '删除' });
  return buttons[buttons.length - 1];
}

afterEach(cleanup);

describe('环境管理：列表状态', () => {
  it('当环境列表加载完成时，应展示环境名称', async () => {
    await renderPage();
    await waitFor(() => expect(screen.getByText('env-a')).toBeInTheDocument());
  });

  it('当环境列表为空时，应不显示任何环境', async () => {
    mocks.listEnvs.mockResolvedValue([]);
    await renderPage();
    await waitFor(() => expect(mocks.listEnvs).toHaveBeenCalled());
    expect(screen.queryByText('env-a')).not.toBeInTheDocument();
  });
});

describe('环境管理：删除二次确认', () => {
  it('当用户点击某环境的删除时，应打开删除确认弹窗', async () => {
    await renderPage();
    await waitFor(() => expect(screen.getByText('env-a')).toBeInTheDocument());
    await userEvent.click(screen.getByText('删除'));
    await waitFor(() => expect(screen.getByText(/确定删除环境/)).toBeInTheDocument());
  });

  it('当用户输入的名称与环境不一致时，删除应被禁用', async () => {
    await renderPage();
    const confirmBtn = await openDeleteDialog();
    await userEvent.type(screen.getByPlaceholderText('请输入待删除环境名称'), 'env-b');
    expect(confirmBtn).toBeDisabled();
  });

  it('当用户输入正确名称并确认删除时，应删除成功并刷新列表', async () => {
    await renderPage();
    const confirmBtn = await openDeleteDialog();
    await userEvent.type(screen.getByPlaceholderText('请输入待删除环境名称'), 'env-a');
    await waitFor(() => expect(confirmBtn).toBeEnabled());
    await userEvent.click(confirmBtn);
    await waitFor(() => expect(mocks.deleteEnv).toHaveBeenCalledWith({ envID: 'env-id-1' }));
    // 以「列表重新拉取」作为删除成功的可感知结果（Dialog 关闭带过渡，jsdom 下节点不立即移除）
    await waitFor(() => expect(mocks.listEnvs).toHaveBeenCalledTimes(2));
  });

  it('当删除接口失败时，应保留弹窗让用户可重试', async () => {
    mocks.deleteEnv.mockRejectedValue(new Error('network error'));
    await renderPage();
    const confirmBtn = await openDeleteDialog();
    await userEvent.type(screen.getByPlaceholderText('请输入待删除环境名称'), 'env-a');
    await waitFor(() => expect(confirmBtn).toBeEnabled());
    await userEvent.click(confirmBtn);
    await waitFor(() => expect(mocks.deleteEnv).toHaveBeenCalled());
    // 现状行为：失败不关闭弹窗（错误由 interceptor 统一反馈），用户可修正后重试
    expect(screen.getByText(/确定删除环境/)).toBeInTheDocument();
  });

  it('当环境已部署应用时，应先提示部署情况而不直接弹出删除确认', async () => {
    mocks.getEnv.mockResolvedValue({ appDeployStatuses: [{ name: 'app-a' }] });
    await renderPage();
    await waitFor(() => expect(screen.getByText('env-a')).toBeInTheDocument());
    await userEvent.click(screen.getByText('删除'));
    await waitFor(() => expect(mocks.getEnv).toHaveBeenCalled());
    // 推断/需确认：当前实现为「不打开删除弹窗、转由部署告警承接」，业务规则待确认
    expect(screen.queryByText(/确定删除环境/)).not.toBeInTheDocument();
  });
});
