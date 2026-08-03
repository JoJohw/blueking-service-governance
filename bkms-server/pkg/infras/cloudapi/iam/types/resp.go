package types

// Resp IAM 网关标准返回
type Resp struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data"`
}

// CreateUserGroupsResp 创建用户组返回结果
type CreateUserGroupsResp struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    []int  `json:"data"`
}

// GradeManager 分级管理员
type GradeManager struct {
	ID          int `mapstructure:"id"`
	Name        string
	Description string
}

// GradeManagerData 分级管理员查询结果数据
type GradeManagerData struct {
	Count   int            `mapstructure:"count"`
	Results []GradeManager `mapstructure:"results"`
}

// UserGroup 用户组
type UserGroup struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	// Readonly 用户组是否只读. 设置为 True 后，分级管理员无法在权限中心产品上删除该用户组
	Readonly bool `json:"readonly"`
}

// UserMember 用户组成员
type UserMember struct {
	Type      string `mapstructure:"type"`
	ID        string `mapstructure:"id"`
	ExpiredAt int    `mapstructure:"expired_at"`
}

// UserMemberData 用户组成员查询结果数据
type UserMemberData struct {
	Count   int          `mapstructure:"count"`
	Results []UserMember `mapstructure:"results"`
}
