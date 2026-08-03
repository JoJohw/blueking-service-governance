/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：app-components

export type CreateAppComponentRequest = CreateAppComponentInput & {
  /**
   * 应用 ID
   */
  appID: string;
};

export interface DeleteAppComponentRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 组件名称
   */
  compName: string;
}

export type PatchAppComponentRequest = PatchAppComponentInput & {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 组件名称
   */
  compName: string;
};

export interface CreateAppComponentInput {
  /**
   * 组件名称, 用户不传时后端自动生成
   */
  compName?: string;
  /**
   * 组件属性
   */
  properties?: Record<string, unknown>;
  /**
   * 引用的空间组件名称，传入时将忽略 type/version/properties 字段
   */
  refWorkspaceCompName?: string;
  /**
   * 组件类型，即组件在市场中的名字，等同于 ComponentDef 的 name
   */
  type?: string;
  /**
   * 组件版本
   */
  version?: string;
}

export interface CreateAppComponentOutput {
  data?: AppComponentNameOutputObj;
}

export interface EmptyOutput {
}

export interface PatchAppComponentInput {
  /**
   * 修改组件名称
   */
  name?: string;
  /**
   * 组件属性
   */
  properties?: Record<string, unknown>;
}

export interface AppComponentNameOutputObj {
  name?: string;
}
