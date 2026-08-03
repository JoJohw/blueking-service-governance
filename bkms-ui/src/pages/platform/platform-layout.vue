<template>
  <CustomNavigation
    v-model:active-key="activeKey"
    :list="navigationList"
    :need-title="false"
  >
    <RouterView :key="routerViewKey"></RouterView>
  </CustomNavigation>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';

  import { useRoute, useRouter } from 'vue-router';
  import { getPlatformMenuList } from '~/composables/use-router-menu';

  import type { NavigationItem } from '~/config/navigation/types';

  const route = useRoute();
  const router = useRouter();

  const menuList = ref<NavigationItem[]>([]);
  const navigationList = computed(() => {
    if (route.name !== 'platformWorkspaceDetail') {
      return menuList.value;
    }

    return menuList.value.map(item => {
      if ('children' in item || item.key !== 'workspace') {
        return item;
      }

      return {
        ...item,
        meta: {
          ...item.meta,
          layout: 'empty' as const,
        },
      };
    });
  });

  const activeKey = computed({
    get() {
      if (route.name === 'platformWorkspaceDetail') return 'workspace';

      const { menuName } = route.params;
      return (Array.isArray(menuName) ? menuName[0] : menuName) || 'workspace';
    },
    set(key: string) {
      if (key === activeKey.value && route.name === 'platformItem') return;

      router.push({
        name: 'platformItem',
        params: {
          menuName: key,
        },
      });
    },
  });

  const routerViewKey = computed(() => {
    const { menuName, name, space, workspaceID } = route.params;
    return `${String(route.name)}-${menuName}-${name}-${space}-${workspaceID}`;
  });

  onMounted(() => {
    menuList.value = getPlatformMenuList();
  });
</script>
