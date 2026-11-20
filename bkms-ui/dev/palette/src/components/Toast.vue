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
  <Transition name="toast">
    <div
      v-if="text"
      class="toast"
      role="status"
    >
      <span class="toast-icon">✓</span>
      <span>
        已复制 <code>{{ text }}</code>
      </span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
  defineProps<{ text: string }>();
</script>

<style scoped>
  .toast {
    position: fixed;
    top: 24px;
    right: 36px;
    z-index: 60;
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 280px;
    max-width: 80vw;
    padding: 10px 18px;
    font-size: 14px;
    color: var(--pal-text-title);
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 6px;
    box-shadow: 0 4px 16px var(--pal-shadow-popover);
  }

  .toast-icon {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    font-size: 13px;
    color: var(--pal-text-inverse);
    background: var(--pal-success);
    border-radius: 50%;
  }

  .toast code {
    color: var(--pal-brand);
  }

  .toast-enter-active,
  .toast-leave-active {
    transition:
      opacity 0.2s ease,
      margin-top 0.2s ease;
  }

  .toast-enter-from,
  .toast-leave-to {
    margin-top: -12px;
    opacity: 0;
  }
</style>
