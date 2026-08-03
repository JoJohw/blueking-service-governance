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
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
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
import { computed, watch } from 'vue';

import { useDebounce } from '@vueuse/core';
import { get } from 'lodash-es';
import { ApiServerService } from '~/api/modules/bkmsserver';
import { filterTimeFormat } from '~/common/util';
import { useAppDetail } from '~/stores/app-detail';

/**
 * 推荐镜像 Tag 相关逻辑
 * - onRecommend: 获取到推荐 Tag 后的回调
 * - getDefaultBranch: 获取应用默认构建分支
 *
 * @param branchGetter 获取当前分支的函数
 * @param options.onRecommend 获取到推荐 Tag 后的回调
 */
export function useRecommendTag(branchGetter: () => string, options?: { onRecommend?: (tag: string) => void }) {
  const appDetailStore = useAppDetail();
  let skipNextWatch = false;

  /** 纯请求逻辑，不碰标志位 */
  async function doFetch(branch: string): Promise<string> {
    const rawTag = await ApiServerService.GetRecommendedImageTag({
      appID: appDetailStore.appID,
      branch,
    }).catch(() => '');
    const tag = rawTag || filterTimeFormat(new Date(), 'YYYYmmddHHMM');
    options?.onRecommend?.(tag);
    return tag;
  }

  /** 手动调用：设 skipNextWatch 跳过接下来的 watch 触发，避免重复请求 */
  async function fetchRecommendTag(branch: string): Promise<string> {
    skipNextWatch = true;
    return doFetch(branch);
  }

  /** 获取应用默认构建分支（来自 buildConfig.repoBuildConfig.defaultBranch） */
  function getDefaultBranch(): string {
    return get(appDetailStore, 'appDetail.buildConfig.repoBuildConfig.defaultBranch') || '';
  }

  // debounce watch：分支变化时自动获取推荐 Tag
  const debounceBranch = useDebounce(computed(branchGetter), 500);
  watch(debounceBranch, async newBranch => {
    if (skipNextWatch) {
      skipNextWatch = false;
      return;
    }
    if (newBranch) {
      await doFetch(newBranch);
    }
  });

  return { getDefaultBranch, fetchRecommendTag };
}
