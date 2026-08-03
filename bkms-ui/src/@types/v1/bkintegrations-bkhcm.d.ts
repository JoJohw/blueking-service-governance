/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：bkintegrations-bkhcm

export type ListBkHCMSubnetsRequest = BkHCMListInput & {
  /**
   * 业务 ID
   */
  bkBizID: number;
};

export type ListBkHCMVPCsRequest = BkHCMListInput & {
  /**
   * 业务 ID
   */
  bkBizID: number;
};

export type CreateBkHCMLoadBalancerApplicationRequest = BkHCMCreateLoadBalancerInput;

export type ListBkHCMRegionsRequest = BkHCMListInput;

export type ListBkHCMZonesRequest = BkHCMListInput & {
  /**
   * 地域 ID
   */
  region: string;
};

export interface BkHCMListInput {
  filter?: Filter;
  page: Page;
}

export interface ListBkHCMSubnetsOutput {
  data?: SubnetOutput[];
}

export interface ListBkHCMVPCsOutput {
  data?: VPCOutput[];
}

export interface BkHCMCreateLoadBalancerInput {
  account_id: string;
  address_ip_version?: string;
  auto_renew?: boolean;
  backup_zones?: string[];
  bandwidth_package_id?: string;
  bandwidthpkg_sub_type?: string;
  bk_biz_id: number;
  cloud_eip_id?: string;
  cloud_subnet_id?: string;
  cloud_vpc_id: string;
  internet_charge_type?: string;
  internet_max_bandwidth_out?: number;
  load_balancer_pass_to_target?: boolean;
  load_balancer_type: string;
  memo?: string;
  name: string;
  region: string;
  remark?: string;
  require_count: number;
  sla_type?: string;
  tgw_group_name?: string;
  vip?: string;
  vip_isp?: string;
  zhi_tong?: boolean;
  zones?: string[];
}

export interface CreateBkHCMLoadBalancerOutput {
  data?: CreateBkHCMLoadBalancerData;
}

export interface ListBkHCMRegionsOutput {
  data?: RegionOutput[];
}

export interface ListBkHCMZonesOutput {
  data?: ZoneOutput[];
}

export interface ZoneOutput {
  cloud_id?: string;
  id?: string;
  name?: string;
  name_cn?: string;
  region?: string;
  state?: string;
  vendor?: string;
}

export interface RegionOutput {
  id?: string;
  region_id?: string;
  region_name?: string;
  status?: string;
  vendor?: string;
}

export interface CreateBkHCMLoadBalancerData {
  id?: string;
}

export interface VPCOutput {
  account_id?: string;
  bk_biz_id?: number;
  category?: string;
  cloud_id?: string;
  extension?: Record<string, unknown>;
  id?: string;
  memo?: string;
  name?: string;
  region?: string;
  vendor?: string;
}

export interface SubnetOutput {
  account_id?: string;
  bk_biz_id?: number;
  cloud_id?: string;
  cloud_vpc_id?: string;
  id?: string;
  ipv4_cidr?: string[];
  ipv6_cidr?: string[];
  memo?: string;
  name?: string;
  region?: string;
  vendor?: string;
  vpc_id?: string;
  zone?: string;
}

export interface Filter {
  op?: string;
  rules?: FilterRule[];
}

export interface Page {
  count?: boolean;
  limit?: number;
  order?: string;
  sort?: string;
  start?: number;
}

export interface FilterRule {
  field?: string;
  op?: string;
  value?: unknown;
}
