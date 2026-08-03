package tof

import "context"

// noopClient 是 TOF Client 的默认空实现
//
// 在未配置可用 TOF 服务时使用，所有查询均返回空值。上层 facade
// GetUserOrganization 会据此返回空组织，CreateProject 对空组织信息天然容忍。
type noopClient struct{}

// 编译期确认 noopClient 实现 Client 接口
var _ Client = noopClient{}

// newNoopClient 创建 noopClient
func newNoopClient() Client {
	return noopClient{}
}

// GetStaffInfo 空实现，返回空员工信息
func (noopClient) GetStaffInfo(_ context.Context, _ string) (*StaffInfo, error) {
	return &StaffInfo{}, nil
}

// GetDeptInfo 空实现，返回空部门信息
func (noopClient) GetDeptInfo(_ context.Context, _ string) (*DeptInfo, error) {
	return &DeptInfo{}, nil
}

// GetParentDeptInfos 空实现，返回空父部门列表
func (noopClient) GetParentDeptInfos(_ context.Context, _ string) ([]DeptInfo, error) {
	return nil, nil
}
