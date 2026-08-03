/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：account

export interface GetCurrentUserRequest {
}

export interface RefreshTokenRequest {
}

export interface CreateTokenRequest {
}

export interface ValidateTokenRequest {
}

export interface GetRoleRequest {
}

export interface GetRoleResponse {
  data?: RoleInfo;
}

export interface RoleInfo {
  /**
   * 当前用户的平台角色编码，没有平台角色时返回 null
   */
  platRoleCode?: RoleCode;
  /**
   * 当前登录用户名
   */
  username?: string;
}

export type RoleCode = "admin";
