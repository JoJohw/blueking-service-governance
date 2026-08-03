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
import { type UserStatisticsOutputObj, type UserWorkspaceStatisticsOutputObj } from './v1/workspace';

import type {
  CreateWorkspaceRequest as CreateWorkspaceRequestV1,
  DeleteWorkspaceRequest,
  ListWorkspacesRequest as ListWorkspacesRequestV1,
  UpdateWorkspaceInfoRequest as UpdateWorkspaceInfoRequestV1,
  WorkspaceDetailOutputObj as WorkspaceDetailOutputObjV1,
  WorkspaceInfoOutputObj as WorkspaceInfoOutputObjV1,
  WorkspaceWithAppsOutputObj as WorkspaceWithAppsOutputObjV1,
} from './v1/workspace';
import type { WorkspaceComponentOutputObj as WorkspaceComponentOutputObjV1 } from './v1/workspace-components';

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type CreateWorkspaceRequest = CreateWorkspaceRequestV1;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type DeleteWorkspaceRequest = DeleteWorkspaceRequest;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type ListWorkspacesRequest = ListWorkspacesRequestV1;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type UpdateWorkspaceInfoRequest = UpdateWorkspaceInfoRequestV1;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type UserStatistics = UserStatisticsOutputObj;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type UserWorkspaceStatistics = UserWorkspaceStatisticsOutputObj;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type WorkspaceComponentOutputObj = WorkspaceComponentOutputObjV1;

/** 工作空间 (占位) */
/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type WorkspaceDetailOutputObj = WorkspaceDetailOutputObjV1;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type WorkspaceInfoOutputObj = WorkspaceInfoOutputObjV1;

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export type WorkspaceWithAppsOutputObj = WorkspaceWithAppsOutputObjV1;
