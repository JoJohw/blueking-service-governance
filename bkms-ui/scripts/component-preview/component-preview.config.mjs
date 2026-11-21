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

/**
 * 组件预览清单的生成配置。占位、过滤、风险预判都集中在此，逻辑侧只读取不写死。
 * 新增忽略规则、调占位值、加风险特征都改这里。
 */
export const CONFIG = {
  /** 递归展开类型的深度上限，防止自引用类型导致无限递归 */
  maxDepth: 6,
  /** 收录门槛：引用文件数达到此值才进清单——只在一处使用的组件价值低 */
  minUsageToInclude: 2,
  /** 使用次数不足但需强制保留的组件 id */
  usageExcept: new Set([]),
  /** 无论如何都不进预览清单的组件 id */
  ignoreIds: new Set([
    // 纯图标渲染，预览无价值
    'color-icon',
    // 纯图标渲染，预览无价值
    'svg-icon',
    // 纯状态点：只按 normal/abnormal 取色，无 slot / 交互；占位 icon 落不到两个键上因而恒空白，
    // 实际形态已由 status-icon（emphasized 模式）覆盖
    'status-dot-icon',
    // 仅一行提示文案，无结构可看
    'command-mode-hint',
    // 主体是 iframe，URL 由外部接口/父页面现算，预览恒空白
    'monitor-iframe',
    'grafana-dashboard-iframe',
    // 纯接口下拉，空响应下只剩空壳，无可看的设计信息
    'namespace-selector',
    'pipeline-selector',
  ]),
  warning: {
    /** 风险提示统一用"可能"措辞：静态正则只能预判，无法确认一定会异常 */
    text: '该组件可能无法在预览中完整展示，如显示异常请自行排查',
    /** 每条规则命中即打同一条提示；新增预判特征往这里加即可 */
    patterns: [
      source => /<(Dialog|Sideslider)\b/.test(source) && /render-directive="if"|v-model:is-show|:is-show=/.test(source),
      source => /<iframe\b/.test(source),
      source => /defineModel\s*\(/.test(source),
      source => /defineProps\s*\(\s*\{/.test(source),
      source => /useRouter\s*\(|route\.params/.test(source),
      source => /opacity-0/.test(source) && /group-hover:opacity-100/.test(source),
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
};
