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
  type AppModelDeployRecordOutputObj as AppModelDeployRecordOutputObjV1,
  type AppModelResourceSnapshot as AppModelResourceSnapshotV1,
  type CreateTafDeployRequest,
  type CreateTrpcDeployRequest,
  type DeleteHelmDeployRequest,
  type DeleteTafDeployRequest,
  type DeleteTrpcDeployRequest,
  type GetAppModelResourceSnapshotOutput,
  type GetLatestAppModelDeployStatusOutput,
  type GetLatestTafDeployStatusRequest,
  type GetLatestTrpcDeployStatusRequest,
  type GetTafResourceSnapshotRequest,
  type GetTrpcResourceSnapshotRequest,
  type HelmDeployRecordOutputObj as HelmDeployRecordOutputObjV1,
  type ListAppModelDeployRecordsOutput,
  type ListHelmDeployRecordsRequest,
  type ListTafDeployRecordsRequest,
  type ListTafResourceSnapshotsRequest,
  type ListTrpcDeployRecordsRequest,
  type ListTrpcResourceSnapshotsRequest,
  type PreviewHelmDeployOutput,
} from './v1/deploy';

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type AppModelDeployRecordOutputObj = AppModelDeployRecordOutputObjV1;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type AppModelResourceSnapshot = AppModelResourceSnapshotV1;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type CreateAppModelDeployRequest = CreateTafDeployRequest | CreateTrpcDeployRequest;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type DeleteAppModelDeployRequest = DeleteHelmDeployRequest | DeleteTafDeployRequest | DeleteTrpcDeployRequest;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export interface EmptyResponse {}

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type GetAppModelResourceSnapshotRequest = GetTafResourceSnapshotRequest | GetTrpcResourceSnapshotRequest;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type GetAppModelResourceSnapshotResponse = GetAppModelResourceSnapshotOutput;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type GetLatestAppModelDeployStatusRequest = GetLatestTafDeployStatusRequest | GetLatestTrpcDeployStatusRequest;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type GetLatestAppModelDeployStatusResponse = GetLatestAppModelDeployStatusOutput;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type HelmDeployRecordOutputObj = HelmDeployRecordOutputObjV1;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type LatestDeployStatus = GetLatestAppModelDeployStatusOutput;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type ListAppModelDeployRecordsRequest =
  | ListHelmDeployRecordsRequest
  | ListTafDeployRecordsRequest
  | ListTrpcDeployRecordsRequest;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type ListAppModelDeployRecordsResponse = ListAppModelDeployRecordsOutput;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type ListAppModelResourceSnapshotsRequest = ListTafResourceSnapshotsRequest | ListTrpcResourceSnapshotsRequest;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type PreviewHelmDeployResponse = PreviewHelmDeployOutput;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type PreviewRollbackHelmDeployResponse = PreviewHelmDeployOutput;
