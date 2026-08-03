<template>
  <CustomNavigation
    v-model:active-key="activeKey"
    :list="menuList"
    :need-title="false"
  >
    <RouterView :key="routerViewKey"></RouterView>
  </CustomNavigation>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue';

  import { useRouter } from 'vue-router';
  import { getBasicMenuList } from '~/composables/use-router-menu';
  import { NavigationItem } from '~/config/navigation/types';

  const router = useRouter();

  const menuList = ref<NavigationItem[]>([]);
  const activeKey = ref<string>(
    (Array.isArray(router.currentRoute.value.params.menuName)
      ? router.currentRoute.value.params.menuName[0]
      : router.currentRoute.value.params.menuName) || 'info',
  );

  const routerViewKey = computed(() => {
    const { menuName, name, space } = router.currentRoute.value.params;
    return `${menuName}-${name}-${space}`;
  });

  watch(activeKey, key => {
    router.push({
      name: 'basicItem',
      params: {
        menuName: key as string,
      },
    });
  });

  onMounted(() => {
    menuList.value = getBasicMenuList();
  });
</script>
