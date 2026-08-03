// Package bkmonitor api client，如：蓝鲸监控的 apm、蓝鲸监控的 metadata
package bkmonitor

import (
	"sync"

	"github.com/go-playground/validator/v10"
	"github.com/pkg/errors"
)

var (
	validateOnce sync.Once

	validate *validator.Validate
)

func init() {
	validateOnce.Do(func() {
		validate = validator.New(validator.WithRequiredStructEnabled())
	})
}

// Validate 通用校验方法
func Validate(v any) error {
	if v == nil {
		return errors.New("request is nil")
	}
	return validate.Struct(v)
}

// Validate 校验创建 APM 应用请求参数
func (r *CreateApmAppReq) Validate() error {
	if err := Validate(r); err != nil {
		return err
	}

	if len(r.AppName) > 50 {
		return errors.New("app_name length must be less than 50")
	}

	return nil
}

// Validate 校验获取 APM 应用请求参数
func (r *GetApmAppReq) Validate() error {
	if err := Validate(r); err != nil {
		return err
	}

	// app_name 或 application_id 至少填一个
	if r.AppName == "" && r.ApmAppID <= 0 {
		return errors.New("app_name or application_id is required")
	}

	return nil
}

// Validate 校验查询告警组列表请求参数。
// 旧网关要求 ids 与 name 至少提供一个；新网关支持仅用 bk_biz_ids 列表查询，
// 因此旧网关调用应显式走该方法，新网关继续只走通用 Validate。
func (r *SearchUserGroupsReq) Validate() error {
	// ids 与 name 不能同时为空
	if len(r.IDs) == 0 && r.Name == "" {
		return errors.New("ids or name is required")
	}
	return Validate(r)
}

// Validate 校验统一时序数据查询请求参数
func (r *TimeSeriesUnifyQueryReq) Validate() error {
	if err := Validate(r); err != nil {
		return err
	}
	// 在监控时序数据查询场景中，必须是 StartTime <= EndTime
	if r.StartTime > r.EndTime {
		return errors.New("start_time must be less than or equal to end_time")
	}
	return nil
}
