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
  <iframe
    ref="frameRef"
    class="w-full h-full border-none"
    :src="frameHref"
    title="开发工具"
    @load="syncHashToFrame"
  />
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

  import { useRoute, useRouter } from 'vue-router';

  const route = useRoute();
  const router = useRouter();
  const frameRef = ref<HTMLIFrameElement | null>(null);
  /** 只在首次挂载时用它加载 iframe，后续 query 变化改为同步 hash（改 src 会整页重载、丢内部状态） */
  const frameHref = router.resolve({ name: 'designerFrame', query: { ...route.query } }).href;

  /**
   * 把父页的 query 同步给 iframe。地址栏直接改 URL（hash 变化不会重新挂载本组件）、
   * 前进后退、以及 iframe 首次加载完成（@load 补调）都会走到这里。
   * iframe 内部自己改 query 时会先把 hash 改好再 postMessage，这里比对 hash 相同就跳过，不会来回打。
   */
  function syncHashToFrame(): void {
    const frame = frameRef.value;
    if (!frame?.contentWindow) return;
    // iframe 还在按 src 加载时（about:blank）写地址会打断加载；@load 之后会再补调一次
    if (frame.contentWindow.location.href === 'about:blank') return;
    const href = router.resolve({ name: 'designerFrame', query: { ...route.query } }).href;
    const nextHash = new URL(href, window.location.href).hash;
    if (frame.contentWindow.location.hash === nextHash) return;
    // 用 replace 而不是赋 hash：这是同步不是导航，赋 hash 会给 iframe 历史栈压入条目，
    // 多轮后 iframe 的后退栈与父页不再对齐，会出现「在 iframe 里退回上一次搜索」。
    // 基地址用 iframe 自己的，避免把父页非 hash 的 query（如 ?tenant=1）复制进去
    const frameUrl = new URL(frame.contentWindow.location.href);
    frameUrl.hash = nextHash;
    frame.contentWindow.location.replace(frameUrl.toString());
  }

  watch(() => route.query, syncHashToFrame);

  function onPaletteQuery(event: MessageEvent): void {
    if (
      event.origin !== window.location.origin ||
      event.source !== frameRef.value?.contentWindow ||
      event.data?.type !== 'palette-query-sync'
    )
      return;
    const query = { ...route.query };
    if (typeof event.data.view === 'string') query.view = event.data.view;
    else delete query.view;
    if (typeof event.data.focus === 'string') query.focus = event.data.focus;
    else delete query.focus;
    if (typeof event.data.component === 'string') query.component = event.data.component;
    else delete query.component;
    if (typeof event.data.search === 'string') query.search = event.data.search;
    else delete query.search;
    router.replace({ query });
  }

  onMounted(() => window.addEventListener('message', onPaletteQuery));
  onBeforeUnmount(() => window.removeEventListener('message', onPaletteQuery));
</script>
