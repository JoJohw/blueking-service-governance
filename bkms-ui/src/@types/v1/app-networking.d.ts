/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：app-networking

export interface ListAppServicesRequest {
  /**
   * 应用 ID
   */
  appID: string;
}

export type CreateAppServiceRequest = CreateAppServiceInput & {
  /**
   * 应用 ID
   */
  appID: string;
};

export type UpdateAppServiceRequest = UpdateAppServiceInput & {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * Service 名称
   */
  name: string;
};

export interface DeleteAppServiceRequest {
  /**
   * 应用 ID
   */
  appID: string;
  /**
   * Service 名称
   */
  name: string;
}

export interface ListTrafficLaneCandidateAppsRequest {
  /**
   * 工作空间 ID
   */
  workspaceID: string;
}

export interface ListAppServicesOutput {
  data?: AppServiceOutput[];
}

export interface CreateAppServiceInput {
  name: string;
  ports?: ServicePortInput[];
  selector?: Record<string, string>;
  trafficLaneEnabled?: boolean;
}

export interface EmptyOutput {
}

export interface UpdateAppServiceInput {
  ports?: ServicePortInput[];
  selector?: Record<string, string>;
  trafficLaneEnabled?: boolean;
}

export interface ListTrafficLaneCandidateAppsOutput {
  data?: TrafficLaneCandidateAppOutput[];
}

export interface TrafficLaneCandidateAppOutput {
  appName?: string;
  services?: CandidateAppServiceOutput[];
}

export interface CandidateAppServiceOutput {
  name?: string;
  trafficLaneEnabled?: boolean;
}

export interface ServicePortInput {
  name: string;
  port?: number;
  protocol?: string;
  targetPort?: string;
}

export interface AppServiceOutput {
  createdAt?: string;
  name?: string;
  ports?: ServicePortOutput[];
  selector?: Record<string, string>;
  trafficLaneEnabled?: boolean;
  updatedAt?: string;
}

export interface ServicePortOutput {
  name?: string;
  port?: number;
  protocol?: string;
  targetPort?: string;
}
