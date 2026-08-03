/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：topology

export interface GetResourceTopologyRequest {
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
}

export interface GetTopologyNodeDetailRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 部署环境名称
   */
  envName: string;
  /**
   * 拓扑节点 ID（base64url 无填充编码）
   */
  nodeID: string;
  /**
   * 部署的泳道名称（空字符串表示不使用泳道）
   */
  trafficLaneName?: string;
}

export interface ListTopologyNodeEventsRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 部署环境名称
   */
  envName: string;
  /**
   * 拓扑节点 ID（base64url 无填充编码）
   */
  nodeID: string;
  /**
   * 部署的泳道名称（空字符串表示不使用泳道）
   */
  trafficLaneName?: string;
  /**
   * 事件级别（可选过滤参数，可选值：Normal, Warning）
   */
  level?: string;
  /**
   * 起始时间戳（可选过滤参数，如：1772223278）
   */
  startedAt?: number;
  /**
   * 结束时间戳（可选过滤参数，如：1772223278）
   */
  endedAt?: number;
  /**
   * 分页页码（从 1 开始）
   */
  page: number;
  /**
   * 每页数量
   */
  pageSize: number;
}

export interface GetTopologyNodeManifestRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 部署环境名称
   */
  envName: string;
  /**
   * 拓扑节点 ID（base64url 无填充编码）
   */
  nodeID: string;
  /**
   * 部署的泳道名称（空字符串表示不使用泳道）
   */
  trafficLaneName?: string;
}

export interface GetResourceTopologyOutput {
  /**
   * 拓扑数据
   */
  data?: ResourceTopologyDataOutputObj;
}

export interface GetTopologyNodeDetailOutput {
  /**
   * 拓扑节点详情数据
   */
  data?: TopologyNodeDetailOutputObj;
}

export interface ListTopologyNodeEventsOutput {
  /**
   * 分页事件数据
   */
  data?: PaginatedTopologyNodeEventsOutputObj;
}

export interface GetTopologyNodeManifestOutput {
  /**
   * Manifest 数据
   */
  data?: TopologyNodeManifestOutputObj;
}

export interface TopologyNodeManifestOutputObj {
  /**
   * YAML/JSON 字符串内容
   */
  content?: string;
  /**
   * 格式（yaml 或 json）
   */
  format?: string;
  /**
   * 是否被截断
   */
  truncated?: boolean;
}

export interface PaginatedTopologyNodeEventsOutputObj {
  /**
   * 事件总数
   */
  count?: string;
  /**
   * 事件列表（按时间倒序排列）
   */
  results?: TopologyNodeEventOutputObj[];
}

export interface TopologyNodeEventOutputObj {
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
   * 事件级别（如：Normal, Warning）
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
   * 事件类型（如：Completed, Pulled, Started 等）
   */
  type?: string;
}

export interface TopologyNodeDetailOutputObj {
  /**
   * 资源 conditions 列表
   */
  conditions?: TopologyNodeConditionOutputObj[];
  /**
   * 创建时间（ISO 8601 格式）
   */
  createdAt?: string;
  /**
   * 类型专属扩展字段（复用 kindExtrasProviders 注册表）
   */
  extras?: Record<string, string>;
  /**
   * 拓扑节点 ID（base64url 无填充编码）
   */
  id?: string;
  /**
   * 资源类型
   */
  kind?: string;
  /**
   * 资源名称
   */
  name?: string;
  /**
   * 命名空间
   */
  namespace?: string;
}

export interface TopologyNodeConditionOutputObj {
  /**
   * 上次状态变更时间（ISO 8601 格式）
   */
  lastTransitionTime?: string;
  /**
   * condition 消息
   */
  message?: string;
  /**
   * condition 原因
   */
  reason?: string;
  /**
   * condition 状态（True/False/Unknown）
   */
  status?: string;
  /**
   * condition 类型
   */
  type?: string;
}

export interface ResourceTopologyDataOutputObj {
  /**
   * 数据版本号
   */
  dataVersion?: string;
  /**
   * 拓扑边列表
   */
  edges?: TopologyEdgeOutputObj[];
  /**
   * 生成时间（ISO 8601 格式）
   */
  generatedAt?: string;
  /**
   * 是否为部分拓扑
   */
  isPartial?: boolean;
  /**
   * 拓扑元信息
   */
  metadata?: TopologyMetadataOutputObj;
  /**
   * 拓扑节点列表
   */
  nodes?: TopologyNodeOutputObj[];
  /**
   * 拓扑根节点 ID（base64url 无填充编码）
   */
  rootID?: string;
  /**
   * 警告信息列表
   */
  warnings?: string[];
}

export interface TopologyEdgeOutputObj {
  /**
   * 边 ID（base64url 无填充编码）
   */
  id?: string;
  /**
   * 是否为主边（形成树结构）
   */
  isPrimary?: boolean;
  /**
   * 关系原因
   */
  reason?: EdgeReasonOutputObj;
  /**
   * 关系类型（MANAGES、OWNS、CREATES、SELECTS、MOUNTS、ROUTES_TO 等）
   */
  relation?: EdgeRelation;
  /**
   * 源拓扑节点 ID（base64url 编码）
   */
  sourceID?: string;
  /**
   * 目标拓扑节点 ID（base64url 编码）
   */
  targetID?: string;
}

export interface TopologyMetadataOutputObj {
  /**
   * 应用 ID
   */
  appID?: string;
  /**
   * 集群 ID
   */
  clusterID?: string;
  /**
   * 环境名称
   */
  envName?: string;
  /**
   * 主命名空间
   */
  namespace?: string;
  /**
   * 泳道名称
   */
  trafficLaneName?: string;
}

export interface TopologyNodeOutputObj {
  /**
   * 显示名称
   */
  displayName?: string;
  /**
   * 类型专属扩展字段（key 为字段名，value 为字符串值）
   */
  extras?: Record<string, string>;
  /**
   * 拓扑节点 ID（base64url 无填充编码，内部格式 {kind}/{namespace}/{name}）
   */
  id?: string;
  /**
   * 是否为部署直接管理的资源
   */
  isManaged?: boolean;
  /**
   * 资源类型
   */
  kind?: string;
  /**
   * 资源名称
   */
  name?: string;
  /**
   * 命名空间
   */
  namespace?: string;
  /**
   * 状态补充说明（对应 k8sstatus.Result.Message），可能为空字符串
   */
  reason?: string;
  /**
   * 资源状态（如 Running、Deployed、Healthy、Degraded）
   */
  status?: string;
}

export interface EdgeReasonOutputObj {
  /**
   * 匹配的标签（适用于 label_selector）
   */
  matchedLabels?: Record<string, string>;
  /**
   * 源字段路径
   */
  sourceFieldPath?: string;
  /**
   * 可读摘要
   */
  summary?: string;
  /**
   * 目标字段路径
   */
  targetFieldPath?: string;
  /**
   * 判定类型（owner_reference、label_selector、volume_mount、backend_ref、helm_manifest）
   */
  type?: RelationType;
}

export type EdgeRelation = "MANAGES" | "CREATES" | "SELECTS" | "MOUNTS" | "ROUTES_TO" | "SCALES" | "REFERENCES";

export type RelationType = "owner_reference" | "label_selector" | "volume_mount" | "backend_ref" | "env_ref" | "scale_target_ref" | "service_account_ref" | "app_root";
