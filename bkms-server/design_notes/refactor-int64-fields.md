# Proto int64 字段全量记录

> 背景：项目接口由 tRPC 框架迁移到 GIN 框架。 tRPC 框架在处理 proto 定义时，为了避免 int64 超过 JS 的安全整数范围（2^53），在返回响应中会将 int64 转换为字符串。
> 同时，在输入时，会将 JS 整数/字符串 处理为 int64

---

## workspace.proto (7 个 int64)

| 所属 Message | 方向 | 字段名 | 中文注释 |
|---|---|---|---|
| UserStatistics | 响应 | workspaceCount | 用户工作空间数量 |
| UserStatistics | 响应 | appCount | 用户总应用数量 |
| UserStatistics | 响应 | envCount | 用户总环境数量 |
| UserWorkspaceStatistics | 响应 | appCount | 用户某工作空间下的应用数量 |
| UserWorkspaceStatistics | 响应 | envCount | 用户某工作空间下的环境数量 |
| RoleMemberGroup | 响应 | userGroupID | 用户组 ID |
| CreateWorkspaceRequest | 请求 | bkCCBizID | bkccID 业务 ID |

## instance.proto (15 个 int64)

| 所属 Message | 方向 | 字段名 | 中文注释 |
|---|---|---|---|
| ListAppInstancesRequest | 请求 | page | 分页参数 |
| ListAppInstancesRequest | 请求 | pageSize | 分页参数 |
| PaginatedAppInstancesOutputObjs | 响应 | count | 结果数量 |
| PolarisInstanceInfo | 响应 | weight | 权重 |
| AppInstance | 响应 | restartCount | 重启次数 |
| ListAppInstanceLogsRequest | 请求 | tailLines | 日志行数（从尾部起算），最大 2000 |
| ListTrpcAdminCmdsOutputObjs | 响应 | count | 结果数量 |
| ExecuteTrpcAdminCmdOutputObjs | 响应 | count | 结果数量 |
| ExecuteTafAdminCmdOutputObjs | 响应 | count | 结果数量 |
| ListEventsRequest | 请求 | startedAt | 起始时间戳 |
| ListEventsRequest | 请求 | endedAt | 结束时间戳 |
| ListEventsRequest | 请求 | page | 分页参数 |
| ListEventsRequest | 请求 | pageSize | 分页参数 |
| PaginatedEventsOutputObjs | 响应 | count | 结果数量 |

## appspec_lifecycle.proto (5 个 int64)

| 所属 Message | 方向 | 字段名 | 中文注释 |
|---|---|---|---|
| AppSpecLifecycleOutput | 响应 | terminationGracePeriodSeconds | Pod 优雅终止超时时间（秒） |
| LifecycleExecActionOutput | 响应 | sleepSeconds | 睡眠等待时间（秒） |
| AppSpecLifecycleInput | 请求 | terminationGracePeriodSeconds | Pod 优雅终止超时时间（秒） |
| EnvAppSpecLifecycleInput | 请求 | terminationGracePeriodSeconds | Pod 优雅终止超时时间（秒） |
| LifecycleExecActionInput | 请求 | sleepSeconds | 睡眠等待时间（秒） |

## bkmonitor.proto (4 个 int64)

| 所属 Message | 方向 | 字段名 | 中文注释 |
|---|---|---|---|
| ListApmOutputObjs | 响应 | count | 结果数量 |
| ApmOutputObj | 响应 | apmID | Apm ID |
| ApmOutputObj | 响应 | bkBizID | 蓝鲸监控业务 ID |
| GetEnvApmRespData | 响应 | apmID | Apm ID |

## image.proto (11 个 int64)

| 所属 Message | 方向 | 字段名 | 中文注释 |
|---|---|---|---|
| ListAppImagesRequest | 请求 | page | 分页参数 |
| ListAppImagesRequest | 请求 | pageSize | 分页参数 |
| PaginatedAppImagesOutputObjs | 响应 | count | 结果数量 |
| AppImageOutputObj | 响应 | size | 镜像大小 |
| RefreshResultInfo | 响应 | addedTagCnt | 本次新增标签数量 |
| RefreshResultInfo | 响应 | removedTagCnt | 本次删除标签数量 |
| ListImageTagDeployRecordsRequest | 请求 | page | 分页参数 |
| ListImageTagDeployRecordsRequest | 请求 | pageSize | 分页参数 |
| PaginatedImageTagDeployRecordOutputObjs | 响应 | count | 结果数量 |
| ListDeployableImageTagsRequest | 请求 | page | 分页参数 |
| ListDeployableImageTagsRequest | 请求 | pageSize | 分页参数 |
| PaginatedDeployableImageTagOutputObjs | 响应 | count | 满足条件的总记录数 |

## topology.proto (6 个 int64)

| 所属 Message | 方向 | 字段名 | 中文注释 |
|---|---|---|---|
| ResourceTopologyData | 响应 | dataVersion | 数据版本号 |
| ListTopologyNodeEventsRequest | 请求 | startedAt | 起始时间戳 |
| ListTopologyNodeEventsRequest | 请求 | endedAt | 结束时间戳 |
| ListTopologyNodeEventsRequest | 请求 | page | 分页页码 |
| ListTopologyNodeEventsRequest | 请求 | pageSize | 每页数量 |
| PaginatedTopologyNodeEvents | 响应 | count | 事件总数 |

## env.proto (1 个 int64)

| 所属 Message | 方向 | 字段名 | 中文注释 |
|---|---|---|---|
| CreateEnvRequest | 请求 | apmID | 绑定的 APM ID |

## app_config_file.proto (13 个 int64)

| 所属 Message | 方向 | 字段名 | 中文注释 |
|---|---|---|---|
| UpdateAppConfigFileRequest | 请求 | currentVersion | 编辑开始时的当前版本号（乐观锁） |
| AppConfigFileOutputObj | 响应 | currentVersion | 当前生效版本号 |
| GetAppConfigFileDetailsResponse | 响应 | currentVersion | 当前生效版本号 |
| UpdateAppConfigFileContentRequest | 请求 | currentVersion | 编辑开始时的当前版本号（乐观锁） |
| UpdateAppConfigFileOverlayContentRequest | 请求 | currentVersion | 编辑开始时的当前版本号（乐观锁） |
| AppConfigFileVersionOutputObj | 响应 | version | 版本号 |
| AppConfigFileVersionOutputObj | 响应 | baseVersion | base 文件版本号 |
| AppConfigFileVersionOutputObj | 响应 | rollbackFromVersion | 回滚来源版本号 |
| ListAppConfigFileVersionsRequest | 请求 | version | 版本号 |
| ListAppConfigFileVersionsRequest | 请求 | page | 分页参数 |
| ListAppConfigFileVersionsRequest | 请求 | pageSize | 分页参数 |
| PaginatedAppConfigFileVersionOutputObjs | 响应 | count | 结果数量 |
| RollbackAppConfigFileVersionRequest | 请求 | currentVersion | 编辑开始时的当前版本号（乐观锁） |

## build.proto (4 个 int64)

| 所属 Message | 方向 | 字段名 | 中文注释 |
|---|---|---|---|
| ListBuildRecordsRequest | 请求 | page | 分页参数 |
| ListBuildRecordsRequest | 请求 | pageSize | 分页参数 |
| PaginatedBuildRecordOutputObjs | 响应 | count | 结果数量 |
| BuildRecordOutputObj | 响应 | num | 构建号 |

## audit.proto (3 个 int64)

| 所属 Message | 方向 | 字段名 | 中文注释 |
|---|---|---|---|
| ListOperationRecordsRequest | 请求 | page | 分页参数 |
| ListOperationRecordsRequest | 请求 | pageSize | 分页参数 |
| PaginatedOperationRecordOutputObj | 响应 | count | 结果数量 |

## deploy.proto (9 个 int64)

| 所属 Message | 方向 | 字段名 | 中文注释 |
|---|---|---|---|
| ListHelmDeployRecordsRequest | 请求 | page | 分页参数 |
| ListHelmDeployRecordsRequest | 请求 | pageSize | 分页参数 |
| PaginatedHelmDeployRecordOutputObjs | 响应 | count | 结果数量 |
| ListAppModelDeployRecordsRequest | 请求 | page | 分页参数 |
| ListAppModelDeployRecordsRequest | 请求 | pageSize | 分页参数 |
| PaginatedAppModelDeployRecordsOutputObjs | 响应 | count | 结果数量 |
| ListAppModelResourceSnapshotsRequest | 请求 | page | 分页参数 |
| ListAppModelResourceSnapshotsRequest | 请求 | pageSize | 分页参数 |
| PaginatedAppModelResourceSnapshotsOutputObjs | 响应 | count | 结果数量 |

## helm_chart.proto (11 个 int64)

| 所属 Message | 方向 | 字段名 | 中文注释 |
|---|---|---|---|
| Semver | 响应 | major | major 主版本号 |
| Semver | 响应 | minor | minor 次版本号 |
| Semver | 响应 | patch | patch 修订版本号 |
| ListAppHelmChartsRequest | 请求 | page | 分页页码 |
| ListAppHelmChartsRequest | 请求 | pageSize | 分页大小 |
| PaginatedAppHelmChartsOutputObjs | 响应 | count | 总记录数 |
| ListHelmChartBuildRecordsRequest | 请求 | page | 分页页码 |
| ListHelmChartBuildRecordsRequest | 请求 | pageSize | 分页大小 |
| PaginatedHelmChartBuildRecordOutputObjs | 响应 | count | 总记录数 |
| HelmChartBuildRecordOutputObj | 响应 | num | 构建序号 |
| HelmChartFileNode | 响应 | size | 文件大小（字节） |

## bkci.proto (5 个 int64)

| 所属 Message | 方向 | 字段名 | 中文注释 |
|---|---|---|---|
| ListBkCIPipelinesRequest | 请求 | page | 分页参数 |
| ListBkCIPipelinesRequest | 请求 | pageSize | 分页参数 |
| PaginatedBkCIPipelineOutputObjs | 响应 | count | 结果数量 |
| BkCIPipelineOutputObj | 响应 | version | 流水线版本号 |
| BkCIPipelineDetailOutputObj | 响应 | version | 流水线版本号 |

---

## 统计汇总

| Proto 文件 | int64 字段数 | 请求数 | 响应数 |
|---|---|---|---|
| workspace.proto | 7 | 1 | 6 |
| instance.proto | 14 | 6 | 8 |
| appspec_lifecycle.proto | 5 | 3 | 2 |
| bkmonitor.proto | 4 | 0 | 4 |
| image.proto | 12 | 4 | 8 |
| topology.proto | 6 | 4 | 2 |
| env.proto | 1 | 1 | 0 |
| app_config_file.proto | 13 | 6 | 7 |
| build.proto | 4 | 2 | 2 |
| audit.proto | 3 | 2 | 1 |
| deploy.proto | 9 | 6 | 3 |
| helm_chart.proto | 11 | 4 | 7 |
| bkci.proto | 5 | 2 | 3 |
| **合计** | **94** | **41** | **53** |

## 按字段语义分类

### 分页参数 (page / pageSize) — 27 个
所有分页请求中的 `page` 和 `pageSize` 字段。Proto v1 中序列化为字符串（如 `"1"`, `"20"`），Gin v2 中序列化为数字。

### 计数/数量 (count) — 18 个
所有分页响应中的 `count` 字段。语义上为非负整数，0 也是合法值。

### 版本号 — 7 个
`currentVersion`, `version`, `baseVersion`, `rollbackFromVersion`, `dataVersion` 等。乐观锁场景下客户端需要传回服务端返回的值，字符串/数字不一致会导致冲突检测失败。

### 业务 ID — 4 个
`apmID` (2), `bkBizID` (1), `bkCCBizID` (1)。ID 类字段通常需要精确匹配。

### 版本号组件 (major / minor / patch / num) — 6 个
`Semver` 中的版本号组件和构建号 `num`。

### 其他 — 10 个
`weight`, `restartCount`, `tailLines`, `size` (2), `addedTagCnt`, `removedTagCnt`, `startedAt` (2), `endedAt` (2), `sleepSeconds` (2), `terminationGracePeriodSeconds` (3), `workspaceCount`, `appCount` (2), `envCount` (2), `userGroupID`

## 前端影响分析

> 检查范围: `bkms-govern/apps/ui/src/`

| # | 字段 | 所属接口 | 前端是否使用 | 影响级别 | 说明 |
|---|------|---------|------------|---------|------|
| 1 | workspaceCount, appCount, envCount | GetUserStatistics | 使用 | **无影响** | 已用 `Number()` 包装: `appCount: Number(item.appCount) \|\| 0` (space-list.vue) |
| 2 | userGroupID | ListWorkspaceRoleMemberGroups | 仅类型定义 | **未使用** | workspace.d.ts 中定义但无业务代码引用 |
| 3 | bkCCBizID | CreateWorkspace | 使用 | **无影响** | 表单 `v-model` 绑定后直接传 API，字符串/数字均可 |
| 4 | count (分页响应) | 多个 List 接口 | 广泛使用 | **无影响** | 多处 `Number()` 转换；pagination 组件兼容；代码已考虑字符串情况: `{ count: '0', results: [] }` |
| 5 | num | ListBuildRecords / CreateBuild | 使用 | **无影响** | 仅赋值 `buildNum: item.num` 后展示 |
| 6 | apmID | ListApms / CreateEnv | 使用 | **无影响** | `===` 比较两端均来自同一 API 响应类型一致；`String()`/`Number()` 显式转换 |
| 7 | bkBizID | ListApms | 仅类型定义 | **未使用** | 无业务代码引用 |
| 8 | currentVersion | AppConfigFile 系列 | 使用 | **无影响** | 算术运算已 `Number()` 包装: `Number(currentConfig?.currentVersion \|\| 0) + 1`；`===` 比较类型一致 |
| 9 | version, baseVersion, rollbackFromVersion | AppConfigFile 系列 | 使用 | **无影响** | 模板插值显示 `V{{ row.version }}`；字符串插值 `` `V${props.versionData.version}` `` 数字/字符串结果一致 |
| 10 | page, pageSize | 所有分页请求 | 使用 | **无影响** | 前端本地生成的 number 值，不涉及 API 响应类型变化 |
| 11 | size | ListAppImages / ListHelmChartFiles | 使用 | **无影响** | 传入 `formatSize(size: number)` 函数，JS 隐式类型转换保证行为一致 |
| 12 | major, minor, patch (Semver) | HelmChart | 仅类型定义 | **未使用** | 前端使用的 major/minor/patch 是 bumpType 字符串标签，非 Semver 数字字段 |
| 13 | weight | ListAppInstances | 使用 | **无影响** | 已 `Number()` 转换: `weight: Number(weightValue.value)` (instance-list.vue) |
| 14 | restartCount | ListAppInstances | 使用 | **无影响** | 仅显示 `{{ row?.restartCount ?? '--' }}` |
| 15 | tailLines | ListAppInstanceLogs | 使用 | **无影响** | 硬编码常量 `tailLines: 2000`，非 API 响应 |
| 16 | terminationGracePeriodSeconds | AppSpecLifecycle | 使用 | **无影响** | 代码已显式 `Number()` 转换，含注释: `// 回填优雅退出时间（后端可能返回字符串，统一转为数字）` (lifecycle.vue) |
| 17 | sleepSeconds | AppSpecLifecycle | 使用 | **无影响** | 同上，已 `Number()` 转换 |
| 18 | dataVersion | ListTopology | 仅类型定义 | **未使用** | 无业务代码引用 |
| 19 | startedAt, endedAt | ListEvents / ListTopologyNodeEvents | 使用 | **无影响** | 请求参数为前端生成 `Math.floor(...)`；响应字段为 Date 类型 |
| 20 | addedTagCnt, removedTagCnt | RefreshAppImages | 仅类型定义 | **未使用** | 无业务代码引用 |

**前端结论**: 所有 int64 字段从字符串改为数字对前端**无功能影响**。前端代码对 int64 可能的字符串返回值已有较充分的防御性处理（`Number()` 包装、JS 隐式转换兼容等）。

---

## bkms-cli 影响分析

> 检查范围: `bkms-govern/bkms-cli/`
> 仅检查标记了 `[bkms-cli 使用]` 的接口中的 int64 字段

CLI 中所有 int64 字段在类型定义中均声明为 **`string`** 类型（如 `Count string \`json:"count"\``），因为 v1 Proto JSON 将 int64 序列化为字符串。

| # | 字段 | 所属接口 | CLI Go 类型 | CLI是否使用 | 影响级别 | 说明 |
|---|------|---------|------------|------------|---------|------|
| 1 | count | ListAppInstances | `string` | 未使用 | **有影响** | 字段未在业务逻辑中使用，但 Go struct 中类型为 `string`，v2 返回数字时 JSON 反序列化会失败: `json: cannot unmarshal number into Go struct field .count of type string` |
| 2 | restartCunt | ListAppInstances | `string` | 未使用 | **有影响** | 同上，反序列化失败 |
| 3 | weight | ListAppInstances | 不存在 | -- | **无影响** | CLI 中无 PolarisInstanceInfo 类型 |
| 4 | count | ListBuildRecords | `string` | 未使用 | **有影响** | 同上，反序列化失败 |
| 5 | num | ListBuildRecords / CreateBuild | `string` | 未使用 | **有影响** | 同上，反序列化失败 |
| 6 | count | ListAppImages | `string` | 未使用 | **有影响** | 同上，反序列化失败 |
| 7 | size | ListAppImages | `string` | 未使用 | **有影响** | 同上，反序列化失败 |
| 8 | count | ListHelmDeployRecords | `string` | 未使用 | **有影响** | 同上，反序列化失败 |
| 9 | count | ListTrpcDeployRecords / ListTafDeployRecords | `string` | 未使用 | **有影响** | 同上，反序列化失败 |
| 10 | count | ListTrpcAdminCmds | `string` | 未使用 | **有影响** | 同上，反序列化失败 |
| 11 | count | ExecuteTrpcAdminCmd / ExecuteTafAdminCmd | `string` | 未使用 | **有影响** | 同上，反序列化失败 |

**CLI 关键问题**: CLI 的 Go struct 将 int64 字段定义为 `string` 类型。v2 API 返回数字类型时，Go `encoding/json` 反序列化会报错: `json: cannot unmarshal number into Go struct field of type string`。虽然 CLI 不在业务逻辑中使用这些字段，但**整个 API 响应的反序列化会失败**，导致 CLI 命令执行报错。

**CLI 修复方案**: 这部分接口需要调整返回参数类型，保证和之前接口一致（即使用 String 代替数字）。

**CLI 影响文件列表**:
- `pkg/client/instance.go` — count (3处), restartCount
- `pkg/client/build.go` — count, num
- `pkg/client/image.go` — count, size
- `pkg/client/deploy.go` — count (2处)

---

## 综合风险矩阵

| 字段类别 | 字段数 | 前端影响 | CLI 影响 | Bruno 测试影响 |
|---------|-------|---------|---------|--------------|
| 分页参数 (page/pageSize) | 27 | 无 (前端本地生成) | 无 (CLI 不传这些参数) | 无 |
| 分页计数 (count) | 18 | 无 (已 Number() 转换) | **反序列化失败** | `isNotEmpty` 断言失败 |
| 版本号 (currentVersion 等) | 7 | 无 (已 Number() 包装) | 不涉及 | 需检查 |
| 业务 ID (apmID 等) | 4 | 无 (显式转换) | 不涉及 | 需检查 |
| 版本组件 (major/num 等) | 6 | 无 (未使用/仅显示) | **反序列化失败** | 需检查 |
| 统计计数 (workspaceCount 等) | 5 | 无 (已 Number() 转换) | 不涉及 | `isNotEmpty` 断言失败 |
| 其他 (size/weight/restartCount 等) | 27 | 无 (隐式转换/仅显示) | **反序列化失败** | 需检查 |

---

## 备注

- `ListWorkspacesOverviewRequest.limit` 是 `int32` 类型，不在本表范围内
- `BkSystems.bkCCBizID` 在 proto 中是 `string` 类型，但在 `CreateWorkspaceRequest` 中是 `int64` 类型
- 前端 TypeScript 类型定义中 int64 字段均为 `number` 类型，JS 对字符串/数字两种格式均可正常处理
- **Gin 迁移风险**: 响应中 int64 从字符串变为数字，可能导致依赖字符串格式的客户端（如 Bruno 测试中的 `isNotEmpty`、`eq "10001"` 断言）失败；请求中 int64 从字符串变为数字，客户端需发送数字而非字符串
