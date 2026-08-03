import { createI18n } from 'vue-i18n';

/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台 (BlueKing PaaS):
 *
 * ---------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
import type { Locale } from 'vue-i18n';
import type { UserModule } from '~/types.ts';

const i18n = createI18n({
  legacy: false,
  locale: '',
  messages: {},
});

// locales目录下语言map
const localesMap = Object.fromEntries(
  Object.entries(import.meta.glob('../../locales/*.yml')).map(([path, loadLocale]) => [
    path.match(/([\w-]*)\.yml$/)?.[1],
    loadLocale,
  ]),
) as Record<Locale, () => Promise<{ default: Record<string, string> }>>;

const availableLocales = Object.keys(localesMap);
// 已加载语言
const loadedLanguages: string[] = [];

// 异步加载语言
async function loadLanguageAsync(lang: string): Promise<Locale> {
  if (i18n.global.locale.value === lang) return setI18nLanguage(lang);

  if (loadedLanguages.includes(lang)) return setI18nLanguage(lang);

  const messages = await localesMap[lang]();
  i18n.global.setLocaleMessage(lang, messages.default);
  loadedLanguages.push(lang);
  return setI18nLanguage(lang);
}

// 设置语言
function setI18nLanguage(lang: Locale) {
  i18n.global.locale.value = lang;
  if (typeof document !== 'undefined') document.querySelector('html')?.setAttribute('lang', lang);
  return lang;
}

// Setup i18n
const install: UserModule = async ({ app }) => {
  app.use(i18n);
  // 加载默认语言
  await loadLanguageAsync('zh-CN');
};
window.i18n = i18n.global;
export { availableLocales, i18n, install, loadLanguageAsync };
