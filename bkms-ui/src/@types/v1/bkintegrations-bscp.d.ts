/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：bkintegrations-bscp

export interface ListBSCPBizsRequest {
}

export interface ListBSCPServicesRequest {
  /**
   * BSCP 业务 ID
   */
  bizID: string;
}

export interface ListBSCPConfigsRequest {
  /**
   * BSCP 业务 ID
   */
  bizID: string;
  /**
   * BSCP 服务 ID
   */
  serviceID: string;
}

export interface GetBSCPConfigRequest {
  /**
   * BSCP 业务 ID
   */
  bizID: string;
  /**
   * BSCP 服务 ID
   */
  serviceID: string;
  /**
   * BSCP 配置项 ID
   */
  configID: string;
}

export interface ListBSCPBizsOutput {
  data?: BSCPBizOutput[];
}

export interface ListBSCPServicesOutput {
  data?: BSCPServiceOutput[];
}

export interface ListBSCPConfigsOutput {
  data?: BSCPConfigOutput[];
}

export interface GetBSCPConfigOutput {
  data?: BSCPConfigDetailOutput;
}

export interface BSCPConfigDetailOutput {
  bizID?: string;
  bizName?: string;
  content?: string;
  desc?: string;
  id?: string;
  name?: string;
  serviceAlias?: string;
  serviceID?: string;
  serviceName?: string;
  type?: string;
  versionID?: string;
  versionName?: string;
}

export interface BSCPConfigOutput {
  desc?: string;
  id?: string;
  name?: string;
  type?: string;
}

export interface BSCPServiceOutput {
  alias?: string;
  id?: string;
  name?: string;
}

export interface BSCPBizOutput {
  id?: string;
  name?: string;
}
