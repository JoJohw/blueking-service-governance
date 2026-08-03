/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台 (BlueKing PaaS):
 *
 * ---------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
import { createApp } from 'vue';

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
import { registerMonitorChartApi } from '~/pages/application/detail/deploy/monitor-chart-bridge.js';
import { useUserStore } from '~/stores/user';

import App from './App.vue';
import '~/fonts/iconcool';

import '@blueking/monitor-vue3-components/index.css';

// 包内 DateRange / dayjs.tz 依赖 window.timezone（蓝鲸运行环境通常已设置）；
// 本应用未设置，这里兜底为本地 IANA 时区，避免图表刷新时因 timezone 解析出错卡死。
const w = window as unknown as Record<string, string>;
if (!w.timezone) w.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

import type { UserModule } from './types.ts';

import './styles/main.css';
import '@blueking/table/vue3/vue3.css';
import '@unocss/reset/tailwind.css';
import 'uno.css';

getUser({}, { needRes: true }).then(res => {
  const app = createApp(App);
  // 安装modules下面所有模块
  Object.values(import.meta.glob<{ install: UserModule }>('./modules/*.ts', { eager: true })).forEach(i => {
    i.install?.({ app });
  });
  registerMonitorChartApi(app);
  app.mount('#app');
  useUserStore().setUserInfo(res);
});

console.log(
  `%c${BK_BKMS_WELCOME} \n %c版本信息%c${BK_BKMS_VERSION}%c>> ${new Date().toString().slice(0, 16)}<<`,
  'color: #2DCB56',
  'padding: 2px 5px; background: #ea3636; color: #fff; border-radius: 3px 0 0 3px;',
  'padding: 2px 5px; background: #42c02e; color: #fff; border-radius: 0 3px 3px 0; font-weight: bold;',
  'background-color: #3A84FF; color: #fff; padding: 2px 5px; border-radius: 3px; font-weight: bold;margin-left: 16px;',
);
