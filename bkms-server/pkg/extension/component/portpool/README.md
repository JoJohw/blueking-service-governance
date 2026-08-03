# PortPool

PortPool 依赖 BcsIngresscontroller 组件。创建 PortPool 后，会在 CLB 上根据配置创建对应的监听器。当 Pod/Node 上带有"需要端口注入"的注解时，会自动将其作为 RS 注册到监听器上，并根据生命周期管理。

端口池按环境维度管理，不与应用关联。同一环境下端口池名称必须唯一。

数据直接从 K8s ApiServer 获取，不使用 DB 存储。外部模块通过 `PortPoolService` 间接获取数据。

## API

端口池 API 路径：`/v1/envs/{envID}/port-pools`

## Q&A
Q: 为什么 PortPool 不复用现有组件的设计，而是直接通过接口创建/更新/删除?
A: 与其他组件不同，PortPool 创建后需要调用 CLB API 创建监听器，当监听器量大时创建速度可能较慢。
  同时，当创建 PortPool 未就绪时，需要端口的业务 Pod / Node 创建会被 Webhook 阻拦; 当删除 PortPool 时， 也需要等待绑定了端口的 Pod/Node 先解绑。
  因此，如果 PortPool 与业务应用部署的生命周期保持一致，可能导致创建/删除的周期被拉长， 影响用户体验。

Q: 为什么不使用 DB 存储 PortPool 资源？
A: PortPool 的数据与 K8s CR 强一致，直接从 K8s ApiServer 获取可以避免 DB 与 K8s 的数据同步问题， 简化架构。

## 待迁移说明

PortPool 并非原生 component（原生 component 指 `pkg/extension/component/assets/comps/*.yaml`，通过声明式 `properties` + `output` 模板在部署时渲染为 K8s manifest）。

后续应迁入 `pkg/extension/addons/`，与原生 component 区分
