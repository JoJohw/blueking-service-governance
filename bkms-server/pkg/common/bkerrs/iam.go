package bkerrs

import (
	"context"

	"github.com/spf13/cast"

	log "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/logging"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/perm"
)

// WrapIAMNoPermission 包装为 IAM 无权限错误
func WrapIAMNoPermission(err error, workspaceID, msg string) error {
	wrappedErr := Wrap(err, ErrCodeIAMNoPermission, msg)

	// 尝试获取工作空间对应的用户组信息
	ctx := context.Background()
	roles, err := perm.NewManager().ListRoles(ctx, workspaceID)
	// 若获取角色失败，则不会追加用户组信息，直接返回包装好的错误即可
	if err != nil {
		log.Errorf(ctx, "failed to list roles for workspace %s: %v", workspaceID, err)
		return wrappedErr
	}

	// 用户组角色（如：admin）-> 权限中心用户组 ID
	roleCodeToUserGroupIDMap := map[string]string{}
	for _, role := range roles {
		roleCodeToUserGroupIDMap[role.RoleCode] = cast.ToString(role.UserGroupID)
	}
	return wrappedErr.SetDetails(
		NewDetail(
			ErrDetailCodeIAMNoPermission,
			"should apply iam user group for permissions",
			WithExtras(roleCodeToUserGroupIDMap),
		),
	)
}
