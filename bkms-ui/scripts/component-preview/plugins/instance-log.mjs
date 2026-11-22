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
 * InstanceLog 预览插件：日志面板的 tab（modules）和日志行（logs）都由父组件传入，
 * 通用占位只会生成一条「占位文本 + value: 1」，看不出模块切换和日志排版。
 * 这里按业务实际给「实时日志 / 最近一次重启日志」两个模块，再加一段带级别的启动日志。
 */
export default {
  name: 'instance-log',

  propOverrides: {
    'pages/application/detail/deploy/instance-list/components/instance-log': {
      title: '实例日志',
      modules: [
        { text: '实时日志', value: 'realtime', useDefaultContent: true },
        { text: '最近一次重启日志', value: 'recentRestartLog', useDefaultContent: true },
      ],
      logs: [
        { timestamp: '2026-11-22 10:12:03.101', content: '[INFO] server starting, pid=21073, port=18601' },
        { timestamp: '2026-11-22 10:12:03.257', content: '[INFO] loading config /home/bkms/conf/app.yaml' },
        { timestamp: '2026-11-22 10:12:03.312', content: '[INFO] connect to mysql://mysql.service.consul:3306/bkms ok, cost 41ms' },
        { timestamp: '2026-11-22 10:12:03.408', content: '[INFO] register service to polaris, namespace=Production, token=***' },
        { timestamp: '2026-11-22 10:12:03.466', content: '[WARN] goroutine pool size not configured, fallback to default 2000' },
        { timestamp: '2026-11-22 10:12:04.025', content: '[INFO] admin command handler registered, path=/admin/cmd' },
        { timestamp: '2026-11-22 10:12:04.118', content: '[INFO] server started, listening on 0.0.0.0:18601' },
        { timestamp: '2026-11-22 10:15:37.902', content: '[ERROR] health check failed: upstream timeout after 3s' },
        { timestamp: '2026-11-22 10:15:38.011', content: '[INFO] health check recovered' },
      ],
    },
  },
};
