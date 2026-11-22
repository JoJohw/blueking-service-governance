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
  <!-- 设计工具 iframe：跳过全局导航与通知条，避免双层 header -->
  <RouterView v-if="isDesignerFrame" />
  <div
    v-else
    class="flex flex-col h-full flex-nowrap"
  >
    <NoticeComponent
      :api-url="bkNoticeApiUrl"
      @show-alert-change="handleShowAlertChange"
    />
    <Navigation
      :class="['flex-1', isNoticeShow ? '!h-[calc(100vh-40px)]' : '']"
      navigation-type="top-bottom"
      :need-menu="false"
    >
      <template #side-header>
        <img
          alt="logo"
          class="mr-[10px] cursor-pointer"
          height="28"
          src="@/assets/logo.png"
          width="28"
          @click="handleGotoHome"
        />
        <span
          class="text-[16px] bkms-text-inverse font-bold cursor-pointer"
          @click="handleGotoHome"
          >{{ t('蓝鲸服务治理') }}</span
        >
        <template v-if="!isGlobalRoute">
          <Divider
            class="h-[14px] !mx-[12px]"
            color="var(--bkms-neutral-2)"
            direction="vertical"
            type="solid"
          />
          <SpaceSelector />
        </template>
      </template>
      <template #header>
        <FlexRow class="w-full text-bkms-navy-4 text-[14px]">
          <template #left>
            <span
              v-if="!isGlobalRoute"
              class="flex items-center text-[14px]"
            >
              <RouterLink
                v-for="item in navList"
                :key="item.name"
                :class="[
                  'bkms-nav-item',
                  {
                    'bkms-active-nav': item.id === route.meta.menuId,
                  },
                ]"
                :to="{ name: item.name, params: item.params }"
              >
                {{ $t(item.title) }}
              </RouterLink>
            </span>
          </template>
          <template #right>
            <bk-popover
              :arrow="false"
              ext-cls="!px-0 !py-[4px]"
              :offset="{
                mainAxis: 14,
                crossAxis: 5,
              }"
              placement="bottom-start"
              theme="light"
              trigger="click"
              @after-hidden="isPopoverShow = false"
              @after-show="isPopoverShow = true"
            >
              <div class="flex items-center cursor-pointer">
                <span class="mr-[5px]">{{ userStore.userInfo.user_id }}</span>
                <AngleDownFill :class="[isPopoverShow ? '' : 'rotate-180']" />
              </div>
              <template #content>
                <ul>
                  <li
                    v-for="userItem in userConfigList"
                    :key="userItem.name"
                    class="bkms-dropdown-item"
                    @click="handleClickLi(userItem)"
                  >
                    {{ userItem.name }}
                  </li>
                </ul>
              </template>
            </bk-popover>
          </template>
        </FlexRow>
      </template>
      <RouterView :key="spaceStore.routeViewKey" />
    </Navigation>
  </div>
  <!-- 权限弹窗 -->
  <ApplyPerm ref="applyPermRef" />
</template>

<script setup lang="ts">
  import { computed, onBeforeMount, ref, watch } from 'vue';

  import NoticeComponent from '@blueking/notice-component';
  import { useHead } from '@vueuse/head';
  import { Divider, Navigation } from 'bkui-vue';
  import { AngleDownFill } from 'bkui-vue/lib/icon';
  import { useI18n } from 'vue-i18n';
  import { useRoute, useRouter } from 'vue-router';
  import ApplyPerm from '~/components/apply-perm.vue';
  import { useEventBus } from '~/composables/use-event-bus';
  import usePlatform from '~/composables/use-platform';
  // import { useTheme } from '~/composables/use-theme';
  import { useUserStore } from '~/stores/user';

  import { getNavList } from './composables/use-menu';
  import SpaceSelector from './pages/home/space-selector.vue';
  import { useSpaceStore } from './stores/space';

  import '@blueking/notice-component/dist/style.css';

  interface IConfig {
    name: string;
    path: string;
    event: () => void;
  }

  const { t } = useI18n();

  // 多主题：顶栏切换入口已移除，切换逻辑暂不启用
  // const { isDark, toggleTheme } = useTheme();

  // 路由信息
  const route = useRoute();
  const router = useRouter();

  // 用户store
  const userStore = useUserStore();
  // 空间相关全局store
  const spaceStore = useSpaceStore();

  // 通知组件apiUrl
  const bkNoticeApiUrl = computed(() => {
    const env = import.meta.env.BK_NODE_ENV === 'production' ? 'prod' : 'stage';
    const template = import.meta.env.BK_API_URL_TMPL || '';
    if (!template) return '';
    return template.includes('{api_name}')
      ? `${template.replace('{api_name}', 'bk-notice')}/${env}/apigw/v1/get_user_announcement?platform=bkms`
      : template;
  });

  const isNoticeShow = ref(false);

  // 蓝鲸平台相关配置hook
  const { platformConfig, getPlatformInfo } = usePlatform();
  const appName = computed(() => platformConfig.i18n.productName);

  // iframe 首次加载时 route.name 尚未 resolve，先按 router history 的同步位置判断，避免全局 header 一闪而过。
  // 用 history.location 而非 window.location.hash：SSR/memory history 下同样可用，语义也跟路由一致。
  const isDesignerFrameLocation = () => /^\/__designer-frame(?:[/?]|$)/.test(router.options.history.location);
  const isDesignerFrame = computed(() => isDesignerFrameLocation() || route?.name === 'designerFrame');
  // 首页、平台管理和设计工具不展示空间选择器及空间导航
  const isGlobalRoute = computed(
    () =>
      route?.name === 'home' ||
      route?.name === 'spaceList' ||
      route?.name === 'designer' ||
      route.meta.menuId === 'PLATFORM',
  );
  // // 用户相关配置列表(等待产品确认)
  const userConfigList = computed<IConfig[]>(() => {
    const list: IConfig[] = [
      {
        name: t('退出登录'),
        path: '',
        event: handleLogout,
      },
    ];
    if (userStore.hasPlatformRole) {
      list.unshift({
        name: t('平台管理'),
        path: '/platform',
        event: handleGotoPlatform,
      });
    }
    return list;
  });

  function handleClickLi(item: IConfig) {
    item.event();
  }
  // 跳转平台管理
  function handleGotoPlatform() {
    spaceStore.updateCurrentSpace('');
    router.push({ name: 'platform' });
  }
  // 退出登录
  function handleLogout() {
    // 注销登录只注销当前登录态，清除bk_token，不做登录弹窗
    window.location.href = `${window.BK_LOGIN_URL}?is_from_logout=1&c_url=${encodeURIComponent(window.location.href)}`;
  }

  // 一级导航列表
  const navList = getNavList();
  // 用户popover弹框
  const isPopoverShow = ref(false);

  // 跳转首页
  function handleGotoHome() {
    spaceStore.updateCurrentSpace('');
    router.push({
      name: 'home',
    });
  }

  // 权限弹窗
  const applyPermRef = ref<InstanceType<typeof ApplyPerm> | null>(null);
  const { on } = useEventBus();
  on('show-apply-perm-modal', data => {
    if (!data) return;
    applyPermRef.value?.show(data);
  });

  function handleShowAlertChange(isShow: boolean) {
    isNoticeShow.value = isShow;
  }

  // 路径上空间切换时更新全局缓存
  watch(
    () => route.params?.space,
    () => {
      spaceStore.updateCurrentSpace(route.params?.space as string);
      if (route.params?.space) {
        spaceStore.refreshRouteViewKey();
      }
    },
  );

  // 设置title
  watch(appName, () => {
    // https://github.com/vueuse/head
    useHead({
      title: appName.value,
      meta: [
        {
          name: 'description',
          content: '',
        },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: () => '/favicon.svg',
        },
      ],
    });
  });

  onBeforeMount(() => {
    // 只有 iframe 跳过启动期请求：frame 的请求已由 main.ts 提前打桩，且无真实 user/角色。
    // 外壳仍渲染完整 header（logo / 用户菜单），必须保留真实请求——onBeforeMount 只在 App
    // 挂载时跑一次，若外壳也跳过，点 logo 或浏览器前进/后退回到业务页后，
    // 平台配置 / 角色 / 工作空间列表就永远不会补发（标题不更新、hasPlatformRole 恒 false）。
    if (isDesignerFrame.value) return;
    spaceStore.handleGetWorkspaceList();
    getPlatformInfo();
    userStore.getRoleInfo();
  });
</script>
<style lang="postcss" scoped>
  :deep(.bk-navigation-title) {
    flex: 0 0 360px;
  }
</style>
