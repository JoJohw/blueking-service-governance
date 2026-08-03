package workload

import (
	"github.com/pkg/errors"
	corev1 "k8s.io/api/core/v1"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appmodel"
)

// buildLifecycle builds a Kubernetes Lifecycle object from the given appmodel.Lifecycle.
func buildLifecycle(lifecycle *appmodel.Lifecycle) (*corev1.Lifecycle, error) {
	if lifecycle == nil {
		return nil, nil
	}

	preStop, err := buildLifecycleHandler(lifecycle.PreStop)
	if err != nil {
		return nil, errors.Wrap(err, "building preStop")
	}
	postStart, err := buildLifecycleHandler(lifecycle.PostStart)
	if err != nil {
		return nil, errors.Wrap(err, "building postStart")
	}

	if preStop == nil && postStart == nil {
		return nil, nil
	}

	return &corev1.Lifecycle{
		PreStop:   preStop,
		PostStart: postStart,
	}, nil
}

func buildLifecycleHandler(handler *appmodel.LifecycleHandler) (*corev1.LifecycleHandler, error) {
	if handler == nil {
		return nil, nil
	}

	switch handler.Type {
	case appmodel.LifecycleTypeExec:
		if handler.ExecAction == nil {
			return nil, errors.New("lifecycle handler exec action is required")
		}
		command, err := buildExecCommand(handler.ExecAction)
		if err != nil {
			return nil, err
		}
		return &corev1.LifecycleHandler{
			Exec: &corev1.ExecAction{Command: command},
		}, nil
	case appmodel.LifecycleTypeHTTP:
		if handler.HTTPGetAction == nil {
			return nil, errors.New("lifecycle handler httpGet action is required")
		}
		httpGet, err := buildHTTPGetAction(handler.HTTPGetAction)
		if err != nil {
			return nil, err
		}
		return &corev1.LifecycleHandler{HTTPGet: httpGet}, nil
	default:
		return nil, errors.Errorf("unknown lifecycle handler type %q", handler.Type)
	}
}
