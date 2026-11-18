/*
 * TencentBlueKing is pleased to support the open source community by making
 * 蓝鲸智云 - 服务治理 (BlueKing Service Governance) available.
 * Copyright (C) Tencent. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *  http://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

/**
 * 多主题切换
 *
 * 约定：主题只通过 <html data-theme="<name>"> 挂载，样式侧在 src/styles/theme/themes/ 下
 * 按 [data-theme] 覆盖色阶，因此这里不碰任何具体色值，只负责属性与持久化。
 * 主题清单与 themes/index.css 的 @import 保持一致。
 */

import { computed, ref } from 'vue';

export type BkmsTheme = 'dark' | 'light';
/** 与 index.html 首帧脚本共用同一 key：auto 跟随系统，dark/light 为用户显式选择 */
type ColorSchemeSetting = 'auto' | BkmsTheme;

const STORAGE_KEY = 'vueuse-color-scheme';

/** 系统是否偏好深色 */
export function prefersDark() {
  return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

/** 解析生效主题：显式 dark/light 优先，auto 跟随系统偏好 */
export function resolveTheme(setting: ColorSchemeSetting = readSetting()): BkmsTheme {
  if (setting === 'dark' || setting === 'light') return setting;
  return prefersDark() ? 'dark' : 'light';
}

function readSetting(): ColorSchemeSetting {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

/** 模块级单例：多处 useTheme() 共享同一份当前主题 */
const currentTheme = ref<BkmsTheme>('light');

/** 应用主题：写 data-theme 驱动 themes/ 下的色阶覆盖，并同步 .dark class（沿用原有约定） */
export function applyTheme(theme: BkmsTheme) {
  currentTheme.value = theme;
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/** 启动期调用：按「本地显式选择 > 系统偏好」解析后应用（main.ts 在 app.mount 之前调用） */
export function initTheme() {
  applyTheme(resolveTheme());
}

/** 设置并持久化主题：写入显式值，此后不再跟随系统 */
export function setTheme(theme: BkmsTheme) {
  applyTheme(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // 隐私模式下 localStorage 不可写，主题仍在本次会话生效
  }
}

export function useTheme() {
  const isDark = computed(() => currentTheme.value === 'dark');

  function toggleTheme() {
    setTheme(isDark.value ? 'light' : 'dark');
  }

  return {
    theme: computed(() => currentTheme.value),
    isDark,
    setTheme,
    toggleTheme,
  };
}
