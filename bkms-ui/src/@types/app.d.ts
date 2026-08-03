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
import {
  type AppDeployedEnvOutputObj,
  type AppDetailOutputObj as AppDetailOutputObjV1,
  type AppInfoOutputObj as AppInfoOutputObjV1,
  type AppModelSpecOutputObj,
  type BuildConfigInput,
  type BuildConfigOutputObj,
  type ComponentOutputObj,
  type CreateAppRequest as CreateAppRequestV1,
  type GetAppIDAutoSuffixOutput,
  type HelmGitRepoConfigInput,
  type HelmRepoConfigInput,
  type HelmSourceInput,
  type HelmSpecInput,
  type HelmSpecOutputObj,
  type UpdateHelmSpecRequest as UpdateHelmSpecRequestV1,
  type VariableInput,
} from './v1/app';
import { type EnvVarOutputObj } from './v1/envvars';

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type AppDeployedEnvObj = AppDeployedEnvOutputObj;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type AppDetailOutputObj = AppDetailOutputObjV1;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type AppEnvVarOutputObj = EnvVarOutputObj;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type AppInfoOutputObj = AppInfoOutputObjV1;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export interface AppModelDeployRecordOutputObj {
  demo: string;
}

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type AppModelSpec = AppModelSpecOutputObj;
/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type AppModelSpecOutput = AppModelSpecOutputObj;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type BuildConfig = BuildConfigInput;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type BuildConfigOutput = BuildConfigOutputObj;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 * 事实上 `~/@types/v1` 并未提供对应 type，这里仍保留deprecated，待后续补充
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Component = any;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type ComponentOutput = ComponentOutputObj;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type CreateAppRequest = CreateAppRequestV1;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type GetAppIDAutoSuffixResponse = GetAppIDAutoSuffixOutput;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type HelmGitRepoConfig = HelmGitRepoConfigInput;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type HelmRepoConfig = HelmRepoConfigInput;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type HelmSource = HelmSourceInput;
/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type HelmSpec = HelmSpecInput;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type HelmSpecOutput = HelmSpecOutputObj;
/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type UpdateHelmSpecRequest = UpdateHelmSpecRequestV1;
/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type Variable = VariableInput;
