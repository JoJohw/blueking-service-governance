/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：workspace-components

export interface ListWorkspaceComponentsRequest {
  /**
   * 工作空间 ID
   */
  workspaceID: string;
}

export type CreateWorkspaceComponentRequest = CreateWorkspaceComponentInput & {
  /**
   * 工作空间 ID
   */
  workspaceID: string;
};

export interface DeleteWorkspaceComponentRequest {
  /**
   * 工作空间 ID
   */
  workspaceID: string;
  /**
   * 组件名称
   */
  compName: string;
}

export type PatchWorkspaceComponentRequest = PatchWorkspaceComponentInput & {
  /**
   * 工作空间 ID
   */
  workspaceID: string;
  /**
   * 组件名称
   */
  compName: string;
};

export interface ListWorkspaceComponentsOutput {
  data?: WorkspaceComponentOutputObj[];
}

export interface CreateWorkspaceComponentInput {
  /**
   * 组件名称, 用户不传时后端自动生成
   */
  compName?: string;
  /**
   * 组件属性
   */
  properties?: Record<string, unknown>;
  /**
   * 组件生效的环境列表，当 scopeType 为 environment 时有效
   */
  scopeEnvNames?: string[];
  /**
   * 组件生效范围类型: global 或 environment
   */
  scopeType: "global" | "environment";
  /**
   * 组件类型，即组件在市场中的名字，等同于 ComponentDef 的 name
   */
  type: string;
  /**
   * 组件版本
   */
  version?: string;
}

export interface CreateWorkspaceComponentOutput {
  data?: WorkspaceComponentNameOutputObj;
}

export interface EmptyOutput {
}

export interface PatchWorkspaceComponentInput {
  /**
   * 修改组件名称
   */
  name?: string;
  /**
   * 组件属性
   */
  properties?: Record<string, unknown>;
  /**
   * 组件生效的环境列表
   */
  scopeEnvNames?: string[];
  /**
   * 组件生效范围类型
   */
  scopeType?: "global" | "environment";
}

export interface WorkspaceComponentNameOutputObj {
  name?: string;
}

export interface WorkspaceComponentOutputObj {
  /**
   * 创建时间
   */
  createdAt?: string;
  /**
   * 组件名称
   */
  name?: string;
  /**
   * 组件属性
   */
  properties?: Record<string, unknown>;
  /**
   * 标记哪些应用引用了该空间组件
   */
  refAppIDs?: string[];
  /**
   * 组件生效的环境列表
   */
  scopeEnvNames?: string[];
  /**
   * 组件生效范围类型
   */
  scopeType?: string;
  /**
   * 组件类型
   */
  type?: string;
  /**
   * 更新时间
   */
  updatedAt?: string;
  /**
   * 组件版本
   */
  version?: string;
  /**
   * 所属工作空间 ID
   */
  workspaceID?: string;
}
