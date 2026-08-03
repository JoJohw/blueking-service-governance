package component

import (
	"encoding/json"

	tkex "github.com/Tencent/bk-bcs/bcs-scenarios/kourse/pkg/apis/tkex/v1alpha1"
	"github.com/pkg/errors"
	"k8s.io/apimachinery/pkg/util/strategicpatch"
)

// ApplyGameDeploymentPatchers applies root patchers in array order using Strategic Merge Patch.
func ApplyGameDeploymentPatchers(
	gameDeployment tkex.GameDeployment,
	patchers []map[string]any,
) (tkex.GameDeployment, error) {
	current, err := json.Marshal(gameDeployment)
	if err != nil {
		return gameDeployment, errors.Wrap(err, "marshaling GameDeployment")
	}
	for index, patcher := range patchers {
		patch, marshalErr := json.Marshal(patcher)
		if marshalErr != nil {
			return gameDeployment, errors.Wrapf(marshalErr, "marshaling patcher[%d]", index)
		}
		current, err = strategicpatch.StrategicMergePatch(current, patch, gameDeployment)
		if err != nil {
			return gameDeployment, errors.Wrapf(err, "applying patcher[%d]", index)
		}
	}

	var result tkex.GameDeployment
	if err = json.Unmarshal(current, &result); err != nil {
		return gameDeployment, errors.Wrap(err, "unmarshaling patched GameDeployment")
	}
	return result, nil
}
