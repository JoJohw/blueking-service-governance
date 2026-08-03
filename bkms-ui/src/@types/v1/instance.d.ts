/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：instance

export interface ListEventsRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 部署环境名称
   */
  envName: string;
  /**
   * 部署的泳道名称（空字符串表示不使用泳道）
   */
  trafficLaneName?: string;
  /**
   * 事件级别（可选过滤参数，可选值：Normal, Warning）
   */
  level?: string;
  /**
   * 起始时间戳
   */
  startedAt?: number;
  /**
   * 结束时间戳
   */
  endedAt?: number;
  /**
   * 页码，从 1 开始
   */
  page: number;
  /**
   * 每页数量
   */
  pageSize: number;
}

export interface ListAppInstancesRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 部署环境名称
   */
  envName: string;
  /**
   * 部署的泳道名称（空字符串表示不使用泳道）
   */
  trafficLaneName?: string;
  /**
   * 页码，从 1 开始
   */
  page: number;
  /**
   * 每页数量
   */
  pageSize: number;
}

export type UpdateAppInstancesRequest = UpdateAppInstancesInput & {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 部署环境名称
   */
  envName: string;
};

export interface ListTrpcAdminCmdsRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 部署环境名称
   */
  envName: string;
  /**
   * 实例 ID 列表
   */
  instanceIDs: string[];
}

export type ExecuteTrpcAdminCmdRequest = ExecuteTrpcAdminCmdInput & {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 部署环境名称
   */
  envName: string;
};

export type BatchDeleteAppInstancesRequest = BatchDeleteAppInstancesInput & {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 部署环境名称
   */
  envName: string;
};

export type UpdateAppInstancePolarisRequest = UpdateAppInstancePolarisInput & {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 部署环境名称
   */
  envName: string;
};

export type ScaleAppInstancesRequest = ScaleAppInstancesInput & {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 部署环境名称
   */
  envName: string;
};

export type ExecuteTafAdminCmdRequest = ExecuteTafAdminCmdInput & {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 部署环境名称
   */
  envName: string;
};

export interface ListAppInstanceLogsRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 部署环境名称
   */
  envName: string;
  /**
   * 实例 ID
   */
  instanceID: string;
  /**
   * 部署的泳道名称（空字符串表示不使用泳道）
   */
  trafficLaneName?: string;
  /**
   * 是否获取重启前日志
   */
  previous?: boolean;
  /**
   * 日志行数（从尾部起算），最大 2000
   */
  tailLines: number;
}

export interface PortForwardRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 部署环境名称
   */
  envName: string;
  /**
   * 实例 ID
   */
  instanceID: string;
  /**
   * 目标 Pod 端口号
   */
  remotePort: number;
  /**
   * CLI 本地监听端口号
   */
  localPort: number;
}

export type CreateAppInstanceWebConsoleRequest = CreateAppInstanceWebConsoleInput & {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 部署环境名称
   */
  envName: string;
  /**
   * 实例 ID
   */
  instanceID: string;
};

export interface ListEventsOutput {
  /**
   * 分页查询结果
   */
  data?: PaginatedEventsOutputObj;
}

export interface ListAppInstancesOutput {
  /**
   * 分页查询结果
   */
  data?: PaginatedAppInstancesOutputObj;
}

export interface UpdateAppInstancesInput {
  /**
   * 部署使用的镜像 Tag
   */
  imageTag: string;
  /**
   * 实例 ID 列表
   */
  instanceIDs: string[];
  /**
   * 部署的泳道名称（空字符串表示不使用泳道）
   */
  trafficLaneName?: string;
  /**
   * 更新策略，可选值：RollingUpdate, InplaceUpdate
   */
  updateStrategy: "RollingUpdate" | "InplaceUpdate";
}

export interface EmptyOutput {
}

export interface ListTrpcAdminCmdsOutput {
  data?: ListTrpcAdminCmdsOutputObjs;
}

export interface ExecuteTrpcAdminCmdInput {
  /**
   * 请求体，选填
   */
  body?: string;
  /**
   * 实例 ID 列表
   */
  instanceIDs: string[];
  /**
   * HTTP 方法，限定 GET, POST, PUT
   */
  method: "GET" | "POST" | "PUT";
  /**
   * url 查询参数，选填
   */
  params?: Record<string, string>;
  /**
   * 访问的 url
   */
  url: string;
}

export interface ExecuteTrpcAdminCmdOutput {
  data?: ExecuteTrpcAdminCmdOutputObjs;
}

export interface BatchDeleteAppInstancesInput {
  /**
   * 实例 ID 列表
   */
  instanceIDs: string[];
  /**
   * 部署的泳道名称（空字符串表示不使用泳道）
   */
  trafficLaneName?: string;
}

export interface UpdateAppInstancePolarisInput {
  /**
   * 实例 ID 列表
   */
  instanceIDs: string[];
  /**
   * 北极星隔离状态（可选），不设置表示不修改
   */
  isolate?: boolean;
  /**
   * 部署的泳道名称（空字符串表示不使用泳道）
   */
  trafficLaneName?: string;
  /**
   * 北极星权重（可选，如 100），不设置表示不修改
   */
  weight?: number;
}

export interface ScaleAppInstancesInput {
  /**
   * 目标实例数量
   */
  targetReplicas?: number;
  /**
   * 部署的泳道名称（空字符串表示不使用泳道）
   */
  trafficLaneName?: string;
}

export interface ExecuteTafAdminCmdInput {
  /**
   * 执行的命令（如 "taf.viewversion", "taf.setloglevel DEBUG"）
   */
  command: string;
  /**
   * 实例 ID 列表
   */
  instanceIDs: string[];
}

export interface ExecuteTafAdminCmdOutput {
  data?: ExecuteTafAdminCmdOutputObjs;
}

export interface ListAppInstanceLogsOutput {
  data?: LogEntryOutputObj[];
}

export interface CreateAppInstanceWebConsoleInput {
  /**
   * 部署的泳道名称（空字符串表示不使用泳道）
   */
  trafficLaneName?: string;
}

export interface CreateAppInstanceWebConsoleOutput {
  data?: WebConsoleInfoOutputObj;
}

export interface WebConsoleInfoOutputObj {
  /**
   * 访问链接
   */
  url?: string;
}

export interface LogEntryOutputObj {
  /**
   * 日志内容
   */
  content?: string;
  /**
   * 日志时间戳
   */
  timestamp?: string;
}

export interface ExecuteTafAdminCmdOutputObjs {
  /**
   * 结果数量
   */
  count?: string;
  /**
   * 查询结果
   */
  results?: InstanceExecuteTafAdminCmdResultOutputObj[];
}

export interface InstanceExecuteTafAdminCmdResultOutputObj {
  /**
   * 命令执行结果详情
   */
  detail?: string;
  /**
   * 实例 ID
   */
  instanceID?: string;
  /**
   * 命令执行是否成功
   */
  success?: boolean;
}

export interface ExecuteTrpcAdminCmdOutputObjs {
  /**
   * 结果数量
   */
  count?: string;
  /**
   * 查询结果
   */
  results?: InstanceExecuteTrpcAdminCmdResultOutputObj[];
}

export interface InstanceExecuteTrpcAdminCmdResultOutputObj {
  /**
   * 命令执行结果详情
   */
  detail?: string;
  /**
   * 实例 ID
   */
  instanceID?: string;
  /**
   * 命令执行是否成功
   */
  success?: boolean;
}

export interface ListTrpcAdminCmdsOutputObjs {
  /**
   * 结果数量
   */
  count?: string;
  /**
   * 查询结果
   */
  results?: string[];
}

export interface PaginatedAppInstancesOutputObj {
  /**
   * 结果数量
   */
  count?: string;
  /**
   * 查询结果
   */
  results?: AppInstanceOutputObj[];
}

export interface AppInstanceOutputObj {
  /**
   * 存在时间，格式如：2d1h，24m29s
   */
  age?: string;
  /**
   * 部署记录 ID
   */
  deployID?: string;
  /**
   * 实例 ID（即 k8s pod 的 name）
   */
  id?: string;
  /**
   * 镜像
   */
  image?: string;
  /**
   * Pod IP
   */
  ip?: string;
  /**
   * 健康状态，即 k8s 探针检查结果
   */
  isHealthy?: boolean;
  /**
   * 状态详情，一般为 pod.status.reason
   */
  message?: string;
  /**
   * 节点 IP，Pod 所在节点的 IP 地址
   */
  nodeIP?: string;
  /**
   * 北极星实例状态列表（一个 Pod 可能注册到多个北极星服务）
   */
  polarisInfos?: PolarisInstanceInfoOutputObj[];
  /**
   * 重启次数
   */
  restartCount?: string;
  /**
   * 状态，由 pod.status.phase 等解析获得
   */
  status?: string;
}

export interface PolarisInstanceInfoOutputObj {
  /**
   * 是否启用健康检查
   */
  enableHealthCheck?: boolean;
  /**
   * 实例 IP（等于 Pod IP）
   */
  ip?: string;
  /**
   * 健康状态
   */
  isHealthy?: boolean;
  /**
   * 隔离状态
   */
  isIsolated?: boolean;
  /**
   * 元数据
   */
  metadata?: Record<string, string>;
  /**
   * 实例端口（等于应用监听的服务端口）
   */
  port?: number;
  /**
   * 北极星服务名
   */
  serviceName?: string;
  /**
   * 北极星命名空间
   */
  serviceNamespace?: string;
  /**
   * 权重
   */
  weight?: string;
}

export interface PaginatedEventsOutputObj {
  /**
   * 结果数量
   */
  count?: string;
  /**
   * 查询结果
   */
  results?: EventEntryOutputObj[];
}

export interface EventEntryOutputObj {
  /**
   * BCS 集群 ID
   */
  clusterID?: string;
  /**
   * 组件名称
   */
  componentName?: string;
  /**
   * 事件内容
   */
  content?: string;
  /**
   * 事件创建时间
   */
  createdAt?: string;
  /**
   * 事件级别
   */
  level?: string;
  /**
   * 命名空间
   */
  namespace?: string;
  /**
   * 关联的资源类型，如：Deployment, Pod，Node 等
   */
  resourceKind?: string;
  /**
   * 关联的资源名称，如：nginx-ingress-2695bd-58877d456b
   */
  resourcesName?: string;
  /**
   * 事件类型
   */
  type?: string;
}
