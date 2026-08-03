/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：bkintegrations-bkmonitor

export interface GetApmServiceNameRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 环境名称
   */
  envName: string;
}

export interface GetInstanceTimeSeriesRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 环境名称
   */
  envName: string;
  /**
   * 实例名称列表
   */
  instances: string[];
  /**
   * 指标标识
   */
  metricKey: string;
  /**
   * 开始时间（Unix 时间戳）
   */
  startTime: number;
  /**
   * 结束时间（Unix 时间戳）
   */
  endTime: number;
  /**
   * 汇聚周期（秒），默认 60
   */
  interval?: number;
}

export interface GetEnvApmRequest {
  /**
   * 环境 ID
   */
  envID: string;
}

export interface CreateEnvApmRequest {
  /**
   * 环境 ID
   */
  envID: string;
}

export interface BindApmToEnvRequest {
  /**
   * 环境 ID
   */
  envID: string;
  /**
   * APM ID
   */
  apmID: string;
}

export interface ListApmsRequest {
  /**
   * 工作空间 ID
   */
  workspaceID: string;
}

export interface GetApmServiceNameResp {
  data?: GetApmServiceNameOutput;
}

export interface InstanceTimeSeriesResp {
  /**
   * Data 指标名称 -> 时序数据的映射
   */
  data?: Record<string, MetricTimeSeries>;
}

export interface GetEnvApmResp {
  data?: GetEnvApmOutput;
}

export interface CreateEnvApmResp {
  data?: ApmOutput;
}

export interface EmptyOutput {
}

export interface ListApmsResp {
  data?: ListApmOutput;
}

export interface ListApmOutput {
  count?: string;
  results?: ApmOutput[];
}

export interface ApmOutput {
  apmID?: string;
  associatedEnvs?: ApmEnvInfoOutput[];
  bkBizID?: string;
  createdAt?: string;
  creator?: string;
  description?: string;
  logReady?: boolean;
  metricReady?: boolean;
  name?: string;
  profilingReady?: boolean;
  token?: string;
  traceReady?: boolean;
  type?: string;
}

export interface ApmEnvInfoOutput {
  envID?: string;
  envName?: string;
}

export interface GetEnvApmOutput {
  apmID?: string;
  name?: string;
  token?: string;
}

export interface MetricTimeSeries {
  /**
   * DisplayName 指标展示名称
   */
  displayName?: string;
  /**
   * Series 各实例的时序数据列表
   */
  series?: TimeSeriesItem[];
  /**
   * Unit 指标单位
   */
  unit?: string;
}

export interface TimeSeriesItem {
  /**
   * DataPoints 时序数据点列表，每个元素为 [时间戳, 值]
   */
  dataPoints?: number[][];
  /**
   * Instance 实例（Pod）名称
   */
  instance?: string;
  /**
   * Stat 统计信息，包含 count、sum、min、max、avg、last
   */
  stat?: TimeSeriesItemStat;
}

export interface TimeSeriesItemStat {
  /**
   * Avg 平均值
   */
  avg?: number[];
  /**
   * Count 数据点计数
   * [0] 为时间戳，[1] 为值
   */
  count?: number[];
  /**
   * Last 最后一个数据点
   */
  last?: number[];
  /**
   * Max 最大值
   */
  max?: number[];
  /**
   * Min 最小值
   */
  min?: number[];
  /**
   * Sum 数据点求和
   */
  sum?: number[];
}

export interface GetApmServiceNameOutput {
  serviceName?: string;
}
