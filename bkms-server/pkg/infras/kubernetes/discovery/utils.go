package discovery

import (
	"fmt"
	"strings"

	"github.com/pkg/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/cache"
)

// ErrKindNotFound 目标资源类型（Kind）在集群中未注册。
var ErrKindNotFound = errors.New("kind not found in cluster")

// filterResByKind 根据 kind 过滤出对应的资源信息
func filterResByKind(kind string, allRes []*metav1.APIResourceList) (*schema.GroupVersionResource, error) {
	for _, apiResList := range allRes {
		for _, res := range apiResList.APIResources {
			if res.Kind == kind {
				// 可能存在如 v1 这种只有 version，group 为空的情况
				group, ver := "", apiResList.GroupVersion
				if strings.Contains(apiResList.GroupVersion, "/") {
					group, ver, _ = strings.Cut(apiResList.GroupVersion, "/")
				}
				return &schema.GroupVersionResource{Group: group, Version: ver, Resource: res.Name}, nil
			}
		}
	}
	return nil, errors.Wrapf(ErrKindNotFound, "%s", kind)
}

func genCacheKey(clusterID, groupVersion string) cache.StringKey {
	// 不指定 groupVersion 说明是整个集群的 group 资源
	if groupVersion == "" {
		return cache.NewStringKey(fmt.Sprintf("%s:all:servergroups", clusterID))
	}
	// 否则为指定 group version 拥有的资源
	return cache.NewStringKey(fmt.Sprintf("%s:%s:serverresources", clusterID, groupVersion))
}

// 生成缓存重置锁 Redis 键
func genLockKey(clusterID string) cache.StringKey {
	return cache.NewStringKey(fmt.Sprintf("%s:cache-lock", clusterID))
}
