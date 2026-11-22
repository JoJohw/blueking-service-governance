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
  <Palette>
    <template #component-preview>
      <ComponentPreview />
    </template>
  </Palette>
</template>

<script setup lang="ts">
  import { onBeforeUnmount } from 'vue';

  import { useRouter } from 'vue-router';

  import Palette from '../../../dev/palette/src/App.vue';
  import { isFrameRoute } from './preview/designer-route';
  import ComponentPreview from './preview/index.vue';

  // frame 文档没有真实 user、启动期 store 未初始化且请求仍打桩，不能在本页跳业务路由。
  // 守卫必须挂在 frame 路由组件（本组件）而非 preview/index.vue：后者只在 viewMode === 'component'
  // 时才经 slot 渲染，外壳带 ?view=color 等进入时它根本不挂载，守卫会漏注册。
  // 本组件覆盖 frame 全生命周期（无论当前是 color / radius / viz / component 视图），随卸载移除。
  const router = useRouter();
  const removeFrameGuard = router.beforeEach(to => isFrameRoute(to.name));
  onBeforeUnmount(() => removeFrameGuard());
</script>
