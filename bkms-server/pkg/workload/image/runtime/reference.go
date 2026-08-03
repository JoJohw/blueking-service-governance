package runtime

import (
	"strings"

	"github.com/distribution/reference"
	"github.com/pkg/errors"
)

// ImageReference 描述包含 tag 的镜像引用解析结果
type ImageReference struct {
	// Name 镜像仓库名称，不包含 tag 或 digest
	Name string
	// Tag 镜像标签名
	Tag string
}

// ParseTaggedImageReference 将完整镜像引用解析为镜像仓库名称和 tag
func ParseTaggedImageReference(image string) (*ImageReference, error) {
	image = strings.TrimSpace(image)
	if image == "" {
		return nil, errors.New("image reference is required")
	}

	named, err := reference.ParseNormalizedNamed(image)
	if err != nil {
		return nil, errors.Wrapf(err, "invalid image reference %s", image)
	}
	if _, ok := named.(reference.Digested); ok {
		return nil, errors.Errorf("image reference %s must not contain digest", image)
	}

	tagged, ok := named.(reference.Tagged)
	if !ok || tagged.Tag() == "" {
		return nil, errors.Errorf("image reference %s must contain tag", image)
	}

	return &ImageReference{
		Name: reference.FamiliarName(named),
		Tag:  tagged.Tag(),
	}, nil
}
