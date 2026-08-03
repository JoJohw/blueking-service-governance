export type ComponentType = 'Component' | 'Deploy' | 'Storage' | 'Strategy';

export interface ICluster {
  // 从clusterExtraInfo中merge过来的
  autoScale: boolean;
  cloudAccountID: string;
  cluster_id: string; // 兼容旧版数据（不要再使用）
  clusterAdvanceSettings: any;
  clusterBasicSettings: any;
  clusterCategory: string;
  clusterID: string;
  clusterName: string;
  clusterType: string;
  createTime: string;
  creator: string;
  description: string;
  environment: 'debug' | 'prod' | 'stag';
  extraInfo?: Record<string, any>;
  importCategory: string;
  is_shared: boolean;
  labels: Record<string, string>;
  manageType: 'INDEPENDENT_CLUSTER' | 'MANAGED_CLUSTER';
  master: any;
  networkType: string;
  provider: CloudID;
  providerType: string;
  region: string;
  status: 'DELETING' | 'INITIALIZATION' | 'RUNNING';
  systemID: string;
  updateTime: string;
  vpcID: string;
  networkSettings: {
    cidrStep: number;
    clusterIPv4CIDR: string;
    enableVPCCni: boolean;
    eniSubnetIDs: string[];
    isStaticIpMode: boolean;
    maxNodePodNum: number;
    maxServiceNum: number;
    multiClusterCIDR: string[];
    networkMode: 'tke-direct-eni' | 'tke-route-eni';
    serviceIPv4CIDR: string;
    status: string;
  };

  sharedRanges?: {
    bizs: string[];
    projectIdOrCodes: string[];
  };
}

export interface IProject {
  annotations: Labels;
  businessID: string;
  businessName: string;
  createTime: string;
  creator: string;
  description: string;
  isOffline: boolean;
  kind: string;
  labels: Labels;
  managers: string;
  name: string;
  projectCode: string;
  projectID: string;
  updater: string;
  updateTime: string;
  useBKRes: boolean;
}

export interface IProjectPerm {
  project_create: boolean;
  project_delete: boolean;
  project_edit: boolean;
  project_view: boolean;
}

type ExtractData<T> = T extends { data: infer D } ? D : undefined;

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
interface IUser {
  user_id: string;
}

interface Labels {
  [key: string]: string;
}
