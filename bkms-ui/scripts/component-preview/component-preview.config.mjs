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
import scrollLayout from './plugins/scroll-layout.mjs';
import skeleton from './plugins/skeleton.mjs';

/**
 * 组件预览清单的通用生成配置。占位、过滤、风险预判集中在此。
 * 单个业务域的样例特例（枚举、父子关系、跨接口关联）放插件里，不堆到此处。
 */
export const CONFIG = {
  /** 递归展开类型的深度上限，防止自引用类型导致无限递归 */
  maxDepth: 6,
  /** 泛型数组 T[] 生成的占位条数：一条看不出列表/溢出行为，默认给够触发「+n」的数量 */
  genericArraySize: 6,
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
    // 只有一个 span 渲染 label + 右边框，无 slot / 状态 / 交互
    'form-prefix',
    // 主体是 iframe，URL 由外部接口/父页面现算，预览恒空白
    'monitor-iframe',
    'grafana-dashboard-iframe',
    // 纯接口下拉，空响应下只剩空壳，无可看的设计信息
    'namespace-selector',
    'pipeline-selector',
    // 表格、计数、筛选全在 previewData 之下，而 previewData 只能由真实上传文件 + previewRequest 返回；
    // 预览里只剩上传拖拽区和一行提示，三个函数型 props 还是占位函数，点「下载模板」拿不到 Response
    'env-vars-import-sideslider',
  ]),
  warning: {
    /** 风险提示统一用"可能"措辞：静态正则只能预判，无法确认一定会异常 */
    text: '该组件可能无法在预览中完整展示，如显示异常请自行排查',
    /**
     * 每条规则命中即打同一条提示；新增预判特征往这里加即可。
     *
     * 只保留预览侧确实没有兜底的特征，避免提示变成噪音（曾出现 12 条提示全是误报）：
     * - iframe：内容由外部页面决定，预览里恒空白
     * - defineModel：props 推导只认 defineProps，defineModel 声明的属性拿不到占位值
     * - route.params：预览路由没有业务参数，读到的值恒为 undefined
     * 已删除的旧特征：
     * - Dialog/Sideslider：改由 visibilityProp + 打开按钮支持，类型说明交给标题旁的「弹窗类组件」标签
     * - defineProps 对象声明：props.mjs 的 analyzeRuntimeProps 已兜底
     * - useRouter()：预览页跑在真实路由里，router 可用
     * - group-hover + opacity-0：预览页已有 opacity:1 补丁
     */
    patterns: [
      source => /<iframe\b/.test(source),
      source => /defineModel\s*\(/.test(source),
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
  plugins: [componentDefs, envSelector, scrollLayout, skeleton],
};
