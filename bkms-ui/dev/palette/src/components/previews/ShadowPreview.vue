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
  <div class="shadow-preview">
    <span
      class="shadow-box"
      :style="{ boxShadow: `0 2px 8px 0 ${resolved(token.value)}` }"
    />
  </div>
</template>

<script setup lang="ts">
  import { resolved, type Token } from '../../util/tokens';

  defineProps<{ token: Token }>();
</script>

<style scoped>
  .shadow-preview {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: var(--preview-h, 170px);
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 4px;
  }

  .shadow-box {
    width: 70%;
    height: 100px;
    background: var(--pal-bg-card);
    border-radius: 3px;
  }
</style>
