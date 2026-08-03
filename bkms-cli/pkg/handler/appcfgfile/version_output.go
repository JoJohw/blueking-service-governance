package appcfgfile

import (
	"github.com/jinzhu/copier"
	"github.com/pkg/errors"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
)

// VersionOutput is the structured output object for app config file version data.
type VersionOutput struct {
	// 基础字段
	Name            string `json:"name" yaml:"name"`
	ID              string `json:"id" yaml:"id"`
	AppConfigFileID string `json:"appConfigFileID" yaml:"appConfigFileID"`
	EnvName         string `json:"envName" yaml:"envName"`
	Type            string `json:"type" yaml:"type"`
	Description     string `json:"description" yaml:"description"`
	// 版本相关字段
	Version             int64  `json:"version" yaml:"version"`
	BaseVersion         *int64 `json:"baseVersion,omitempty" yaml:"baseVersion,omitempty" table:"-"`
	RollbackFromVersion *int64 `json:"rollbackFromVersion,omitempty" yaml:"rollbackFromVersion,omitempty" table:"-"`
	OperationType       string `json:"operationType" yaml:"operationType"`
	// 内容相关字段
	Content        *string `json:"content,omitempty" yaml:"content,omitempty" table:"-"`
	OverlayContent *string `json:"overlayContent,omitempty" yaml:"overlayContent,omitempty" table:"-"`
}

func toVersionOutput(version client.AppConfigFileVersion) (VersionOutput, error) {
	output := VersionOutput{}
	if err := copier.Copy(&output, &version); err != nil {
		return VersionOutput{}, errors.Wrap(err, "copy app config file version output")
	}

	output.EnvName = formatEnvName(version.EnvName)
	return output, nil
}
