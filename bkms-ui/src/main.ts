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

import { createApp } from 'vue';

import BkUserDisplayName from '@blueking/bk-user-display-name';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TitleComponent, ToolboxComponent, TooltipComponent } from 'echarts/components';
// @blueking/monitor-vue3-components 内部通过 echarts/core 的 init() 初始化图表，
// 但未注册任何 Renderer / Component，直接调用 init/setOption 会抛：
//   "Renderer 'undefined' is not imported" 或 "Component xxx is used but not imported"
// 此处全局注册一次即可，因为包与项目共享同一 echarts 实例。
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([
  CanvasRenderer,
  GridComponent,
  LegendComponent,
  LineChart,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
]);

import { getUser } from '~/api/modules/user';
import { getUserDisplayConfig } from '~/common/bk-user-api';
import { initTheme } from '~/composables/use-theme';
import { scopeIconSpriteIds } from '~/fonts/icon-sprite';
import { registerMonitorChartApi } from '~/pages/application/detail/deploy/monitor-chart-bridge.js';
import { isDesignerFrameLocation } from '~/pages/designer/preview/designer-route';
import { useFrontendFeaturesStore } from '~/stores/frontend-features';
import { useUserStore } from '~/stores/user';

import App from './App.vue';
import '~/fonts/iconcool';

import '@blueking/monitor-vue3-components/index.css';

// 包内 DateRange / dayjs.tz 依赖 window.timezone（蓝鲸运行环境通常已设置）；
// 本应用未设置，这里兜底为本地 IANA 时区，避免图表刷新时因 timezone 解析出错卡死。
const w = window as unknown as Record<string, string>;
if (!w.timezone) w.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// 主题覆写作用域：src/styles/theme/patches 的选择器统一以 body.bkms-themed 为前缀；
// 挂 body 而非 app 根，teleport 到 body 的弹层（Modal/下拉/Message）天然在作用域内
document.body.classList.add('bkms-themed');

// 多主题：主题名挂到 html[data-theme]，具体色值在 src/styles/theme/themes/ 覆盖色阶。
// index.html 的首帧脚本已按 localStorage 预置同名属性，此处只做一次兜底同步。
initTheme();

// iconcool sprite 里带 Figma 直出的裸 id（a/b/c/d），会顶掉页面内 svg 的 url(#a)，导致渐变类图标
// 渲染空白（coffee.svg 即此原因）；这里把 sprite 内部 id 收敛到私有命名空间，详见 icon-sprite.ts。
if (!scopeIconSpriteIds()) {
  document.addEventListener('DOMContentLoaded', () => scopeIconSpriteIds(), { once: true });
}

import type { UserModule } from './types.ts';

import './styles/main.css';
import '@blueking/table/vue3/vue3.css';
import '@unocss/reset/tailwind.css';
import 'uno.css';
// theme/index.css 整包（令牌 + generated + manual）只定义 --bkms-* 与选择器级覆写；
// 层归属由 scripts/postcss-layer-css.mjs 决定，跨层胜负不看 import 顺序
import '~/styles/theme/index.css';

/**
 * 设计器 iframe 必须在挂载前装好请求打桩：getUser 与 App.vue 的 onBeforeMount 请求
 * 都早于任何子组件 setup，装在预览页组件里已经来不及。动态 import 让 api-mock.json
 * 只在 frame 里下载，业务首屏不含它；frame 也不再调用真实 getUser，避免 401 跳登录。
 */
// mount 成功后置 true，供 catch 判断：mount 之后的同步异常（如 setUserInfo）不应再把已渲染的应用根节点替换掉
let mounted = false;

async function bootstrap() {
  let res: Parameters<ReturnType<typeof useUserStore>['setUserInfo']>[0] | undefined;
  if (isDesignerFrameLocation()) {
    const { isolateRequests } = await import('./pages/designer/preview/request-isolation');
    // 丢弃 isolateRequests 返回的 restore：frame 整个生命周期都需要请求隔离（无真实 user / 后端上下文），
    // 故意不还原，引用计数永不归零，组件内任何「卸载时还原」都不会真正卸掉打桩。
    isolateRequests();
  } else {
    res = await getUser();
  }
  const app = createApp(App);
  // 安装modules下面所有模块
  Object.values(import.meta.glob<{ install: UserModule }>('./modules/*.ts', { eager: true })).forEach(i => {
    i.install?.({ app });
  });
  const userStore = useUserStore();
  if (res) userStore.setUserInfo(res);
  await useFrontendFeaturesStore().load();
  const userDisplayConfig = getUserDisplayConfig(userStore.tenantId);
  if (userDisplayConfig) BkUserDisplayName.configure(userDisplayConfig);
  registerMonitorChartApi(app);
  app.mount('#app');
  mounted = true;
}

void bootstrap().catch((error: unknown) => {
  console.error('[bootstrap] 应用启动失败:', error);
  // 只处理 mount 之前的失败（动态 import / getUser / createApp / mount 抛错）：
  // 此时白屏，把错误落到 #app 保留排查线索；mount 之后的异常不覆盖已渲染的应用根节点，仅记录日志。
  if (mounted) return;
  const root = document.getElementById('app');
  if (root) {
    root.textContent = `应用启动失败：${error instanceof Error ? error.message : String(error)}`;
  }
});

console.log(
  `%c${BK_BKMS_WELCOME} \n %c版本信息%c${BK_BKMS_VERSION}%c>> ${new Date().toString().slice(0, 16)}<<`,
  // eslint-disable-next-line theme/no-hardcoded-color
  'color: #2DCB56',
  // console %c 的样式由 DevTools 渲染，不继承页面 :root 变量，圆角只能保留字面量
  // eslint-disable-next-line theme/no-hardcoded-color, theme/no-hardcoded-radius
  'padding: 2px 5px; background: #ea3636; color: #FFF; border-radius: 3px 0 0 3px;',
  // eslint-disable-next-line theme/no-hardcoded-color, theme/no-hardcoded-radius
  'padding: 2px 5px; background: #42c02e; color: #FFF; border-radius: 0 3px 3px 0; font-weight: bold;',
  // eslint-disable-next-line theme/no-hardcoded-color, theme/no-hardcoded-radius
  'background-color: #3A84FF; color: #FFF; padding: 2px 5px; border-radius: 3px; font-weight: bold;margin-left: 16px;',
);
