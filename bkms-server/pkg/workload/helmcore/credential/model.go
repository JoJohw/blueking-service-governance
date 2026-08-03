package credential

// HelmRepoCredential Helm 仓库凭证
type HelmRepoCredential struct {
	// WorkspaceID 工作空间 ID
	WorkspaceID string `bson:"workspaceID"`
	// CredentialID 蓝盾凭证 ID（固定值 bkms_helm_repo_credential）
	CredentialID string `bson:"credentialID"`
	// Username bkrepo 用户名
	Username string `bson:"username"`
	// Password bkrepo 密码（对称加密存储）
	Password string `bson:"password"`
}
