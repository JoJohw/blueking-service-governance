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
import Fetch from '~/api/fetch';

const fetch = new Fetch({
  prefix: import.meta.env.BK_NODE_ENV === 'development' ? '' : `${import.meta.env.BK_BCS_API_BASE_URL}`,
});

// ===========bcs==========

// 获取bcs项目列表
export const getBcsProjects = fetch.get('/bcsapi/v4/bcsproject/v1/authorized_projects');
// 获取bcs项目详情
export const getProject = fetch.get('/bcsapi/v4/bcsproject/v1/projects/{projectId}');
// 获取bcs集群列表
export const getBcsCLusters = fetch.get('/bcsapi/v4/clustermanager/v1/projects/{projectId}/clusters');

// 获取集群命名空间
export const getNamespaceList = fetch.get(
  '/bcsapi/v4/bcsproject/v1/projects/{projectCode}/clusters/{clusterId}/namespaces',
);

// auth
export const userPerms = fetch.post('/bcsapi/v4/usermanager/v1/iam/user_perms');
export const userPermsByAction = fetch.post('/bcsapi/v4/usermanager/v1/iam/user_perms/actions/{actionId}');

// ===========devops==========

// 获取代码库列表
const repoFetch = new Fetch({
  prefix: import.meta.env.BK_NODE_ENV === 'development' ? '' : `${import.meta.env.BK_REPO_URL}`,
});
export const getGitProjects = repoFetch.get<any, any>('/ms/repository/api/user/git/getProject');
// 获取流水线列表
export const getPipelines = repoFetch.get<any, any>(
  '/ms/process/api/user/pipelines/bkms-{workspace}/hasPermissionList?permission=EXECUTE&limit=-1',
);
// 获取流水线参数
export const getPipeLineParams = repoFetch.get<any, any>(
  '/ms/process/api/user/builds/bkms-{workspace}/{pipelineId}/manualStartupInfo',
);
