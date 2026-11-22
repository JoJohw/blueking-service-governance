/*
 * TencentBlueKing is pleased to support the open source community by making
 * 蓝鲸智云 - 服务治理 (BlueKing Service Governance) available.
 * Copyright (C) Tencent. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *  http://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

import componentDefs from './plugins/component-defs.mjs';
import envSelector from './plugins/env-selector.mjs';
import fillWidthShells from './plugins/fill-width-shells.mjs';
import fullHeightShells from './plugins/full-height-shells.mjs';
import instanceLog from './plugins/instance-log.mjs';
import keyValue from './plugins/key-value.mjs';
import overflowCtrl from './plugins/overflow-ctrl.mjs';
import passwordInput from './plugins/password-input.mjs';
import scrollLayout from './plugins/scroll-layout.mjs';
import sensitiveValueInput from './plugins/sensitive-value-input.mjs';
import skeleton from './plugins/skeleton.mjs';
import sortDropdown from './plugins/sort-dropdown.mjs';
import tab from './plugins/tab.mjs';
import tableException from './plugins/table-exception.mjs';
import toggleCard from './plugins/toggle-card.mjs';
import underLineTips from './plugins/under-line-tips.mjs';

/**
 * 组件预览清单的通用生成配置。占位、过滤、风险预判集中在此。
 * 收录标准：有结构、有状态、可交互的组件；纯图标、一行提示、纯内容展示等无结构组件不收录。
 * 单个业务域的样例特例（枚举、父子关系、跨接口关联）放插件里，不堆到此处。
 */
export const CONFIG = {
  /**
   * 组件扫描 glob，相对项目根，开头的 / 会被忽略。
   * `*` 只匹配一层，`**` 递归匹配；默认扫描 src 下任意层级 components 目录中的 .vue。
   */
  componentGlobs: ['src/**/components/**/*.vue'],
  /**
   * 组件 id 的基准目录（相对项目根）与可省略的目录前缀。
   * id = 相对基准目录的路径（去掉 .vue），不做任何省略，写名单时直接照抄路径即可：
   *   src/components/key-value.vue            -> components/key-value
   *   src/pages/application/xxx/foo.vue       -> pages/application/xxx/foo
   * ignoreIds、usageExcept、插件里的 propOverrides / fillHeight 等 key 都按这个规则书写。
   */
  componentIdBase: 'src',
  componentIdStripPrefixes: [],
  /** 递归展开类型的深度上限，防止自引用类型导致无限递归 */
  maxDepth: 8,
  /** 泛型数组 T[] 生成的占位条数：一条看不出列表/溢出行为，默认给够触发「+n」的数量 */
  genericArraySize: 6,
  /** 收录门槛：引用文件数达到此值才进清单——只在一处使用的组件价值低 */
  minUsageToInclude: 2,
  /**
   * 使用次数不足但需强制保留的组件 id：单引用但形态可独立预览的展示型组件。
   * defineModel 组件会命中 warning 提示，但模板主体仍可读，不影响收录。
   */
  usageExcept: new Set([
    'components/default-value-input',
    'components/interval-selector',
    'components/monaco-editor/ms-highlightjs',
    'components/modules/component-item',
    'components/modules/space-component-item',
    'pages/application/components/key-value-badge',
    'pages/home/components/col-radio',
  ]),
  /**
   * 不展示「查看可替换结构」的组件 id（菜单里也不标 SLOT）。
   * 适用两种情况：插槽只是使用方填充的内容位，不是设计可替换的视觉区域；
   * 或者插槽形态已由别的入口表达（如 skeleton 顶部切换骨架单元），
   * 再画一块「可替换区域」只会让设计师误以为那里要设计内容。
   */
  hideSlotStructure: new Set([
    'components/skeleton/skeleton',
    // slot 内容被换成占位块后宽度信息丢失，箭头恒不出现，结构视图看不出「溢出才有箭头」；
    // 该行为已由 previewVariants 的溢出/不溢出两组表达，结构视图反而只剩一个无信息的虚线块
    'components/overflow-ctrl',
  ]),
  /** 无论如何都不进预览清单的组件 id */
  ignoreIds: new Set([
    // 图标按钮/图标文字按钮：偏开发态的原子包装，对设计师无额外视觉信息
    'components/icon-button',
    'components/icon-text-button',
    // 应用类型图标：图标与文案全靠 app-type 的映射表，新增类型还得同步维护预览样例，维护成本高于价值
    'pages/application/components/type-icon',
    // 纯 slot 容器：default 无 fallback，真实态与可替换区态渲染相同，点切换按钮无视觉变化
    'components/collapsible-panel',
    // 仅包装 bkui-vue Select，分组数据由接口驱动；静态预览要么空壳、要么只是 Select 本身，无额外可看信息
    'components/cluster-selector/cluster-selector',
    // 历史用法：自定义 ButtonGroup 仅 1 处引用，项目已统一用 bkui-vue 的 Button.ButtonGroup（16 处）
    'components/button-group',
    // 中间省略依赖测量与 resize 行为，静态预览只能看到一串截断文本，意义有限
    'components/middle-ellipsis',
    // 纯图标渲染，预览无价值
    'components/color-icon',
    // 纯图标渲染，预览无价值
    'components/svg-icon',
    // 纯状态点：只按 normal/abnormal 取色，无 slot / 交互；占位 icon 落不到两个键上因而恒空白，
    // 实际形态已由 status-icon（emphasized 模式）覆盖
    'components/status-dot-icon',
    // 仅一行提示文案，无结构可看
    'components/command-mode-hint',
    // 单 prop 的第三方 markdown/CSS 渲染壳，无状态、无交互，样例还得靠插件硬造
    'components/markdown-viewer',
    // 标题 + 默认 slot 的布局壳，单文件使用，预览只有「占位文本 + slot 块」
    'components/component-label',
    // 只有一个 span 渲染 label + 右边框，无 slot / 状态 / 交互
    'components/form-prefix',
    // 纯 label/value 行：有信息量的分支都在不传 slot 时，预览强制塞占位块后只剩两个色块
    'components/field-item',
    // 更轻量的 label/value 行，形态已被 field-item / divider-header 等覆盖，预览信息量极低
    'components/detail-item',
    // 主体是 iframe，URL 由外部接口/父页面现算，预览恒空白
    'components/monitor-iframe',
    'components/grafana-dashboard-iframe',
    // 纯接口下拉，空响应下只剩空壳，无可看的设计信息
    'components/namespace-selector',
    'components/pipeline-selector',
    // 表格、计数、筛选全在 previewData 之下，而 previewData 只能由真实上传文件 + previewRequest 返回；
    // 预览里只剩上传拖拽区和一行提示，三个函数型 props 还是占位函数，点「下载模板」拿不到 Response
    'components/env-vars-import-sideslider',

    // 布局壳 / 一行标签：只有 slot 透传或一行文案，预览里剩几个色块
    'components/flex-row',
    'components/divider-header',
    'components/collapsible-aside-layout',
    'components/custom-tag',
    'components/editable-variable-table/sensitive-value-placeholder',
    'pages/application/detail/app-config/components/modified-field-label',
    'pages/application/detail/app-config/components/probe-detail-item',
    // 纯图标 / 静态标签：无状态、无交互，或占位值导致预览空白
    'pages/application/components/topo/topology-status-icon',
    'pages/application/detail/alert-record/components/severity-label',
    'pages/application/detail/app-config/components/env-scope-tag',
    'pages/application/detail/components/auto-scale-tag',
    'pages/application/detail/app-config/components/field-reset-hint',
    // 远程空壳：依赖接口数据，空响应下只剩空下拉
    'components/git-selector',
    'pages/env/components/project-selector/project-selector',
    'pages/application/components/image-select',
    // 内部 v-if 依赖 store，预览占位下整块不渲染
    'pages/basic/app-default-config/components/resources-form',
    'pages/basic/app-default-config/components/dev-mode-form',
    // 导入类型推导失败，props 为空且主体是第三方编辑器，预览空壳
    'pages/marketplace/components/component-ouput/patch-preview-card',
    'pages/marketplace/components/component-ouput/resource-card',

    // 提示文案 / 弹层壳 / 图形容器：结构只有一层包装，信息全在接口数据里，预览里是空壳或占位文本
    'pages/application/components/build-output-hint',
    'pages/application/detail/components/view-build-log/index',
    // 与上面的弹层壳同属一个功能，日志内容依赖 SSE 流，预览里恒为空
    'pages/application/detail/components/view-build-log/build-log-panel',
    'pages/application/components/topo/resource-topology',
    // bkui-vue 原生件的组合：工具栏、单选组、表格；视觉与组件库一致，看文档即可
    'pages/application/detail/deploy/instance-list/components/instance-batch-toolbar',
    'pages/application/detail/app-config/components/mount-scope-field',
    'pages/application/detail/deploy/instance-list/components/instance-table',
    'pages/application/components/image-mode-select',
    // 编排层组合件：多个业务组件拼装而成，拆开都已单独收录，整体形态看业务页面更准
    'pages/application/detail/app-config/components/dev-mode-form',
    'pages/application/detail/app-config/components/resources-form',
    'pages/basic/release-strategies/components/strategy-sideslider',
    'components/startup-command-input',
    'components/tag-config-form',

    // 列表项：单行文件名 + 环境标签，结构单薄，单独预览没有价值
    'pages/application/detail/app-config/components/config-file-list-item',

    // 弹层宿主：只有隐藏的对话框 + openXxx 方法，本身无形态，且依赖实例列表页注入的 action context
    'pages/application/detail/deploy/instance-list/components/instance-actions-host',
    // 流水线参数表单：形态完全由后端返回的参数列表决定，属业务编排
    'pages/application/components/pipeline-params-form',
    // 保存版本确认弹窗：Dialog + MsEditor(diff) + Form 的组合，内容与三态文案都由父级给定
    'pages/application/detail/app-config/components/save-version-confirm-dialog',
    // 生效范围表单块：四个环境标签勾一下就走，无自身状态与后续反馈
    'pages/basic/app-default-config/components/app-spec-scope-section',
    // 主体是 key-value + 一条 Go 代理提示，核心已单独收录
    'pages/application/components/go-build-args',
  ]),
  warning: {
    /** 风险提示统一用"可能"措辞：静态正则只能预判，无法确认一定会异常 */
    text: '该组件可能无法在预览中完整展示，如显示异常请自行排查',
    /**
     * 每条规则命中即打同一条提示；新增预判特征往这里加即可。
     *
     * 只保留预览侧确实没有兜底的特征，避免提示变成噪音（曾出现 12 条提示全是误报）：
     * - iframe：内容由外部页面决定，预览里恒空白
     * - route.params：预览路由没有业务参数，读到的值恒为 undefined
     * 已删除的旧特征：
     * - Dialog/Sideslider：改由 visibilityProp + 打开按钮支持，类型说明交给标题旁的「弹窗类组件」标签
     * - defineProps 对象声明：props.mjs 的 analyzeRuntimeProps 已兜底
     * - defineModel：props.mjs 的 extractDefineModelProps 已按声明补占位值
     * - useRouter()：预览页跑在真实路由里，router 可用
     * - group-hover + opacity-0：预览页已有 opacity:1 补丁
     */
    patterns: [
      source => /<iframe\b/.test(source),
      source => /route\.params/.test(source),
    ],
  },
  /**
   * 各类型的占位值。string 用可读文案而非空串，避免预览里出现空白；
   * fn 用唯一 Symbol 标记，序列化时再转成函数字面量，避免占位函数被当普通对象展开。
   */
  placeholders: {
    string: '占位文本',
    number: 1,
    boolean: false,
    null: null,
    array: [],
    object: {},
    fn: Symbol('placeholder-fn'),
  },
  /**
   * 按属性名覆写占位值：数字占位默认 1，尺寸/字号用 1 预览看不见，
   * 故放大到可视尺寸。只对"恰好等于数字占位"的值生效，真实默认值不动。
   */
  namedOverrides: [
    // 面板/弹层宽度要容纳多列内容，通用尺寸值会把列挤成竖排
    { pattern: /^(popoverwidth|panelwidth|dialogwidth|drawerwidth)$/i, value: 800 },
    { pattern: /^(size|radius|offset|\w*(width|height))$/i, value: 120 },
    { pattern: /^(fontsize|\w+size)$/i, value: 14 },
  ],
  /** 业务域插件：每个插件自带一组领域特例，生成器只按固定扩展点消费 */
  plugins: [
    componentDefs,
    envSelector,
    fillWidthShells,
    fullHeightShells,
    instanceLog,
    keyValue,
    overflowCtrl,
    passwordInput,
    scrollLayout,
    sensitiveValueInput,
    skeleton,
    sortDropdown,
    tableException,
    tab,
    toggleCard,
    underLineTips,
  ],
};
