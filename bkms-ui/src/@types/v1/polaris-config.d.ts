/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：polaris-config

export interface ListAppPolarisConfigsRequest {
  /**
   * 应用 ID
   */
  appID: string;
}

export type CreateAppPolarisConfigRequest = CreateAppPolarisConfigInput & {
  /**
   * 应用 ID
   */
  appID: string;
};

export type ValidateAppPolarisConfigRequest = CreateAppPolarisConfigInput & {
  /**
   * 应用 ID
   */
  appID: string;
};

export interface DeleteAppPolarisConfigRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 配置名称
   */
  configName: string;
}

export type PatchAppPolarisConfigRequest = PatchAppPolarisConfigInput & {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 配置名称
   */
  configName: string;
};

export interface ListAppPolarisConfigVarsRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 配置名称
   */
  configName: string;
}

export interface ListAppPolarisConfigsOutput {
  /**
   * 北极星配置列表
   */
  data?: PolarisConfigOutputObj[];
}

export interface CreateAppPolarisConfigInput {
  /**
   * 是否由平台创建新的北极星服务
   */
  createNewService?: boolean;
  /**
   * 是否为直连模式，默认 false
   */
  direct?: boolean;
  /**
   * 是否启用健康检查，默认 false
   */
  enableHealthCheck?: boolean;
  /**
   * 组件实例标识，用于环境变量拼接，只能包含字母、数字、下划线
   */
  instanceKey: string;
  /**
   * 是否保留未就绪的 Pod 在北极星，默认 true
   */
  keepNotReadyPod?: boolean;
  /**
   * 操作人(即北极星负责人, 仅 createNewService 为 true 时有效)
   */
  operator?: string;
  /**
   * 北极星实例名称
   */
  polarisName: string;
  /**
   * 北极星环境（命名空间）
   */
  polarisNamespace: "Test" | "Production" | "Development" | "Pre-release";
  /**
   * 北极星 Token（当 createNewService 为 false 时必填，为 true 时由平台创建后回填）
   */
  polarisToken?: string;
  /**
   * 组件生效的环境列表，当 scopeType 为 environment 时有效
   */
  scopeEnvNames?: string[];
  /**
   * 组件生效范围类型，可选值只能为 environment
   */
  scopeType: "environment";
  /**
   * 服务标签
   */
  serviceLabels?: Record<string, string>;
  /**
   * 服务端口
   */
  servicePort: number;
  /**
   * 服务权重，默认 10
   */
  weight?: number;
}

export interface CreateAppPolarisConfigOutput {
  /**
   * 配置名称
   */
  data?: PolarisNameOutputObj;
}

export interface ValidateAppPolarisConfigOutput {
  /**
   * 校验警告信息
   */
  warnings?: string[];
}

export interface PatchAppPolarisConfigInput {
  /**
   * 是否为直连模式（可选更新）
   */
  direct?: boolean;
  /**
   * 是否启用健康检查（可选更新）
   */
  enableHealthCheck?: boolean;
  /**
   * 组件实例标识（可选更新）
   */
  instanceKey?: string;
  /**
   * 是否保留未就绪的 Pod 在北极星（可选更新）
   */
  keepNotReadyPod?: boolean;
  /**
   * 北极星 Token（可选更新）
   */
  polarisToken?: string;
  /**
   * 组件生效范围（可选更新）
   */
  scope?: PatchPolarisScopeInput;
  /**
   * 服务标签（可选更新，传入时全量替换）
   */
  serviceLabels?: Record<string, string>;
  /**
   * 服务端口（可选更新）
   */
  servicePort?: number;
  /**
   * 服务权重（可选更新）
   */
  weight?: number;
}

export interface PatchAppPolarisConfigOutput {
  /**
   * 更新后的北极星配置
   */
  data?: PolarisConfigOutputObj;
}

export interface ListAppPolarisConfigVarsOutput {
  /**
   * 变量列表
   */
  data?: PolarisConfigVarOutput[];
}

export interface PolarisConfigVarOutput {
  /**
   * 变量名
   */
  key?: string;
  /**
   * 变量值
   */
  value?: string;
}

export interface PolarisConfigOutputObj {
  /**
   * 所属应用 ID
   */
  appID?: string;
  /**
   * 创建时间
   */
  createdAt?: string;
  /**
   * 关联的依赖服务实例 ID（平台创建时有值，用于后续管理）
   */
  depSvcInstID?: string;
  /**
   * 是否为直连模式（注册 PodIP 到北极星）
   */
  direct?: boolean;
  /**
   * 是否启用健康检查
   */
  enableHealthCheck?: boolean;
  /**
   * 各环境中已经生效的关键字段、下发错误和部署状态
   */
  envStates?: Record<string, PolarisEnvStateOutput>;
  /**
   * 组件实例标识，用于环境变量拼接
   */
  instanceKey?: string;
  /**
   * 是否保留未就绪的 Pod 在北极星
   */
  keepNotReadyPod?: boolean;
  /**
   * 组件名称
   */
  name?: string;
  /**
   * 负责人
   */
  operator?: string;
  /**
   * 北极星实例名称
   */
  polarisName?: string;
  /**
   * 北极星环境（命名空间）
   */
  polarisNamespace?: string;
  /**
   * 北极星 Token（敏感信息，返回时脱敏）
   */
  polarisToken?: string;
  /**
   * 组件生效的环境列表
   */
  scopeEnvNames?: string[];
  /**
   * 组件生效范围类型
   */
  scopeType?: string;
  /**
   * 服务标签
   */
  serviceLabels?: Record<string, string>;
  /**
   * 服务端口
   */
  servicePort?: number;
  /**
   * 更新时间
   */
  updatedAt?: string;
  /**
   * 校验警告信息
   */
  warnings?: string[];
  /**
   * 服务权重
   */
  weight?: number;
}

export interface PolarisEnvStateOutput {
  /**
   * 集群中已经生效的关键字段；nil 表示尚未完成首次应用部署
   */
  appliedFields?: RedeployRequiredFieldsOutput;
  /**
   * 最近一次记录的动态下发错误；应用部署完成或正常下发成功后清空
   */
  lastError?: string;
  /**
   * 生成响应时，当前配置期望的 Polaris Token 是否不同于该环境最近一次应用部署记录的 Token；
   * 环境不在当前生效范围或尚无部署快照时为 false，Token 值本身始终脱敏
   */
  polarisTokenChanged?: boolean;
  /**
   * 部署状态: deployed / pendingCreate / pendingModify / pendingDelete
   */
  status?: string;
  /**
   * 环境信息最后更新时间；尚无环境记录时为空
   */
  updatedAt?: string;
}

export interface RedeployRequiredFieldsOutput {
  /**
   * InstanceKey 北极星实例标识，用于生成环境变量
   */
  instanceKey?: string;
  /**
   * PolarisToken 北极星访问令牌
   */
  polarisToken?: string;
  /**
   * ServicePort 北极星服务端口
   */
  servicePort?: number;
}

export interface PatchPolarisScopeInput {
  /**
   * 组件生效的环境列表，当 scopeType 为 environment 时有效
   */
  scopeEnvNames?: string[];
  /**
   * 组件生效范围类型，可选值只能为 environment
   */
  scopeType: "environment";
}

export interface PolarisNameOutputObj {
  /**
   * 配置名称
   */
  name?: string;
}
