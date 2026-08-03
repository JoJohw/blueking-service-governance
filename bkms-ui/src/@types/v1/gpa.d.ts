/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：gpa

export interface GetAppEnvGPAConfigRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 环境名称
   */
  envName: string;
}

export type UpsertAppEnvGPAConfigRequest = UpsertGPAConfigInput & {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 环境名称
   */
  envName: string;
};

export interface DeleteAppEnvGPAConfigRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 环境名称
   */
  envName: string;
}

export type ToggleAppEnvGPAConfigRequest = ToggleGPAConfigInput & {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 环境名称
   */
  envName: string;
};

export interface GetGPAConfigOutput {
  /**
   * GPA 配置（含运行状态）
   */
  data?: GPAConfigOutputObj;
}

export interface UpsertGPAConfigInput {
  /**
   * 利用率计算基准开关：true 时该 GPA 下所有 Utilization 指标以 limits（而非默认 requests）为基准计算利用率。
   * 不传默认为 false（沿用 requests）
   */
  computeByLimits?: boolean;
  /**
   * 最大副本数（须 >= minReplicas）
   */
  maxReplicas: number;
  /**
   * 指标模式扩缩容指标列表，最多 2 条（cpu、memory）。与 timeRanges 二者至少配置其一。
   */
  metrics?: GPAMetricInput[];
  /**
   * 最小副本数（本期强制 >= 1）
   */
  minReplicas: number;
  /**
   * 定时模式扩缩容规则列表。与 metrics 二者至少配置其一。
   */
  timeRanges?: GPATimeRangeInput[];
}

export interface EmptyOutput {
}

export interface ToggleGPAConfigInput {
  /**
   * 是否启用 GPA。true 时下发 CR，false 时删除 CR
   */
  enabled?: boolean;
}

export interface GPAMetricInput {
  /**
   * 平均使用率阈值（百分比），取值 1-100
   */
  averageUtilization: number;
  /**
   * 指标资源类型：cpu / memory
   */
  resource: "cpu" | "memory";
}

export interface GPATimeRangeInput {
  /**
   * 命中时间段时的期望副本数（>= 1）
   */
  desiredReplicas: number;
  /**
   * 是否启用该定时规则。仅启用的规则会下发到底层 K8s CR。
   * 不传时默认为 true（启用）。
   */
  enabled?: boolean;
  /**
   * 备注说明，仅用于展示，最长 256 字符。
   */
  remark?: string;
  /**
   * 标准 5 段 Crontab 表达式（分 时 日 月 周）。
   * 语法合法性由领域层校验。
   */
  schedule: string;
}

export interface GPAConfigOutputObj {
  /**
   * 所属应用 ID
   */
  appID?: string;
  /**
   * 利用率计算基准开关：true 时以 limits 为基准计算利用率，false 时以 requests 为基准
   */
  computeByLimits?: boolean;
  /**
   * 创建时间
   */
  createdAt?: string;
  /**
   * 是否启用。false 时集群中不存在 GPA CR，对工作负载不生效
   */
  enabled?: boolean;
  /**
   * 生效环境名称
   */
  envName?: string;
  /**
   * 最大副本数
   */
  maxReplicas?: number;
  /**
   * 指标模式扩缩容指标列表
   */
  metrics?: GPAMetricOutput[];
  /**
   * 最小副本数
   */
  minReplicas?: number;
  /**
   * 配置名称（同 GPA CR 的 metadata.name）
   */
  name?: string;
  /**
   * K8s 运行状态，集群中 CR 不存在时为 nil
   */
  status?: GPAStatusOutput;
  /**
   * 定时模式扩缩容规则列表
   */
  timeRanges?: GPATimeRangeOutput[];
  /**
   * 更新时间
   */
  updatedAt?: string;
}

export interface GPAMetricOutput {
  /**
   * 平均使用率阈值（百分比）
   */
  averageUtilization?: number;
  /**
   * 指标资源类型：cpu / memory
   */
  resource?: string;
}

export interface GPAStatusOutput {
  /**
   * 当前副本数
   */
  currentReplicas?: number;
  /**
   * 期望副本数
   */
  desiredReplicas?: number;
  /**
   * 上次扩缩容时间（RFC3339 字符串，可能为空）
   */
  lastScaleTime?: string;
  /**
   * Phase 提炼后的扩缩容健康状态枚举：
   * Active       - 扩缩正常运作，副本数在 min/max 范围内
   * Paused       - 指标获取失败或无效，扩缩被暂停
   * Limited      - 扩缩逻辑正常但已触达 min/max 边界
   * Failed       - 无法访问 scale 子资源（目标工作负载不存在、API 不可达、权限不足等）
   * Initializing - CR 刚下发，controller 尚未写入 status.conditions，属正常过渡态，稍候即会转为其他状态
   * Unknown      - conditions 存在但关键 condition 无法解析（旧版本 GPA 或异常状态）
   */
  phase?: string;
  /**
   * StatusMessage 汇总所有非 True condition 的 message，用 "; " 连接
   * 所有 condition 均为 True 时为空字符串
   */
  statusMessage?: string;
}

export interface GPATimeRangeOutput {
  /**
   * 命中时间段时的期望副本数
   */
  desiredReplicas?: number;
  /**
   * 是否启用。false 时该规则不下发到底层 K8s CR
   */
  enabled?: boolean;
  /**
   * 备注说明
   */
  remark?: string;
  /**
   * 标准 5 段 Crontab 表达式
   */
  schedule?: string;
}
