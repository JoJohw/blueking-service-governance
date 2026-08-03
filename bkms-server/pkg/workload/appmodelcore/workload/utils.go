package workload

import (
	"github.com/pkg/errors"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// AppendAsUnstructured appends any kubernetes resources to the given unstructured objects slice.
func AppendAsUnstructured(
	items []unstructured.Unstructured,
	inputObjs ...client.Object,
) ([]unstructured.Unstructured, error) {
	for _, input := range inputObjs {
		obj, err := runtime.DefaultUnstructuredConverter.ToUnstructured(input)
		if err != nil {
			return nil, errors.Wrapf(err, "converting %s to unstructured", input.GetName())
		}
		items = append(items, unstructured.Unstructured{Object: obj})
	}
	return items, nil
}
