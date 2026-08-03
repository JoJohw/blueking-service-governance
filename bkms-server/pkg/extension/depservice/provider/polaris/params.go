package polaris

import (
	"github.com/go-playground/validator/v10"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/depservice/provider/types"
)

var validate = validator.New(validator.WithRequiredStructEnabled())

// compile-time check
var (
	_ types.ProvisionParams = (*CreateParams)(nil)
)

// CreateParams 创建北极星服务实例所需的参数
type CreateParams struct {
	PolarisName      string `mapstructure:"polarisName" validate:"required"`
	PolarisNamespace string `mapstructure:"polarisNamespace" validate:"required"`
	Owners           string `mapstructure:"Owners"`
}

// Validate 使用 validator 校验 CreateParams 中所有必填字段是否已设置
func (p *CreateParams) Validate() error {
	return validate.Struct(p)
}

// InstConfig 北极星服务实例配置
type InstConfig struct {
	PolarisName      string `mapstructure:"polarisName" validate:"required"`
	PolarisNamespace string `mapstructure:"polarisNamespace" validate:"required"`
	Token            string `mapstructure:"token" validate:"required"`
}

// Validate 使用 validator 校验 InstConfig 中所有必填字段是否已设置
func (c *InstConfig) Validate() error {
	return validate.Struct(c)
}

// ParseInstConfig 从 map 中解析北极星实例配置
func ParseInstConfig(raw map[string]any) (*InstConfig, error) {
	return types.ParseInstConfig[InstConfig](raw)
}

// Credentials 北极星服务实例的凭证信息
type Credentials struct {
	Token string `mapstructure:"token"`
}

// ParseCredentials 从 map 中解析北极星凭证
func ParseCredentials(raw map[string]any) (*Credentials, error) {
	return types.ParseInstConfig[Credentials](raw)
}
