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
  <section
    :id="id"
    class="section"
    :class="{ 'is-focus': focus }"
  >
    <header class="section-header">
      <div class="section-heading">
        <h2 class="section-title">
          {{ title }} <span class="section-count">{{ count }}</span>
        </h2>
        <p
          v-if="note"
          class="section-note"
        >
          {{ note }}
        </p>
      </div>
      <div
        v-if="$slots.tools"
        class="section-tools"
      >
        <slot name="tools" />
      </div>
    </header>
    <div class="section-content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
  defineProps<{ count: number; focus?: boolean; id: string; note?: string; title: string }>();
</script>

<style scoped>
  .section {
    box-sizing: border-box;
    padding: 14px 20px 22px;
    margin: 0 -20px;
    scroll-margin-top: 76px;
    border-radius: 6px;
    transition: background 0.2s ease;
  }

  .section:not(.is-focus):hover {
    background: var(--pal-bg-hover);
  }

  .section-header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .section.is-focus .section-header {
    position: sticky;
    top: 68px;
    z-index: 2;
    padding: 12px 0;
    margin-top: -14px;
    background: var(--pal-bg-card);
  }

  .section-heading {
    min-width: 0;
  }

  .section-title {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    color: var(--pal-text-title);
  }

  .section-count {
    display: inline-block;
    padding: 1px 9px;
    margin-left: 8px;
    font-size: 13px;
    font-weight: 600;
    vertical-align: 2px;
    color: var(--pal-brand);
    background: var(--pal-bg-brand-soft);
    border-radius: 10px;
  }

  .section-note {
    margin: 6px 0 0;
    color: var(--pal-text-body);
  }

  .section-tools {
    flex: none;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .section.is-focus .section-tools,
  .section:not(.is-focus):hover .section-tools {
    opacity: 1;
  }

  .section-content {
    min-width: 0;
  }
</style>
