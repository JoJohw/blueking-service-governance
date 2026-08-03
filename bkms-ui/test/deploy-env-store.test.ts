import { createPinia, setActivePinia } from 'pinia';
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
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDeployEnvStore } from '../src/stores/deploy-env';

const STORAGE_KEY = 'bkms_deploy_env_app_selections';

describe('deploy-env store', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    vi.restoreAllMocks();
    let now = 1;
    vi.spyOn(Date, 'now').mockImplementation(() => now++);
  });

  it('keeps app environment selections isolated by scope key', () => {
    const store = useDeployEnvStore();

    store.updateAppEnvSelection('space-a:app-a', {
      mode: 'multi',
      selectedEnvs: ['dev', 'test'],
    });
    store.updateAppEnvSelection('space-a:app-b', {
      mode: 'single',
      selectedEnvs: ['prod'],
    });

    expect(store.getAppEnvSelection('space-a:app-a')).toMatchObject({
      mode: 'multi',
      selectedEnvs: ['dev', 'test'],
    });
    expect(store.getAppEnvSelection('space-a:app-b')).toMatchObject({
      mode: 'single',
      selectedEnvs: ['prod'],
    });
  });

  it('keeps only the 30 most recently updated app selections', () => {
    const store = useDeployEnvStore();

    for (let index = 0; index < 31; index++) {
      store.updateAppEnvSelection(`space-a:app-${index}`, {
        mode: 'multi',
        selectedEnvs: [`env-${index}`],
      });
    }

    expect(Object.keys(store.appEnvSelections)).toHaveLength(30);
    expect(store.getAppEnvSelection('space-a:app-0')).toBeUndefined();
    expect(store.getAppEnvSelection('space-a:app-30')).toMatchObject({
      selectedEnvs: ['env-30'],
    });
  });

  it('restores selections from localStorage after the store is recreated', () => {
    const store = useDeployEnvStore();

    store.updateAppEnvSelection('space-a:app-a', {
      mode: 'multi',
      selectedEnvs: ['dev', 'test'],
    });

    setActivePinia(createPinia());
    const restoredStore = useDeployEnvStore();

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')).toMatchObject({
      'space-a:app-a': {
        mode: 'multi',
        selectedEnvs: ['dev', 'test'],
      },
    });
    expect(restoredStore.getAppEnvSelection('space-a:app-a')).toMatchObject({
      mode: 'multi',
      selectedEnvs: ['dev', 'test'],
    });
  });
});
