/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：envvars

export interface GetAppEnvVarsRequest {
  /**
   * 应用 ID
   */
  appID: string;
}

export type CreateAppEnvVarsRequest = CreateAppDefinedEnvVarInput & {
  /**
   * 应用 ID
   */
  appID: string;
};

export interface ListDetailedAppEnvVarsRequest {
  /**
   * 应用 ID
   */
  appID: string;
}

export type UpdateAppEnvVarsRequest = UpdateAppDefinedEnvVarInput & {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 旧环境变量 Key
   */
  key: string;
};

export interface DeleteAppEnvVarsRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 环境变量 Key
   */
  key: string;
}

export interface ListAppBgEnvVarsRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 环境名称
   */
  envName: string;
}

export interface ListAppEnvVarsRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 环境名称
   */
  envName: string;
}

export interface ListEnvAvailableEnvVarsRequest {
  /**
   * 环境 ID
   */
  envID: string;
}

export interface ListEnvBgEnvVarsRequest {
  /**
   * 环境 ID
   */
  envID: string;
}

export interface ListDetailedEnvScopedEnvVarsRequest {
  /**
   * 环境 ID
   */
  envID: string;
}

export type CreateScopedEnvVarRequest = CreateScopedEnvVarInput & {
  /**
   * 工作空间 ID
   */
  workspaceID: string;
};

export interface ListPublicScopedEnvVarsRequest {
  /**
   * 工作空间 ID
   */
  workspaceID: string;
}

export type UpdateScopedEnvVarRequest = UpdateScopedEnvVarInput & {
  /**
   * 工作空间 ID
   */
  workspaceID: string;
  /**
   * Scoped EnvVar ID
   */
  scopedEnvVarID: string;
};

export interface DeleteScopedEnvVarRequest {
  /**
   * 工作空间 ID
   */
  workspaceID: string;
  /**
   * Scoped EnvVar ID
   */
  scopedEnvVarID: string;
}

export interface ListAppDefinedEnvVarsOutput {
  /**
   * 应用直接定义的环境变量列表
   */
  data?: AppDefinedEnvVarOutputObj[];
}

export interface CreateAppDefinedEnvVarInput {
  /**
   * 描述
   */
  description?: string;
  /**
   * 是否敏感
   */
  isSensitive?: boolean;
  /**
   * 环境变量 Key
   */
  key: string;
  /**
   * 环境变量值，允许为空
   */
  value?: string;
}

export interface CreateAppDefinedEnvVarOutput {
  /**
   * 应用直接定义的环境变量
   */
  data?: AppDefinedEnvVarOutputObj;
}

export interface ListDetailedAppEnvVarsOutput {
  /**
   * 应用环境变量详情列表
   */
  data?: AppEnvVarDetailedOutputObj[];
}

export interface UpdateAppDefinedEnvVarInput {
  /**
   * 描述
   */
  description?: string;
  /**
   * 是否敏感，未传时保持原值不变
   */
  isSensitive?: boolean;
  /**
   * 更新后的环境变量 Key
   */
  updatedKey: string;
  /**
   * 环境变量值，未传时保持原值，允许显式传空字符串
   */
  value?: string;
}

export interface UpdateAppDefinedEnvVarOutput {
  /**
   * 应用直接定义的环境变量
   */
  data?: AppDefinedEnvVarOutputObj;
}

export interface EmptyOutput {
}

export interface ListAppBgEnvVarsOutput {
  /**
   * 应用在某个环境下的背景环境变量列表
   */
  data?: BgEnvVarOutputObj[];
}

export interface ListAppEnvVarsOutput {
  /**
   * 应用部署到某个环境后可用的环境变量列表
   */
  data?: EnvVarOutputObj[];
}

export interface ListEnvAvailableEnvVarsOutput {
  /**
   * 环境下所有可用的环境变量列表
   */
  data?: EnvVarOutputObj[];
}

export interface ListEnvBgEnvVarsOutput {
  /**
   * 指定环境的背景环境变量列表
   */
  data?: BgEnvVarOutputObj[];
}

export interface ListDetailedEnvScopedEnvVarsOutput {
  /**
   * 作用域为当前环境的环境变量详情列表
   */
  data?: ScopedEnvVarDetailedOutputObj[];
}

export interface CreateScopedEnvVarInput {
  /**
   * 描述
   */
  description?: string;
  /**
   * 是否敏感
   */
  isSensitive?: boolean;
  /**
   * 环境变量 Key
   */
  key: string;
  /**
   * 作用域类型，目前支持 workspace、envType、env
   */
  scopeType: "workspace" | "envType" | "env";
  /**
   * 作用域值
   */
  scopeValue?: string;
  /**
   * 环境变量值，允许为空
   */
  value?: string;
}

export interface CreateScopedEnvVarOutput {
  /**
   * 作用域级别环境变量
   */
  data?: ScopedEnvVarOutputObj;
}

export interface ListPublicScopedEnvVarsOutput {
  /**
   * 作用域为 workspace 和 envType 的环境变量列表
   */
  data?: ScopedEnvVarOutputObj[];
}

export interface UpdateScopedEnvVarInput {
  /**
   * 描述
   */
  description?: string;
  /**
   * 是否敏感，未传时保持原值不变
   */
  isSensitive?: boolean;
  /**
   * 环境变量 Key
   */
  key: string;
  /**
   * 环境变量值，未传时保持原值，允许显式传空字符串
   */
  value?: string;
}

export interface UpdateScopedEnvVarOutput {
  /**
   * 作用域级别环境变量
   */
  data?: ScopedEnvVarOutputObj;
}

export interface ScopedEnvVarOutputObj {
  /**
   * 创建时间
   */
  createdAt?: string;
  /**
   * 描述
   */
  description?: string;
  /**
   * 环境变量 ID
   */
  id?: string;
  /**
   * 是否敏感
   */
  isSensitive?: boolean;
  /**
   * 环境变量 Key
   */
  key?: string;
  /**
   * 作用域类型，目前支持 workspace、envType、env
   */
  scopeType?: string;
  /**
   * 作用域值
   * - 当 scopeType 为 workspace 时，固定为空字符串
   * - 当 scopeType 为 envType 时，可选值为 development、test、production
   * - 当 scopeType 为 env 时，值为具体环境名称
   */
  scopeValue?: string;
  /**
   * 更新时间
   */
  updatedAt?: string;
  /**
   * 环境变量值
   */
  value?: string;
  /**
   * 工作空间 ID
   */
  workspaceID?: string;
}

export interface ScopedEnvVarDetailedOutputObj {
  /**
   * 冲突信息
   */
  conflictedInfo?: EnvVarConflictedInfoOutputObj;
  /**
   * 环境变量基础信息
   */
  scopedEnvVar?: ScopedEnvVarOutputObj;
}

export interface EnvVarConflictedInfoOutputObj {
  /**
   * 冲突详情
   */
  conflictedDetail?: string;
  /**
   * 冲突来源列表
   */
  conflictedSources?: EnvVarConflictedSourceOutputObj[];
  /**
   * 当前变量是否覆盖冲突变量并生效
   */
  overrideConflicted?: boolean;
}

export interface EnvVarConflictedSourceOutputObj {
  /**
   * 冲突来源
   */
  source?: string;
  /**
   * 冲突来源值
   */
  sourceValue?: string;
}

export interface BgEnvVarOutputObj {
  /**
   * 描述
   */
  description?: string;
  /**
   * 环境变量 Key
   */
  key?: string;
  /**
   * 来源，如 builtin、scopedWorkspace、scopedEnvType、scopedEnv、app
   */
  source?: string;
  /**
   * 环境变量值
   */
  value?: string;
}

export interface EnvVarOutputObj {
  /**
   * 环境变量描述
   */
  description?: string;
  /**
   * 是否是内置变量
   */
  isBuiltin?: boolean;
  /**
   * 是否是敏感变量
   */
  isSensitive?: boolean;
  /**
   * 环境变量 Key
   */
  key?: string;
  /**
   * 环境变量值
   */
  value?: string;
}

export interface AppDefinedEnvVarOutputObj {
  /**
   * 创建时间
   */
  createdAt?: string;
  /**
   * 描述
   */
  description?: string;
  /**
   * 是否敏感
   */
  isSensitive?: boolean;
  /**
   * 环境变量 Key
   */
  key?: string;
  /**
   * 更新时间
   */
  updatedAt?: string;
  /**
   * 环境变量值
   */
  value?: string;
}

export interface AppEnvVarDetailedOutputObj {
  /**
   * 应用环境变量基础信息
   */
  appEnvVar?: DetailedAppEnvVarOutputObj;
  /**
   * 冲突信息
   */
  conflictedInfo?: EnvVarConflictedInfoOutputObj;
}

export interface DetailedAppEnvVarOutputObj {
  /**
   * 创建时间
   */
  createdAt?: string;
  /**
   * 描述
   */
  description?: string;
  /**
   * 是否敏感
   */
  isSensitive?: boolean;
  /**
   * 环境变量 Key
   */
  key?: string;
  /**
   * 更新时间
   */
  updatedAt?: string;
  /**
   * 环境变量值
   */
  value?: string;
}
