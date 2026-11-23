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
  <div class="min-h-screen bkms-bg-page px-[24px] py-[24px]">
    <h1 class="mb-[8px] text-[20px] leading-[28px] font-medium bkms-text-title">Exception 颜色预览</h1>
    <p class="mb-[24px] text-[14px] leading-[22px] bkms-text-body">
      全部类型插图 Soft 3D Brand；标题 Text/1，描述 Text/2，按钮 Brand/2
    </p>
    <div class="grid grid-cols-2 gap-[24px] xl:grid-cols-4">
      <div
        v-for="item in variants"
        :key="`${item.type}-${item.scene}`"
        class="rounded-bkms-card bkms-bg-card px-[16px] py-[20px]"
      >
        <div class="mb-[12px] text-[12px] leading-[20px] bkms-text-secondary">
          {{ item.label }} · {{ item.scene }}
        </div>
        <Exception
          class="!w-full"
          :description="item.description"
          :scene="item.scene"
          :title="item.title"
          :type="item.type"
        >
          <Button
            v-if="item.showAction"
            theme="primary"
          >
            {{ item.actionText }}
          </Button>
        </Exception>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { Button, Exception } from 'bkui-vue';

  const variants = [
    {
      type: 'empty',
      scene: 'page',
      label: '暂无数据',
      title: '暂无可用的环境',
      description: '环境必须先配置集群资源后才能部署应用',
      showAction: true,
      actionText: '前往配置',
    },
    {
      type: 'empty',
      scene: 'part',
      label: '暂无数据',
      title: '暂无数据',
      description: '局部空状态',
      showAction: false,
      actionText: '',
    },
    {
      type: 'search-empty',
      scene: 'page',
      label: '搜索为空',
      title: '搜索结果为空',
      description: '可以尝试调整关键词或清空筛选条件',
      showAction: true,
      actionText: '清空筛选',
    },
    {
      type: '404',
      scene: 'page',
      label: '404',
      title: '页面不存在',
      description: '你访问的页面走丢了',
      showAction: true,
      actionText: '返回首页',
    },
    {
      type: '403',
      scene: 'page',
      label: '403',
      title: '暂无权限',
      description: '你没有访问该资源的权限',
      showAction: true,
      actionText: '申请权限',
    },
    {
      type: '500',
      scene: 'page',
      label: '500',
      title: '服务异常',
      description: '服务开小差了，请稍后再试',
      showAction: true,
      actionText: '刷新',
    },
    {
      type: 'building',
      scene: 'page',
      label: '建设中',
      title: '功能建设中',
      description: '该功能正在建设中，敬请期待',
      showAction: false,
      actionText: '',
    },
    {
      type: 'login',
      scene: 'page',
      label: '未登录',
      title: '尚未登录',
      description: '请先登录后再访问',
      showAction: true,
      actionText: '去登录',
    },
  ] as const;
</script>
