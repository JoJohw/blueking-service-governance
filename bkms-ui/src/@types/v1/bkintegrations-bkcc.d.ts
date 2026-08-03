/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：bkintegrations-bkcc

export interface ListBKCCAuthorizedBusinessesRequest {
}

export interface ListBKCCAuthorizedBusinessesOutput {
  data?: BusinessInfoOutput[];
}

export interface BusinessInfoOutput {
  bizID?: string;
  bizName?: string;
  level1BizID?: string;
  level1BizName?: string;
  level2BizID?: string;
  level2BizName?: string;
  obsProductID?: string;
  obsProductName?: string;
}
