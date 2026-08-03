package clusteraddon

import (
	"context"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/pkg/errors"
	"github.com/samber/lo"
	"gopkg.in/yaml.v3"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
	log "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/logging"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

// builtinCreator 内置组件的创建者名称
const builtinCreator = "admin"

// LoadBuiltinFromFolder 从指定目录加载集群 Addon 定义并存入数据库
//
// Args:
//   - store: Addon 定义 store
//   - folderPath: 包含 Addon 定义 YAML 文件的目录路径，也可以是单个文件路径
func LoadBuiltinFromFolder(ctx context.Context, store ClusterAddonDefStore, folderPath string) error {
	addonDefs := make([]*ClusterAddonDef, 0)

	fileInfo, err := os.Stat(folderPath)
	if err != nil {
		return errors.Wrap(err, "stating path")
	}
	if !fileInfo.IsDir() {
		// folderPath 是单个文件路径，直接解析
		addonDef, pErr := parseAddonDefFile(folderPath)
		if pErr != nil {
			return errors.Wrapf(pErr, "parsing addon file %s", folderPath)
		}
		addonDefs = append(addonDefs, addonDef)
	} else {
		// 遍历目录加载所有 YAML 文件
		err = filepath.WalkDir(folderPath, func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if d.IsDir() {
				return nil
			}

			ext := strings.ToLower(filepath.Ext(path))
			if ext != ".yaml" && ext != ".yml" {
				return nil
			}

			addonDef, pErr := parseAddonDefFile(path)
			if pErr != nil {
				return errors.Wrapf(pErr, "parsing addon file %s", path)
			}
			addonDefs = append(addonDefs, addonDef)
			return nil
		})
		if err != nil {
			return errors.Wrap(err, "walking through files")
		}
	}

	// 保存到数据库
	for _, addonDef := range addonDefs {
		if err = store.Create(ctx, addonDef); err != nil {
			return errors.Wrapf(err, "creating builtin cluster addon def %s", addonDef.Name)
		}
	}

	addonDefNames := lo.Map(addonDefs, func(c *ClusterAddonDef, _ int) string { return c.Name })
	log.Infof(ctx, "Loaded builtin cluster addons successfully, total=%d, names=%v", len(addonDefNames), addonDefNames)
	return nil
}

// parseAddonDefFile 读取并解析 Addon 定义 YAML 文件
func parseAddonDefFile(path string) (*ClusterAddonDef, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, errors.Wrapf(err, "read file %s", path)
	}

	var addonDef ClusterAddonDef
	if err = yaml.Unmarshal(content, &addonDef); err != nil {
		return nil, errors.Wrapf(err, "unmarshal yaml %s", path)
	}

	// 设置创建者
	addonDef.Creator = builtinCreator

	// 设置默认命名空间
	if addonDef.ChartInfo.DefaultNamespace == "" {
		addonDef.ChartInfo.DefaultNamespace = DefaultNamespaceValue
	}

	return &addonDef, nil
}

// ReloadBuiltinClusterAddons 加载内置集群 Addon 定义到数据库
func ReloadBuiltinClusterAddons(ctx context.Context) error {
	addonDir := config.G.ClusterAddons.BuiltinAddonDir
	// 如果没有指定内置 Addon 目录，则跳过
	if addonDir == "" {
		log.Warn(ctx, "builtin cluster addon directory is not set, skip reload builtin cluster addons")
		return nil
	}

	store, err := NewClusterAddonDefStoreMongo(database.Client(), database.Name())
	if err != nil {
		return errors.Wrap(err, "new db cluster addon def store")
	}

	return LoadBuiltinFromFolder(ctx, store, addonDir)
}
