/**
 * 场景级测试：动态 / 重复输入项（S5 补齐：repeatable-input）
 * 路径清单见 docs/vitest/guides/TEST_SCENARIOS_ROUTES.md S5
 *
 * 覆盖三组用户可感知行为：初始渲染 / 新增条目 / 删除条目 → V = 3
 * （第 4 条路径「必填校验提示」为 tooltips 形式，jsdom 下不可断言，见文件末注释）
 *
 * 说明：删除按钮是 bkui-vue 的 Del 图标（渲染为 svg，无可访问角色），
 * 只能通过容器查询定位，已在用例中注释说明。
 */
import { cleanup, render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { defineComponent, h, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
  value: ['a', 'b'] as string[],
  required: false as boolean,
}));

vi.mock('vue-i18n', async importOriginal => ({
  ...(await importOriginal<object>()),
  useI18n: () => ({ t: (s: string) => s, te: () => true }),
}));

const RepeatableInput = await import('~/components/repeatable-input.vue').then(m => m.default);

const Harness = defineComponent({
  setup() {
    const value = ref<string[]>([...harness.value]);
    return () =>
      h(RepeatableInput as never, {
        modelValue: value.value,
        'onUpdate:modelValue': (v: string[]) => (value.value = v),
        required: harness.required,
        placeholder: '请输入值',
      } as never);
  },
});

beforeEach(() => {
  harness.value = ['a', 'b'];
  harness.required = false;
});

afterEach(cleanup);

describe('重复输入项：增删与校验', () => {
  it('当存在初始值时应渲染对应数量的输入项', () => {
    render(Harness, { global: { mocks: { $t: (s: string) => s } } as never });
    expect(screen.getAllByPlaceholderText('请输入值')).toHaveLength(2);
  });

  it('当用户点击添加时，应新增一个空输入项', async () => {
    render(Harness, { global: { mocks: { $t: (s: string) => s } } as never });
    await userEvent.click(screen.getByText('添加'));
    expect(screen.getAllByPlaceholderText('请输入值')).toHaveLength(3);
  });

  it('当用户删除某项时，仅该项被移除', async () => {
    const { container } = render(Harness, { global: { mocks: { $t: (s: string) => s } } as never });
    // Del 为 bkui-vue 图标组件，渲染为 svg 且无 role，只能按标签查询
    const delIcons = container.querySelectorAll('svg');
    await userEvent.click(delIcons[0]);
    expect(screen.getAllByPlaceholderText('请输入值')).toHaveLength(1);
  });

  // 未覆盖：必填为空时的校验提示。
  // 原因：FormItem 用 error-display-type="tooltips"，错误以浮层形式展示，jsdom 下不产出可查询文本。
  // 已登记 ai_unsure.md 与评审 backlog，待专项处理。
});
