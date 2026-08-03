# Polaris

Polaris（北极星）组件用于为应用注册北极星服务。配置按应用 + 环境维度生效，数据存储在独立的 DB 表中，并通过 `depservice` 调用外部北极星服务完成实际的服务注册/注销。

## API

北极星配置 API 由本包的 `router.go` / `handler` 注册。

## 与 ImportPolaris 的关系

本包的 Polaris 配置使用独立 API 和数据模型，不依赖 component。仓库同时保留了 `pkg/extension/component/assets/comps/ImportPolaris_v1.0.0.yaml` 组件定义，通过 `properties`、`patchers` 和 `specs` 渲染工作负载及额外资源。这是一个历史遗留的实现，未来可能会被废弃。新建 Polaris 实例时应当直接使用 Polaris API。
