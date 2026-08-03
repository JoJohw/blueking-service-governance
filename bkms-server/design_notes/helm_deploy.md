# Helm 应用部署设计记录

Helm 应用是服务治理体系中的一种重要应用类型，未来将用于支持蓝鲸 & 业务的 Helm Chart 部署到 k8s 集群中。

## 历史实现（2025.9）

在第一个版本的实现中，我们采用的是拉取 Chart，转存到 BCS Chart 仓库，再由 HelmManager API 进行部署/回滚等操作。

**存在的问题**

- 流程复杂：额外多的 Chart 转存逻辑，需要检查，拉取 & 上传。
- 额外依赖：ArgoCD（拉取 HelmChart），cm-push（推送 HelmChart）, HelmManager API（部署）。
- 功能缺陷：泳道功能需要支持对资源的 labels 进行 patch，但是由于没有相应的入口，只能 Helm Release 之后再
  patch（后置），但是这样是存在问题的：部分资源下发后无法修改，或者修改必定会触发 Pod 重启，对服务来说都是无法接受的。

## 当前实现（2026.3）

在当前版本的实现中，我们通过引入 Helm SDK 来实现 Helm Chart 的部署。

**优化点**

- 流程简单、减少依赖：直接通过 Helm SDK 进行部署/回滚等操作，无需转存逻辑。
- 前置 Patch 支持：利用 Helm SDK 的 post renderer 实现前置 Patch，提前注入需要的 labels。
- 不需要在 infras/helm 中实现解析 Helm Release 的逻辑，直接使用 Helm SDK 的能力。
- 不需要在 Dockerfile 中下载 Helm 二进制（ArgoCD 依赖）。

## 未来实现

**演进方向：Render + Apply 分离**

目前引入 Helm SDK 的实现虽然简化很多，但是仍然有一定的局限性；未来可能会借鉴 ArgoCD / KubeVela 的思路，演进为 "Helm 只负责渲染
Manifest，平台接管资源的下发与管理"，以解决当前 Helm SDK
的局限：

| 当前局限                          | Render + Apply 后           |
|-------------------------------|----------------------------|
| 资源下发顺序不可控（固定 InstallOrder）    | 平台自主决定下发顺序、分批策略            |
| 无持续调谐，一次性下发 + 轮询              | 平台持有期望态，持续调谐 & Drift 检测/自愈 |
| 资源变换仅限 PostRenderer 注入 labels | Render → Apply 之间可插入任意变换管道 |
| 回滚粒度受限于 Helm Revision         | 平台管理每个资源版本，支持单资源级别操作       |

**Render + Apply 分离带来的额外复杂度**

Helm 退化为纯渲染引擎后，以下原生能力将丧失，需要平台通过其他机制来代偿：

1. **Helm Hook**：`helm.sh/hook` annotation（pre-install、post-upgrade 等）不再被理解，平台需自行解析 Hook
   语义（权重、删除策略）并实现调度，否则依赖 Hook 的 Chart（如 DB 迁移）将无法正常工作。
2. **三路合并（3-way Merge）**：Helm Upgrade 通过"旧 Manifest / 新 Manifest / 集群实际态"生成 patch，平台接管后需处理
   Server-Side Apply 的字段冲突或自行实现 strategic merge patch。
3. **Release 版本管理**：Helm 通过 k8s Secret 存储 Release 历史，平台需自建版本存储（含完整 Manifest 快照）以支持回滚和
   diff。
4. **Helm Test 丧失**：带 `helm.sh/hook: test` 的测试 Pod 不再自动识别和执行。
5. **Template 与 Install 行为差异**：部分 Chart 使用 `.Release.IsInstall` / `.Release.IsUpgrade` 等内置变量，
   `helm template` 模式下行为可能与 `helm install` 不一致。
6. **原子性保障丧失**：Helm `--atomic` 失败自动回滚不再可用，平台需自行实现"失败判定 → 回滚决策 → 执行回滚"流程。
7. **社区 Chart 兼容性风险**：社区 Chart 广泛使用 Hook、Notes、Capabilities 等原生特性，需建立兼容性测试机制。

总结：实现 Render + Apply 分离目前在技术上有较大的挑战，需要评估调研后再决定是否向这个方向演进。

## 参考资料

- [ArgoCD - Helm](https://argo-cd.readthedocs.io/en/latest/user-guide/helm/)
- [KubeVela - Native Helm Chart Support](https://github.com/kubevela/kubevela/blob/master/design/vela-core/helm-component.md)
- [KubeVela - Deploy Helm Chart](https://kubevela.io/docs/tutorials/helm/)
