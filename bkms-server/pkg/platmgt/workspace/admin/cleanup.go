package admin

import (
	"context"
	"time"

	"github.com/pkg/errors"

	log "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/logging"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/perm"
)

// systemUpdater 权限过期平台统一回收更新人。
const systemUpdater = "system"

// CleanupExpiredGrants 扫描并清理所有未回收且已过期的临时管理员授权记录。
func (s *Service) CleanupExpiredGrants(ctx context.Context) error {
	records, err := s.recordStore.ListExpiredGrants(ctx, time.Now())
	if err != nil {
		return err
	}

	var firstErr error
	scannedCount := len(records)
	expiredCount := len(records)
	cleanedCount := 0
	failedCount := 0
	for _, record := range records {
		if err := s.cleanupExpiredGrant(ctx, &record); err != nil {
			failedCount++
			log.Errorf(
				ctx,
				"cleanup expired workspace temp admin grant failed: workspaceID=%s username=%s expiresAt=%s err=%v",
				record.WorkspaceID,
				record.Username,
				record.ExpiresAt.Format(time.RFC3339),
				err,
			)
			if firstErr == nil {
				firstErr = err
			}
			continue
		}
		cleanedCount++
	}

	log.Infof(
		ctx, "workspace temp admin cleanup completed: scanned=%d expired=%d cleaned=%d failed=%d",
		scannedCount, expiredCount, cleanedCount, failedCount,
	)
	return firstErr
}

func (s *Service) cleanupExpiredGrant(ctx context.Context, record *WorkspaceTempAdmin) error {
	roleID, hasAdminRole, err := s.loadRoleState(ctx, record.WorkspaceID, perm.RoleCodeAdmin, record.Username)
	if err != nil {
		return errors.Wrap(err, "load admin role state")
	}

	if hasAdminRole {
		if err := s.permMgr.DeleteRoleForUsers(ctx, roleID, []string{record.Username}); err != nil {
			return errors.Wrap(err, "delete workspace admin role for user")
		}
	}

	record.IsRecycled = true
	record.Updater = systemUpdater
	if err := s.recordStore.Update(ctx, record); err != nil {
		return errors.Wrap(err, "update temp admin record as recycled")
	}
	return nil
}
