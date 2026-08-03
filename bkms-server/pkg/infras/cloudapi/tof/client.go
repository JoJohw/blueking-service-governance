package tof

import "context"

// Client TOF API 客户端接口
//
// 抽象出接口以便 facade 依赖抽象而非具体实现：未注册具体实现时，
// factory 会 fallback 到 noopClient。
type Client interface {
	// GetStaffInfo 获取员工信息
	GetStaffInfo(ctx context.Context, username string) (*StaffInfo, error)

	// GetDeptInfo 获取指定部门信息
	GetDeptInfo(ctx context.Context, deptID string) (*DeptInfo, error)

	// GetParentDeptInfos 获取指定部门的所有父部门信息
	GetParentDeptInfos(ctx context.Context, deptID string) ([]DeptInfo, error)
}
