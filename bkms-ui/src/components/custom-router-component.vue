<template>
  <component
    :is="getComponent()"
    :key="componentKey"
  />
</template>

<script lang="ts" setup>
  import { computed } from 'vue';

  import { useRouter } from 'vue-router';
  import { getMenuListByMenuId, MenuIdType } from '~/composables/use-router-menu';

  import type { AppNavigationType } from '~/config/navigation/app';
  import type { BaseNavigationItem } from '~/config/navigation/types';

  const router = useRouter();
  const type = computed(() => (router.currentRoute.value.params.type || '') as AppNavigationType);
  const menuName = computed(() => (router.currentRoute.value.params.menuName || '') as string);
  const componentKey = computed(() => `${type.value}-${menuName.value}`);

  // 根据type和menuName获取组件
  function getComponent() {
    const menuId = router.currentRoute.value.meta.menuId as MenuIdType;
    const menuList = getMenuListByMenuId(menuId, type.value);
    // 打平导航菜单，方便查找组件
    const formatList = menuList.reduce((acc, cur) => {
      if ('children' in cur) {
        acc.push(...cur.children);
      } else {
        acc.push(cur);
      }
      return acc;
    }, [] as BaseNavigationItem[]);
    const menu = formatList.find(item => item.key === menuName.value);
    return menu?.component || null;
  }
</script>
