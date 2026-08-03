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
// pina 持久化存储
import { get, has, merge, set } from 'lodash-es';
import { createPinia } from 'pinia';
import { STORAGE_KEY, STORAGE_VERSION } from '~/common/const';

import type { PiniaPluginContext, Store } from 'pinia';
import type { UserModule } from '~/types.ts';

// 本地缓存配置信息
interface Options {
  ids: string[];
  key: string;
  paths: string[];
  storage: Storage;
  version: string;
  assertStorage?: (storage: Storage) => Error | void;
  getState: (key: string, storage: Storage) => any;
  reducer: (state: Store, paths: string[]) => object;
  setState: (key: string, state: object, storage: Storage) => void;
}
// 缓存接口定义
interface Storage {
  clear: () => void;
  getItem: (key: string) => any;
  removeItem: (key: string) => void;
  setItem: (key: string, value: any) => void;
}

// 校验缓存是否可用
function assertStorage(storage: Storage = window.localStorage) {
  try {
    storage.setItem('@@', 1);
    storage.removeItem('@@');
  } catch (err) {
    console.warn('Storage is not available:', err);
  }
}
// 获取缓存数据
function getState(key = '_pina_', storage: Storage = window.localStorage) {
  const value = storage.getItem(key);

  try {
    return value ? JSON.parse(value) : value;
  } catch (err) {}

  return undefined;
}
function installPiniaStorage(opt: Partial<Options> = {}) {
  const options: Options = merge(
    {
      key: '_pina_',
      version: '',
      overwrite: false,
      storage: window.localStorage,
      paths: [],
      ids: [],
      reducer,
      getState,
      setState,
      assertStorage,
    },
    opt,
  );

  assertStorage(options.storage);
  const savedState = options.getState(options.key, options.storage);

  return ({ store }: PiniaPluginContext) => {
    if (!options.ids?.includes(store.$id)) return;
    // 还原localstorage里面的值
    if (typeof savedState === 'object' && savedState !== null) {
      Object.keys(savedState).forEach(key => {
        if (has(store, key)) {
          set(store, key, savedState[key]);
        }
      });
    }

    // store 变化
    store.$subscribe(() => {
      options.setState(options.key, options.reducer(store, options.paths), options.storage);
    });
  };
}
function reducer(state: Store, paths: string[]) {
  return Array.isArray(paths) ? paths.reduce((substate, path) => set(substate, path, get(state, path)), {}) : state;
}

// 设置缓存状态
function setState(key = '_pina_', state: object, storage: Storage) {
  try {
    return storage.setItem(key, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save state to storage:', err);
  }
}

// Setup Pinia
// https://pinia.vuejs.org/
export const install: UserModule = ({ app }) => {
  const pinia = createPinia().use(
    installPiniaStorage({
      key: STORAGE_KEY,
      version: STORAGE_VERSION,
      ids: ['user', 'space', 'deploy-env'],
      paths: ['statusTab', 'lastAppTemplateID', 'currentEnv'],
    }),
  );
  app.use(pinia);
};
