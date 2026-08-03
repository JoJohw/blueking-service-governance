// Package credential 提供 Helm 仓库凭证管理功能
package credential

import (
	"context"

	"github.com/pkg/errors"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/account/auth"
	bkciapi "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/bkci"
)

// helmRepoCredentialID Helm 仓库凭证 ID（固定值，所有工作空间使用相同名称，蓝盾凭证管理按项目隔离）
const helmRepoCredentialID = "bkms_helm_repo_credential" // #nosec G101

// helmRepoCredentialDescription Helm 仓库凭证描述
const helmRepoCredentialDescription = "bkms helm repo credential (system-bkrepo)" // #nosec G101

// EnsureCredential 幂等初始化 Helm 仓库凭证
// 流程：查询本地 DB → 有记录则跳过 → 无记录则调用蓝盾 API 创建凭证 → 写入本地 DB
func EnsureCredential(
	ctx context.Context,
	store HelmRepoCredentialStore,
	workspaceID, bkciProjectCode, username, password string,
) error {
	// 1. 查询本地 DB，确认是否已有该工作空间的凭证记录
	if _, err := store.GetByWorkspace(ctx, workspaceID); err == nil {
		// 凭证已存在，直接跳过
		return nil
	} else if !errors.Is(err, ErrHelmRepoCredentialNotFound) {
		return errors.Wrap(err, "check helm repo credential existence")
	}

	// 2. 本地 DB 无记录，调用蓝盾 API 创建凭证
	client, err := bkciapi.New(auth.MustGetUser(ctx))
	if err != nil {
		return errors.Wrap(err, "create bkci client")
	}
	if err = client.CreateCredential(
		ctx, bkciProjectCode, helmRepoCredentialID, helmRepoCredentialDescription, username, password,
	); err != nil {
		return errors.Wrap(err, "create bkci helm repo credential")
	}

	// 3. 将凭证信息写入本地 DB
	cred := &HelmRepoCredential{
		WorkspaceID:  workspaceID,
		CredentialID: helmRepoCredentialID,
		Username:     username,
		Password:     password,
	}
	if err = store.Create(ctx, cred); err != nil {
		return errors.Wrap(err, "save helm repo credential to db")
	}

	return nil
}
