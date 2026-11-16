<!--
 - TencentBlueKing is pleased to support the open source community by making
 - 蓝鲸智云 - 服务治理 (BlueKing Service Governance) available.
 - Copyright (C) Tencent. All rights reserved.
 - Licensed under the MIT License (the "License"); you may not use this file except
 - in compliance with the License. You may obtain a copy of the License at
 -
 -  http://opensource.org/licenses/MIT
 -
 - Unless required by applicable law or agreed to in writing, software distributed
 - under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 - either express or implied. See the License for the specific language governing permissions and
 - limitations under the License.
 -
 - We undertake not to change the open source license (MIT license) applicable
 - to the current version of the project delivered to anyone in the future.
-->

<script lang="ts">
  export interface ISortOption<T extends string = string> {
    ascName: string;
    descName: string;
    label: string;
    value: T;
  }

  export type SortOrder = 'asc' | 'desc';
</script>
<script lang="ts" setup generic="T extends string">
  import { computed, nextTick, ref } from 'vue';

  import { Dropdown } from 'bkui-vue';

  interface IProps {
    modelValue: T;
    options: ISortOption<T>[];
    order: SortOrder;
  }

  const props = defineProps<IProps>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: T): void;
    (e: 'update:order', value: SortOrder): void;
  }>();

  const isOpen = ref(false);
  const sortDropdownRef = ref();

  const currentOption = computed(
    () => props.options.find(option => option.value === props.modelValue) ?? props.options[0],
  );

  const currentOrderLabel = computed(() =>
    currentOption.value ? (props.order === 'asc' ? currentOption.value.ascName : currentOption.value.descName) : '',
  );

  // 非当前字段默认展示升序方向
  function getFieldOrder(field: T): SortOrder {
    return props.modelValue === field ? props.order : 'asc';
  }

  function getFieldOrderLabel(option: ISortOption<T>) {
    return getFieldOrder(option.value) === 'asc' ? option.ascName : option.descName;
  }

  // 点击菜单项：切换字段（当前字段保留其方向，其余字段重置为升序）并收起面板
  function handleItemClick(field: T) {
    selectField(field, getFieldOrder(field), true);
  }

  // 选中字段；hide 为 true 时收起下拉面板
  function selectField(field: T, order: SortOrder, hide = false) {
    emit('update:modelValue', field);
    emit('update:order', order);
    if (hide) {
      nextTick(() => {
        sortDropdownRef.value?.popoverRef?.hide?.();
      });
    }
  }

  // 点击方向标签：当前字段为升序时切换为降序，否则切换为升序；不收起面板
  function toggleOrder(field: T) {
    const next: SortOrder = props.modelValue === field && props.order === 'asc' ? 'desc' : 'asc';
    selectField(field, next);
  }
</script>

<template>
  <Dropdown
    ref="sortDropdownRef"
    placement="bottom-end"
    :popover-options="{ extCls: 'bkms-sort-popover' }"
    trigger="click"
    @hide="isOpen = false"
    @show="isOpen = true"
  >
    <template #default>
      <section
        class="bkms-sort-trigger inline-flex items-center justify-between h-[32px] min-w-[160px] pl-[12px] pr-[8px] bg-[#fff] border border-solid border-[#C1CDE5] rounded-[6px] text-[12px] text-[#4A5973] whitespace-nowrap cursor-pointer hover:border-[#8F9FBD]"
        :class="{ 'is-open': isOpen }"
      >
        <span class="inline-flex items-center min-w-0">
          <span class="mr-[8px]">{{ currentOption?.label }}</span>
          <span
            class="bkms-sort-tag bkms-sort-trigger-tag"
            @click.stop="toggleOrder(modelValue)"
          >
            <svg
              class="bkms-sort-arrow"
              :class="{ 'is-desc': order === 'desc' }"
              viewBox="0 0 1024 1024"
            >
              <path
                d="M144 512l70.4 70.4 214.4 214.4 70.4-72L336 561.6h544v-99.2H336l163.2-163.2-70.4-72-214.4 214.4z"
              />
            </svg>
            <span>{{ currentOrderLabel }}</span>
          </span>
        </span>
        <svg
          aria-hidden="true"
          class="bkms-sort-caret text-[#8F9FBD] transition-transform duration-200"
          :class="{ 'rotate-180': !isOpen }"
          viewBox="0 0 12 12"
        >
          <path
            d="M2.25 7.75 6 4.25 9.75 7.75"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
          />
        </svg>
      </section>
    </template>
    <template #content>
      <Dropdown.DropdownMenu
        class="bkms-sort-menu"
        ext-cls="bkms-sort-menu"
      >
        <Dropdown.DropdownItem
          v-for="item in options"
          :key="item.value"
          class="bkms-sort-item"
          :class="{ 'is-active': modelValue === item.value }"
          @click="handleItemClick(item.value)"
        >
          <span class="flex-1 leading-[20px]">{{ item.label }}</span>
          <span
            class="bkms-sort-tag"
            :class="{ 'is-active': modelValue === item.value }"
            @click.stop="toggleOrder(item.value)"
          >
            <svg
              class="bkms-sort-arrow is-menu"
              :class="{ 'is-desc': getFieldOrder(item.value) === 'desc' }"
              viewBox="0 0 1024 1024"
            >
              <path
                d="M144 512l70.4 70.4 214.4 214.4 70.4-72L336 561.6h544v-99.2H336l163.2-163.2-70.4-72-214.4 214.4z"
              />
            </svg>
            <span class="leading-[16px]">{{ getFieldOrderLabel(item) }}</span>
          </span>
        </Dropdown.DropdownItem>
      </Dropdown.DropdownMenu>
    </template>
  </Dropdown>
</template>

<style scoped>
  .bkms-sort-trigger.is-open {
    border-color: #3b6ef5;
  }

  .bkms-sort-tag {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    height: 20px;
    padding: 2px 8px;
    font-size: 10px;
    color: #4a5973;
    cursor: pointer;
    background: #f7f9fd;
    border: 1px solid #e4e9f2;
    border-radius: 6px;
  }

  .bkms-sort-tag:hover {
    background: #e4e9f2;
  }

  .bkms-sort-trigger-tag {
    padding: 0 6px;
    margin-right: 4px;
    color: #4a5973;
    background: #e9edf5;
    border-color: transparent;
  }

  .bkms-sort-trigger-tag:hover {
    background: #e4e9f2;
  }

  .bkms-sort-tag.is-active {
    color: #3b6ef5;
    background: #e5edff;
    border-color: transparent;
  }

  .bkms-sort-tag.is-active:hover {
    background: #99b9ff;
  }

  .bkms-sort-caret {
    flex-shrink: 0;
    width: 12px;
    height: 12px;
  }

  .bkms-sort-arrow {
    width: 12px;
    height: 12px;
    margin-right: 2px;
    fill: #8f9fbd;
    transform: rotate(90deg);
  }

  .bkms-sort-arrow.is-menu {
    width: 10px;
    height: 10px;
  }

  .bkms-sort-arrow.is-desc {
    transform: rotate(-90deg);
  }

  .bkms-sort-tag.is-active .bkms-sort-arrow {
    fill: #3b6ef5;
  }
</style>

<style>
  /* 下拉面板 teleport 至 body，需全局样式；通过 extCls（bkms-sort-popover）限定作用范围 */
  .bkms-sort-popover.bk-dropdown-popover .bk-dropdown-menu.bkms-sort-menu {
    min-width: 230px;
    padding: 4px 0;
    background: #fff;
    border-color: #e4e9f2;
    border-radius: 6px;
    box-shadow: 0 2px 4px #1919290d;
  }

  .bkms-sort-popover .bkms-sort-item.bk-dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: auto;
    min-height: 32px;
    padding: 6px 8px;
    font-size: 12px;
    line-height: 20px;
    color: #8f9fbd;
    background: transparent;
  }

  .bkms-sort-popover .bkms-sort-item.bk-dropdown-item:hover {
    color: #4a5973;
    background: transparent;
  }

  .bkms-sort-popover .bkms-sort-item.bk-dropdown-item.is-active,
  .bkms-sort-popover .bkms-sort-item.bk-dropdown-item.is-active:hover {
    color: #3b6ef5;
    background: #f0f4ff;
  }
</style>
