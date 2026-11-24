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
 - either express or implied. See the License for the specific language governing permissions and
 - limitations under the License.
 -
 - We undertake not to change the open source license (MIT license) applicable
 - to the current version of the project delivered to anyone in the future.
-->

<template>
  <Exception
    v-bind="$attrs"
    :type="type"
  >
    <template #type>
      <slot name="type">
        <img
          alt=""
          :class="imgClassList"
          :src="imgSrc"
        />
      </slot>
    </template>
    <template
      v-if="$slots.title"
      #title
    >
      <slot name="title"></slot>
    </template>
    <template
      v-if="$slots.description"
      #description
    >
      <slot name="description"></slot>
    </template>
    <template
      v-if="$slots.default"
      #default
    >
      <slot></slot>
    </template>
  </Exception>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  import { Exception } from 'bkui-vue';
  import { ExceptionEnum } from 'bkui-vue/lib/exception';

  defineOptions({ inheritAttrs: false });

  type ExceptionType = `${ExceptionEnum}`;

  interface IProps {
    /** 整体替换内置插图的尺寸类（非追加），不传则铺满容器 */
    imgClass?: string;
    type?: ExceptionType;
  }

  /** Soft 3D Brand 插图，画布统一 440×200，与 empty.svg 同规格 */
  const EXCEPTION_IMG_MAP: Record<ExceptionType, string> = {
    [ExceptionEnum.CODE_403]: '/403.svg',
    [ExceptionEnum.CODE_404]: '/404.svg',
    [ExceptionEnum.CODE_500]: '/500.svg',
    [ExceptionEnum.BUILDING]: '/building.svg',
    [ExceptionEnum.EMPTY]: '/empty.svg',
    [ExceptionEnum.LOGIN]: '/login.svg',
    [ExceptionEnum.SEARCH]: '/search-empty.svg',
  };

  const props = withDefaults(defineProps<IProps>(), {
    type: ExceptionEnum.EMPTY,
    imgClass: '',
  });

  const imgSrc = computed(() => EXCEPTION_IMG_MAP[props.type] ?? EXCEPTION_IMG_MAP[ExceptionEnum.EMPTY]);

  const imgClassList = computed(() => ['object-contain', props.imgClass || 'h-full w-full']);
</script>
