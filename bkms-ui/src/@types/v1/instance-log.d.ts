/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：instance-log

export interface DownloadAppInstanceLogsRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * 部署环境名称
   */
  envName: string;
  /**
   * 实例 ID
   */
  instanceID: string;
  /**
   * 部署的泳道名称（空字符串表示不使用泳道）
   */
  trafficLaneName?: string;
  /**
   * 是否获取重启前日志
   */
  previous?: boolean;
}
