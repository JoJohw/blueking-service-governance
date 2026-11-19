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

<template>
  <div
    class="token-card-wrap"
    :class="{ 'is-semantic': variant === 'semantic' }"
  >
    <div
      class="token-card"
      :class="{ 'token-card-semantic': variant === 'semantic' }"
      role="button"
      tabindex="0"
      :title="`点击复制 ${displayValue}`"
      @click="copyValue"
      @keydown.enter.prevent="copyValue"
      @keydown.space.prevent="copyValue"
    >
      <slot />
      <code class="token-card-name">{{ token.name }}</code>
      <slot name="meta" />
    </div>
    <button
      class="token-card-var"
      title="复制 CSS 引用"
      type="button"
      @click="copyVar"
    >
      var()
    </button>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  import { type Token, resolved } from '../util/tokens';

  const props = defineProps<{ token: Token; variant?: 'ramp' | 'semantic' }>();
  const emit = defineEmits<{ copy: [text: string] }>();

  const displayValue = computed(() => resolved(props.token.value));

  function copyValue(): void {
    emit('copy', displayValue.value);
  }

  function copyVar(): void {
    emit('copy', `var(${props.token.name})`);
  }
</script>

<style scoped>
  .token-card-wrap {
    position: relative;
    display: flex;
    width: 240px;
  }

  .token-card-wrap.is-semantic {
    width: 360px;
  }

  .token-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-sizing: border-box;
    width: 100%;
    padding: 14px;
    color: var(--pal-text-body);
    text-align: left;
    cursor: pointer;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 4px;
  }

  .token-card-wrap:hover .token-card {
    border-color: var(--pal-line-strong);
  }

  .token-card-semantic {
    gap: 14px;
    padding: 24px;
    border-radius: 6px;
  }

  .token-card-name {
    font-size: 14px;
    color: var(--pal-text-title);
  }

  .token-card-semantic .token-card-name {
    font-size: 18px;
  }

  /* 次级操作独立于卡片，避免嵌在 role=button 里被吞掉角色 */
  .token-card-var {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 7px 14px;
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 14px;
    line-height: 1;
    color: var(--pal-text-body);
    cursor: pointer;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .token-card-var:hover {
    color: var(--pal-brand);
    border-color: var(--pal-brand);
  }

  .token-card-wrap:hover .token-card-var {
    opacity: 1;
  }

  .token-card-wrap:focus-within .token-card-var {
    opacity: 1;
  }

  /* 无 hover 的触屏设备上常显，否则入口不可发现 */
  @media (hover: none) {
    .token-card-var {
      opacity: 1;
    }
  }
</style>
