# bkms-cli app-cfg-file Reference

`bkms-cli app app-cfg-file` 用于查看、修改应用配置文件内容，以及查看和操作历史版本。当前包含六个子命令：

- `view`：查看默认环境或指定环境正在使用的最新配置文件内容。
- `edit`：把本地文件或字面量内容写入默认环境或指定环境的配置文件。
- `list-versions`：列出某个应用配置文件的所有历史版本。
- `view-version`：查看某个应用配置文件指定历史版本的具体内容。
- `rollback-version`：把某个应用配置文件回滚到指定历史版本。
- `delete-version`：删除某个应用配置文件的指定历史版本。

当同一个应用和环境下存在多个配置文件时，使用 `--name` 指定文件名。这主要指 Helm 应用，其 values 配置文件通常在应用中存在多份，必须用 `--name` 来明确选择目标文件。

## 常用场景

查看默认或指定环境应用配置文件。

```bash
# 查看默认环境配置文件元数据和内容
bkms-cli app app-cfg-file view --app demo -o json

# 查看 prod 环境覆盖配置文件元数据和内容
bkms-cli app app-cfg-file view --app demo --env prod -o json
```

保存当前配置到本地文件，主要使用内置 `-o 'jq=...'` 输出格式从 `view` 结果中提取内容字段。默认环境通常为 `content`，指定环境通常为 `overlayContent`（内容仅包括对默认环境的覆写片段）。

```bash
# 使用内置 jq 表达式提取默认环境 content，并保存为本地文件
bkms-cli app app-cfg-file view --app demo -o 'jq=.content' > values.yaml

# 使用内置 jq 表达式提取指定环境 overlayContent，并保存为本地文件
bkms-cli app app-cfg-file view --app demo --env prod -o 'jq=.overlayContent' > values-prod.yaml

# 兼容默认环境和指定环境，优先保存 overlayContent，缺失时保存 content
bkms-cli app app-cfg-file view --app demo --env prod -o 'jq=.overlayContent // .content // empty' > values.yaml
```

修改配置时，先把配置保存为本地文件并编辑，再用 `edit` 写回。

```bash
# 修改本地文件后写回默认环境配置文件
bkms-cli app app-cfg-file edit --app demo -f values.yaml
```

查看某个配置文件的历史版本，并进一步查看指定版本的内容。

```bash
# 查看默认环境配置文件的所有历史版本
bkms-cli app app-cfg-file list-versions --app demo

# 查看 prod 环境配置文件的所有历史版本
bkms-cli app app-cfg-file list-versions --app demo --env prod -o json

# 查看某个具体版本号的内容
bkms-cli app app-cfg-file view-version --app demo --env prod --version 7 -o json

# 先从历史版本列表中拿到版本记录 ID，再按记录 ID 查看
bkms-cli app app-cfg-file view-version --app demo --env prod --version-id version-record-7 -o json

# 回滚到某个历史版本
bkms-cli app app-cfg-file rollback-version --app demo --env prod --version 7

# 删除某个历史版本
bkms-cli app app-cfg-file delete-version --app demo --env prod --version-id version-record-7
```

## view

`view` 命令负责查看指定应用和环境的最新配置文件内容与元数据。

```bash
# 查看默认环境，默认输出格式适合快速人工查看
bkms-cli app app-cfg-file view --app demo

# 查看默认环境，并用 JSON 输出
bkms-cli app app-cfg-file view --app demo -o json

# Helm 应用存在多个应用级配置文件时，通过 --name 指定文件名
bkms-cli app app-cfg-file view --app demo --name values -o json

# 使用内置 jq 表达式提取默认环境的 content，保存为可编辑文件
bkms-cli app app-cfg-file view --app demo -o 'jq=.content' > values.yaml

# 使用内置 jq 表达式提取 prod 环境的 overlayContent，保存为可编辑文件
bkms-cli app app-cfg-file view --app demo --env prod -o 'jq=.overlayContent' > values-prod.yaml

# 兼容 content 和 overlayContent 字段，优先使用 overlayContent
bkms-cli app app-cfg-file view --app demo --env prod -o 'jq=.overlayContent // .content // empty' > values.yaml
```

## edit

`edit` 命令负责修改指定应用和环境（默认或单一环境）的应用配置文件内容。默认情况下只输出更新成功提示；指定 `--view-compiled-content` 后，会在更新后输出完整的文件内容。

```bash
# 使用本地文件内容更新默认环境配置文件
bkms-cli app app-cfg-file edit --app demo -f values.yaml

# Helm 应用存在多个应用级配置文件时，通过 --name 指定文件名
bkms-cli app app-cfg-file edit --app demo --name values -f values.yaml

# 使用本地文件内容更新 prod 环境配置文件
bkms-cli app app-cfg-file edit --app demo --env prod -f values-prod.yaml

# 更新 prod 环境配置文件，并记录版本描述
bkms-cli app app-cfg-file edit --app demo --env prod -f values-prod.yaml --description "update prod values"

# 使用字面量内容更新默认环境配置文件
bkms-cli app app-cfg-file edit --app demo --file-content $'server:\n  port: 8081\n'

# 更新后直接查看服务端返回的 compiledContent
bkms-cli app app-cfg-file edit --app demo --env prod -f values-prod.yaml --view-compiled-content
```

## list-versions

`list-versions` 命令负责列出指定应用配置文件的全部历史版本。命令会自动翻页抓取所有版本记录。

```bash
# 列出默认环境配置文件的全部历史版本
bkms-cli app app-cfg-file list-versions --app demo

# 列出 prod 环境配置文件的全部历史版本
bkms-cli app app-cfg-file list-versions --app demo --env prod

# Helm 应用存在多个应用级配置文件时，通过 --name 指定文件名
bkms-cli app app-cfg-file list-versions --app demo --name values -o json
```

## view-version

`view-version` 命令负责查看指定应用配置文件某个历史版本的详情与内容。必须且只能指定 `--version` 或 `--version-id` 其中一个。

```bash
# 按版本号查看默认环境配置文件的历史版本内容
bkms-cli app app-cfg-file view-version --app demo --version 7

# 按版本号查看 prod 环境配置文件的历史版本内容
bkms-cli app app-cfg-file view-version --app demo --env prod --version 7 -o json

# 按版本记录 ID 查看历史版本内容
bkms-cli app app-cfg-file view-version --app demo --env prod --version-id version-record-7 -o json

# Helm 应用存在多个应用级配置文件时，通过 --name 指定文件名
bkms-cli app app-cfg-file view-version --app demo --name values --version 3
```

## rollback-version

`rollback-version` 命令负责将指定应用配置文件回滚到某个历史版本。必须且只能指定 `--version` 或 `--version-id` 其中一个。

```bash
# 按版本号回滚默认环境配置文件
bkms-cli app app-cfg-file rollback-version --app demo --version 7

# 按版本记录 ID 回滚 prod 环境配置文件
bkms-cli app app-cfg-file rollback-version --app demo --env prod --version-id version-record-7

# 回滚并记录描述
bkms-cli app app-cfg-file rollback-version --app demo --env prod --version 7 --description "rollback prod values"

# Helm 应用存在多个应用级配置文件时，通过 --name 指定文件名
bkms-cli app app-cfg-file rollback-version --app demo --name values --version 3
```

## delete-version

`delete-version` 命令负责删除指定应用配置文件的某个历史版本。必须且只能指定 `--version` 或 `--version-id` 其中一个。

```bash
# 按版本号删除默认环境配置文件历史版本
bkms-cli app app-cfg-file delete-version --app demo --version 7

# 按版本记录 ID 删除 prod 环境配置文件历史版本
bkms-cli app app-cfg-file delete-version --app demo --env prod --version-id version-record-7

# Helm 应用存在多个应用级配置文件时，通过 --name 指定文件名
bkms-cli app app-cfg-file delete-version --app demo --name values --version 3
```
