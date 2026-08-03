package tof

// 组织架构类型
type orgStructureType int

const (
	// OstCompany 公司
	OstCompany orgStructureType = 0
	// OstDept 部门
	OstDept orgStructureType = 1
	// OstGroup 小组
	OstGroup orgStructureType = 2
	// OstBG 事业群
	OstBG orgStructureType = 6
	// OstCenter 中心
	OstCenter orgStructureType = 7
)

// Organization 组织架构
type Organization struct {
	BgID      string
	BgName    string
	DeptID    string
	DeptName  string
	GroupID   string
	GroupName string
}

// StaffInfo 员工信息
type StaffInfo struct {
	DeptID    string
	DeptName  string
	GroupID   string
	GroupName string
}

// DeptInfo 部门信息
type DeptInfo struct {
	TypeID string
	ID     string
	Name   string
}
