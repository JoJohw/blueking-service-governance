package autodeploy

import (
	"context"
	"time"

	"github.com/pkg/errors"
)

// Operator 封装 build auto deploy 记录的 db 操作
type Operator struct {
	store RecordStore
}

// Locator 描述需要更新的记录定位条件
type Locator struct {
	AppID    string
	BuildID  string
	DeployID string
}

// StatusPatch 描述状态字段更新内容
type StatusPatch struct {
	Stage    Stage
	Status   string
	Message  string
	DeployID *string
	EndedAt  *time.Time
}

// NewOperator 创建 Operator
func NewOperator(store RecordStore) (*Operator, error) {
	if store == nil {
		return nil, errors.New("build auto deploy record store is nil")
	}
	return &Operator{store: store}, nil
}

// GetByBuildID 根据 buildID 获取记录
func (u *Operator) GetByBuildID(ctx context.Context, appID, buildID string) (*Record, error) {
	return u.store.GetByBuildID(ctx, appID, buildID)
}

// UpdateStatus 更新 build auto deploy 记录状态
func (u *Operator) UpdateStatus(ctx context.Context, locator Locator, patch StatusPatch) error {
	record, err := u.getRecord(ctx, locator)
	if err != nil {
		return err
	}
	record.Stage = patch.Stage
	record.Status = patch.Status
	record.Message = patch.Message
	if patch.DeployID != nil {
		record.DeployID = *patch.DeployID
	}
	if patch.EndedAt != nil {
		record.EndedAt = *patch.EndedAt
	}
	return u.store.Update(ctx, record)
}

func (u *Operator) getRecord(ctx context.Context, locator Locator) (*Record, error) {
	if locator.AppID == "" {
		return nil, errors.New("appID is required")
	}
	hasBuildID := locator.BuildID != ""
	hasDeployID := locator.DeployID != ""
	if hasBuildID == hasDeployID {
		return nil, errors.New("exactly one of buildID or deployID is required")
	}
	if hasBuildID {
		return u.store.GetByBuildID(ctx, locator.AppID, locator.BuildID)
	}
	return u.store.GetByDeployID(ctx, locator.AppID, locator.DeployID)
}
