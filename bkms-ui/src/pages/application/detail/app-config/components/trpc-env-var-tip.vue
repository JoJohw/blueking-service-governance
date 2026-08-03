<template>
  <!-- trpc 环境变量提示 -->
  <Alert
    closable
    theme="info"
  >
    <div class="flex flex-col text-[12px]">
      <i18n-t
        keypath="推荐用法：点击复制获取 {0}，由 tRPC 框架运行时解析；平台不会将环境变量值渲染进配置文件。"
        tag="div"
      >
        <span class="mx-[4px] font-bold text-[#313238]">${Key}</span>
      </i18n-t>
      <i18n-t
        keypath="特殊场景：若需平台在下发配置前完成变量渲染，可通过复制按钮旁的下拉菜单获取 {0}"
        tag="div"
      >
        <span
          class="mx-[4px] font-bold text-[#313238]"
          v-text="'${{ env.Key }}'"
        ></span>
      </i18n-t>
    </div>
  </Alert>
</template>

<script setup lang="ts">
  import { Alert } from 'bkui-vue';
</script>
