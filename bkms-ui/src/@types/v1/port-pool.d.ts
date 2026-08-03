/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：port-pool

export interface ListPortPoolsRequest {
  /**
   * 环境 ID
   */
  envID: string;
}

export type CreatePortPoolRequest = CreatePortPoolInput & {
  /**
   * 环境 ID
   */
  envID: string;
};

export type UpdatePortPoolRequest = UpdatePortPoolInput & {
  /**
   * 环境 ID
   */
  envID: string;
  /**
   * 端口池名称
   */
  name: string;
};

export interface DeletePortPoolRequest {
  /**
   * 环境 ID
   */
  envID: string;
  /**
   * 端口池名称
   */
  name: string;
}

export interface ListPortPoolsOutput {
  /**
   * 端口池列表
   */
  data?: PortPoolConfigOutputObj[];
}

export interface CreatePortPoolInput {
  /**
   * 端口池名称，需符合 k8s 命名规范
   */
  name: string;
  /**
   * 端口池 item 列表
   */
  poolItems: PortPoolItemInput[];
}

export interface UpdatePortPoolInput {
  /**
   * 完整的 poolItem 列表，全量替换
   */
  poolItems: PortPoolItemInput[];
}

export interface PortPoolItemInput {
  /**
   * 结束端口，端口范围是左闭右开区间，即 [startPort, endPort)
   */
  endPort: number;
  /**
   * 扩展字段(透传到业务)
   */
  external?: string;
  /**
   * 端口池 item 名称，新增时不填则自动生成
   */
  itemName?: string;
  /**
   * 负载均衡 ID 列表
   */
  loadBalancerIDs: string[];
  /**
   * 端口池的协议，不填则默认同时支持 TCP 和 UDP
   */
  protocol?: string;
  /**
   * 端口段长度
   */
  segmentLength?: number;
  /**
   * 起始端口
   */
  startPort: number;
}

export interface PortPoolConfigOutputObj {
  /**
   * 所属环境 ID
   */
  envID?: string;
  /**
   * 配置名称
   */
  name?: string;
  /**
   * 端口池 item 列表
   */
  poolItems?: PortPoolItemOutput[];
  /**
   * 端口池整体状态 [Ready, NotReady, Deleting]
   */
  status?: string;
}

export interface PortPoolItemOutput {
  /**
   * 结束端口
   */
  endPort?: number;
  /**
   * 扩展字段(透传到业务)
   */
  external?: string;
  /**
   * 端口池 item 名称
   */
  itemName?: string;
  /**
   * 负载均衡 ID 列表
   */
  loadBalancerIDs?: string[];
  /**
   * item 状态
   */
  poolItemStatus?: PoolItemStatusOutput;
  /**
   * 端口池的协议
   */
  protocol?: string;
  /**
   * 端口段长度
   */
  segmentLength?: number;
  /**
   * 起始端口
   */
  startPort?: number;
}

export interface PoolItemStatusOutput {
  /**
   * item 状态信息
   */
  message?: string;
  /**
   * item 状态
   */
  status?: string;
}
