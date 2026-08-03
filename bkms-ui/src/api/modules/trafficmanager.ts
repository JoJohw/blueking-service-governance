/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 手写兼容层：旧 `TrafficManagerService`。请改用新版模块方法；仍以 `/bkms/v1/trafficmanager` 调用。
 */
import type { Config } from '../interceptors';
import Fetch from '~/api/fetch';

const fetch = new Fetch({
  prefix: `${import.meta.env.BK_API_PREFIX}`,
});

export const TrafficManagerService = {
  /**
   * @deprecated 请改用新版模块方法；本服务仍以 `/bkms/v1/trafficmanager` 旧路径调用。
   */
  CreateTrafficLane: async (params?: any, config?: Config) =>
    await fetch.post('/bkms/v1/trafficmanager/trafficlanes')(params, config),
  /**
   * @deprecated 请改用新版模块方法；本服务仍以 `/bkms/v1/trafficmanager` 旧路径调用。
   */
  UpdateTrafficLane: async (params?: any, config?: Config) =>
    await fetch.put('/bkms/v1/trafficmanager/trafficlanes/{laneId}')(params, config),
  /**
   * @deprecated 请改用新版模块方法；本服务仍以 `/bkms/v1/trafficmanager` 旧路径调用。
   */
  UpdateTrafficLaneServicesStatus: async (params?: any, config?: Config) =>
    await fetch.put('/bkms/v1/trafficmanager/trafficlanes/{laneId}/services/status')(params, config),
  /**
   * @deprecated 请改用新版模块方法；本服务仍以 `/bkms/v1/trafficmanager` 旧路径调用。
   */
  DeleteTrafficLane: async (params?: any, config?: Config) =>
    await fetch.delete('/bkms/v1/trafficmanager/trafficlanes/{laneId}')(params, config),
  /**
   * @deprecated 请改用新版模块方法；本服务仍以 `/bkms/v1/trafficmanager` 旧路径调用。
   */
  ListTrafficLane: async (params?: any, config?: Config) =>
    await fetch.get('/bkms/v1/trafficmanager/trafficlanes')(params, config),
};
