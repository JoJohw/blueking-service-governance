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
  <TokenPage
    :focus-id="focusId"
    :groups="visibleGroups"
    :is-focus="isFocus"
    variant="semantic"
    @copy="emit('copy', $event)"
    @toggle-focus="emit('toggleFocus', $event)"
  />
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  import { radiusGroups } from '../util/tokens';
  import TokenPage from './TokenPage.vue';

  const props = defineProps<{ focusId: null | string }>();

  const emit = defineEmits<{
    copy: [text: string];
    toggleFocus: [id: string];
  }>();

  const isFocus = computed(() => props.focusId !== null);
  const visibleGroups = computed(() =>
    props.focusId ? radiusGroups.filter(group => group.id === props.focusId) : radiusGroups,
  );
</script>
