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
    class="w-full h-full border-none"
    :src="frameHref"
    title="开发工具"
  />
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted } from 'vue';

  import { useRoute, useRouter } from 'vue-router';

  const route = useRoute();
  const router = useRouter();
  const frameHref = router.resolve({ name: 'designerFrame', query: { ...route.query } }).href;

  function onPaletteQuery(event: MessageEvent): void {
    if (event.origin !== window.location.origin || event.data?.type !== 'palette-query-sync') return;
    const query = { ...route.query };
    if (typeof event.data.view === 'string') query.view = event.data.view;
    else delete query.view;
    if (typeof event.data.focus === 'string') query.focus = event.data.focus;
    else delete query.focus;
    if (typeof event.data.component === 'string') query.component = event.data.component;
    else delete query.component;
    router.replace({ query });
  }

  onMounted(() => window.addEventListener('message', onPaletteQuery));
  onBeforeUnmount(() => window.removeEventListener('message', onPaletteQuery));
</script>
