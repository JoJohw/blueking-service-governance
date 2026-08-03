package portforward

import (
	"context"

	"github.com/stretchr/testify/mock"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

// MockPodClient 是 PodClient 接口的 mock 实现。
type MockPodClient struct {
	mock.Mock
}

func (m *MockPodClient) Get(
	ctx context.Context,
	namespace, name string,
	opts metav1.GetOptions,
) (*unstructured.Unstructured, error) {
	args := m.Called(ctx, namespace, name, opts)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*unstructured.Unstructured), args.Error(1)
}

func (m *MockPodClient) List(
	ctx context.Context,
	namespace string,
	opts metav1.ListOptions,
) (*unstructured.UnstructuredList, error) {
	args := m.Called(ctx, namespace, opts)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*unstructured.UnstructuredList), args.Error(1)
}
