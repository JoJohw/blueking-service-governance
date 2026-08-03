package perm

const (
	// 对应蓝鲸 IAM 中的 RoleCode 取值

	// RoleCodeAdmin 管理员
	RoleCodeAdmin = "admin"
	// RoleCodeSre SRE
	RoleCodeSre = "sre"
	// RoleCodeDeveloper 开发者
	RoleCodeDeveloper = "developer"
	// RoleCodeOperator 运营者
	RoleCodeOperator = "operator"
)

// RoleCodes return all valid role codes
func RoleCodes() []string {
	return []string{
		RoleCodeAdmin,
		RoleCodeSre,
		RoleCodeDeveloper,
		RoleCodeOperator,
	}
}
