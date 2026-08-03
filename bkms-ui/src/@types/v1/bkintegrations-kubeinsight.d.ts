/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：bkintegrations-kubeinsight

export interface GetLatestEnvReportRequest {
  /**
   * 环境 ID
   */
  envID: string;
  /**
   * 是否生成 PDF
   */
  generatePDF?: boolean;
}

export interface GetLatestEnvReportOutput {
  data?: ClusterReportOutput;
}

export interface ClusterReportOutput {
  abnormalItems?: CheckItemOutput[];
  clusterID?: string;
  clusterInfo?: ClusterInfoOutput;
  endTime?: string;
  pdfData?: number[];
  score?: number;
  startTime?: string;
}

export interface CheckItemOutput {
  category?: string;
  contextMsg?: string;
  description?: string;
  errorDetail?: string;
  key?: string;
  lastUpdateTimestamp?: string;
  level?: string;
  recordCount?: number;
  recovered?: boolean;
  resourceKey?: string;
  resourceType?: string;
  solutions?: string;
  timestamp?: string;
}

export interface ClusterInfoOutput {
  businessID?: string;
  clusterID?: string;
  clusterName?: string;
  clusterType?: string;
  clusterVersion?: string;
  creator?: string;
  manageType?: string;
  masterCount?: number;
  networkParams?: NetworkParamsOutput;
  nodeCount?: number;
  osRuntimeInfo?: OSRuntimeInfoOutput;
  projectID?: string;
  provider?: string;
  region?: string;
  vpcID?: string;
}

export interface NetworkParamsOutput {
  cidrs?: string[];
  maxNodePodNum?: number;
  maxServiceNum?: number;
}

export interface OSRuntimeInfoOutput {
  osImage?: string;
  runtime?: string;
  runtimeVersion?: string;
}
