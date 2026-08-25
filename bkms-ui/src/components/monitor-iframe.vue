<!--
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
-->

<template>
  <Loading
    class="w-full h-full"
    :loading="isLoading"
  >
    <iframe
      ref="iframeRef"
      allow="fullscreen"
      allowfullscreen
      frameborder="0"
      height="100%"
      :src="url"
      width="100%"
      @error="isLoading = false"
      @load="handleIframeLoad"
    >
    </iframe>
  </Loading>
</template>
<script lang="ts" setup>
  import { onBeforeUnmount, onMounted, ref } from 'vue';

  import { Loading } from 'bkui-vue';
  import {
    type MonitorIframeRouteChangeMessage,
    type MonitorIframeSetParamsMessage,
    type MonitorIframeSetParamsPayload,
    BK_MONITOR_SOURCE,
    getMonitorOrigin,
    MONITOR_IFRAME_SOURCE,
  } from '~/composables/use-monitor-iframe';

  interface IProps {
    /** iframe URL（由父页面通过 useMonitorIframe().buildIframeUrl() 构建后传入，仅在初始化时计算） */
    url: string;
  }

  defineProps<IProps>();
  const emit = defineEmits<{
    (e: 'route-change', payload: { hash: string; href: string; query: Record<string, unknown> }): void;
  }>();

  const isLoading = ref(true);
  const iframeRef = ref<HTMLIFrameElement>();
  const isIframeReady = ref(false);

  /** 监控平台 origin（postMessage targetOrigin 与 message 校验用），复用 hook 的纯函数避免重复实现 */
  const monitorOrigin = getMonitorOrigin();

  /** iframe 加载完成：标记就绪即可，URL 已携带最新参数，无需 postMessage 补发 */
  function handleIframeLoad() {
    isLoading.value = false;
    isIframeReady.value = true;
  }

  /** 接收监控平台 route-change 消息（子 → 父） */
  function handleWindowMessage(event: MessageEvent) {
    if (event.origin !== monitorOrigin) return;
    const data = event.data as MonitorIframeRouteChangeMessage | undefined;
    if (data?.source !== BK_MONITOR_SOURCE || data.type !== 'route-change') return;
    emit('route-change', {
      href: data.href,
      hash: data.hash,
      query: data.query,
    });
  }

  /** 向监控平台下发 filter-app_name / filter-service_name（父 → 子；set-params 支持双过滤条件），iframe 未就绪时返回 false（发送失败） */
  function sendSetParams(payload: MonitorIframeSetParamsPayload): boolean {
    if (!isIframeReady.value || !monitorOrigin) return false;
    const message: MonitorIframeSetParamsMessage = {
      source: MONITOR_IFRAME_SOURCE,
      type: 'set-params',
      payload,
    };
    iframeRef.value?.contentWindow?.postMessage(message, monitorOrigin);
    return true;
  }

  onMounted(() => {
    window.addEventListener('message', handleWindowMessage);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('message', handleWindowMessage);
  });

  defineExpose({ sendSetParams });
</script>
