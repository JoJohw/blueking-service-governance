// Package bscp api client，BSCP 服务 API 入参校验
package bscp

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

// Validate 校验创建 BSCP 服务请求
func (r *CreateServiceReq) Validate() error {
	if err := Validate(r); err != nil {
		return err
	}

	switch r.ConfigType {
	case ConfigTypeFile, ConfigTypeKV:
	default:
		return errors.Errorf("invalid config_type: %s", r.ConfigType)
	}

	switch r.DataType {
	case DataTypeAny, DataTypeString, DataTypeNumber, DataTypeText,
		DataTypeJSON, DataTypeXML, DataTypeYAML, DataTypeSecret:
	default:
		return errors.Errorf("invalid data_type: %s", r.DataType)
	}

	if !r.IsApprove {
		return nil
	}

	// 审批校验 仅在 IsApprove=true 时生效
	switch r.ApproveType {
	case ApproveTypeCountSign, ApproveTypeOrSign:
	default:
		return errors.Errorf("invalid approve_type: %s", r.ApproveType)
	}

	if r.Approver == "" {
		return errors.New("approver is required when is_approve is true")
	}

	return nil
}
