<!--
 - TencentBlueKing is pleased to support the open source community by making
 - 蓝鲸智云 - 服务治理 (BlueKing Service Governance) available.
 - Copyright (C) Tencent. All rights reserved.
 - Licensed under the MIT License (the "License"); you may not use this file except
 - in compliance with the License. You may obtain a copy of the License at
 -
 -  http://opensource.org/licenses/MIT
 -
 - Unless required by applicable law or agreed to in writing, software distributed under
 - the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 - either express or implied. See the License for the specific language governing permissions
 - and limitations under the License.
 -
 - We undertake not to change the open source license (MIT license) applicable
 - to the current version of the project delivered to anyone in the future.
-->

<script setup lang="ts">
  defineProps<{ focusId?: null | string }>();
  defineEmits<{ copy: [text: string]; toggleFocus: [id: string] }>();
</script>

<template>
  <slot name="component-preview">
    <div class="component-hint">
      <p>独立预览模式下无法加载组件预览（需要主应用上下文）。</p>
      <p>请在主应用中打开 <code>/#/__designer</code> 使用组件预览。</p>
    </div>
  </slot>
</template>

<style scoped>
  .component-hint {
    color: var(--pal-text-body);
  }

  .component-hint code {
    color: var(--pal-brand);
  }
</style>
