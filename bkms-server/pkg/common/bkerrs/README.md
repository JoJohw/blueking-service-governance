# bkerrs 使用指南

## 背景

`bkerrs` 包提供创建 / 包装错误的方法，目的是返回特定类型的错误（`bkerrs.Error`），其会包含更具体的错误信息以便
`BkErrHandler` 处理成特定格式的响应内容（新版蓝鲸 HTTP API 协议）

## FAQ

##### 1. 反复调用 bkerrs.Wrap / Wrapf 会有什么影响

不会导致错误，但是下层包装的 bkerrs 会丢失其 details 信息（ErrCode 还在），且最后转换的 HTTP Status Code 以外层 `bkerrs.Error` 指定的 ErrCode 映射值为准。

##### 2. 如果忘记使用 bkerrs 包装错误会有什么影响？

`BkErrHandler` 中处理了默认情况，会有 HTTP 500 + ErrCode INTERNAL_ERROR，但是就不会有 details 信息。

##### 3. 在什么时机使用 bkerrs.New / Errorf / Wrap / Wrapf？

在尽可能上层的位置（handler -> store/infras/utils），除非下层返回的数据是明确需要分错误类型的，否则越上层越好。

##### 4. ErrCodeInvalidArgument 和 ErrCodeInvalidRequest 怎么选？

如果是整个 `request.Validate`，选 `InvalidRequest`（不论是不是里面单个字段错误）。

如果是单独逻辑校验发现的某个字段有问题，比如 `objID` 不合法，选 `InvalidArgument`。

##### 5. ErrCodeIAMNoPermission 如何使用？

bkerrs 包已提供 IAMNoPermission 专用的工具函数 `bkerrs.WrapIAMNoPermission`，调用时需提交 `workspaceID` 参数，其会自动填充权限中心用户组信息，便于用户在遇到没权限后自主申请。
