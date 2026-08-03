/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：arrangement

export interface ListPlaceholderVarsRequest {
}

export interface ListPlaceholderVarsOutput {
  data?: PlaceholderVarOutputObj[];
}

export interface PlaceholderVarOutputObj {
  /**
   * 占位符变量的描述信息
   */
  description?: string;
  /**
   * 占位符变量的 key, 如 IMAGE, IMAGE_TAG 等
   */
  key?: string;
}
