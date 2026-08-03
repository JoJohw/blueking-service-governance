# AppSpec 设计说明

本文档介绍 `pkg/workload/appmodelcore/appspec` 模块的设计、职责边界和扩展方式。

## 1. AppSpec 主要功能

`appspec` 用来管理“应用配置”类配置。这类配置有几个共同特征：

- 按不同领域/用途分类，比如“资源规格”、“更新策略”、“开发模式”等；
- 大部分配置支持“默认值 + 按环境覆盖”；
- 需要得到某个环境下生效的配置值；
- 有些配置和应用模型（`AppModel`）数据有关，有些则不会（比如 `devMode`）；
- 最终通常会影响 workload 构建、部署或运行时行为。

当前 `appspec` 负责 3 个 section：

- `resources`：副本数、CPU/MEM 资源限制；
- `update_strategy`：更新策略类型；
- `dev_mode`：是否启用管理工具；

对应的核心能力包括：

- 读取默认配置 `GetDefault`
- 设置默认配置 `SetDefault`
- 读取环境配置 `GetEnv`
- 设置环境配置 `SetEnv`
- 读取环境生效配置 `GetEnvEffective`
- 按 section 读取默认配置 `GetDefaultSection`
- 按 section 读取环境原始覆盖 `GetEnvSection`
- 按 section 读取环境生效值 `GetEnvEffectiveSection`
- 按 section 写入默认配置 `SetDefaultSection`
- 按 section 写入环境覆盖 `SetEnvSection`
- （数据反向同步）将 appspec 中相关的 section 应用回 `AppModel`
- （特殊快捷）局部更新副本数 `SetReplicas`

## 2. 设计目标

`appspec` 的目标不只是解决资源配置，而是提供一个可扩展的框架，让不同种类的应用规格都能复用同一套机制，包括：默认值生成、默认值与环境覆盖合并、MongoDB 存储，等等。因此模块引入了 section（配置域）这个抽象。

## 3. Section 是什么

section 是 `AppSpec` 中的一块独立配置域。语义上，section 表示一类具有一致生命周期和一致处理方式的规格配置。每个 section 自己定义：

- 结构体类型
- 如何从 `AppModel` 生成默认值
- 如何做 merge
- 如何 clone / patch / validate
- 是否支持回写 `AppModel`

在实现上，外部通过 `SectionHandle[T]` 这个强类型句柄访问某个 section。它把“如何从 `AppSpec`
取值 / 设值 / merge / clone / patch / apply 到 `AppModel`”这些操作集中在一起，因此聚合层可以用统一流程驱动不同 section。

## 4. 模块结构

### 4.1 聚合层

聚合层负责管理完整的 `AppSpec`：

- `model.go`：定义聚合结构 `AppSpec`，并实现 `Merge` / `cloneSpec`
- `default.go`：默认配置读取和写入
- `env.go`：环境配置读取和合并
- `store.go`：聚合存储接口与 MongoDB 实现
- `appmodel.go`：`FromAppModel` / `ApplyToAppModel`
- `registry.go`：section 中心化注册 registry

### 4.2 Section 层

每个 section 放在自己的子目录里，负责本 section 的全部领域逻辑。

以 `resources` 为例：

- `spec.go`：定义 section 数据结构，承载 clone / merge / patch 等 section 内公共逻辑
- `appmodel.go`：默认值生成、apply 到 `AppModel`
- `validate.go`：section 数据类型有效性校验

## 5. Registry 设计

`appspec` 目前使用的是一个 **typed section registry**，核心在 `pkg/workload/appmodelcore/appspec/registry.go`。其作用是把 section 的通用编排从聚合层抽出来，使聚合层不再显式写死，而是统一通过 registry 驱动。

这带来的直接收益是：

- 聚合层不再需要为每个 section 重复写编排代码；
- 新增 section 时，只需要在 registry 注册；
- section 行为仍然是强类型，不会退化成 `map[string]any` 式的弱类型系统。

这套实现并不是“完全动态”的。`AppSpec` 仍然是强类型结构体，因此新增 section 时，仍然需要在 `AppSpec` 上增加字段，但是聚合层不需要再为该 section 增加一组手写的 `merge/apply/patch/validate` 分支。基本符合“开放-关闭”原则。

## 6. 默认值、覆盖和生效值

`appspec` 采用“默认值 + 按环境覆盖”的模型：

- 默认值：`envName == ""`
- 环境覆盖：`envName == 具体环境名`
- 生效值：`default + env override`

补充几点实现细节：

- `GetDefault` 不是单纯查库。如果默认文档不存在，它会先读 `AppModel`，调用各 section 的 `FromAppModel`
  生成一份默认 spec，再落库，后续读取复用这份文档；
- `GetEnv` 返回的是某个环境下的“原始 override 文档”，它可以只包含少数字段；
- `GetEnvEffective` 会先取默认 spec，再与环境 override 做 section 级 merge，得到完整生效值。

### 6.1 Section 级读取接口

除了聚合级别的 `GetDefault` / `GetEnv` / `GetEnvEffective`，模块还提供了 section 级读取接口：

- `GetDefaultSection`：读取默认 spec 中某一个 section；
- `GetEnvSection`：读取环境 override 文档中的某一个 section；
- `GetEnvEffectiveSection`：读取某环境最终生效的某一个 section。

### 6.2 Section 级写入接口

section 级写入通过 `SetDefaultSection` / `SetEnvSection` 完成，二者都要求调用方显式指定 `SectionWriteMode`：

- `replace`：按“整块 section”替换。底层走 `store.SetSections`，只改目标 top-level section，其他 section 保持不变；
- `patch`：按“字段级别”更新。底层走 `store.Patch`，只会写入输入里非 nil 的字段，nil 字段表示“不改”，不是“清空”。

这两种模式的边界非常重要：

- `replace` 可以把某个 section 整块删掉。实现上如果传入该 section 为 `nil`，会生成 MongoDB `$unset`；
- `patch` 不能删除字段，也不会把未传入的字段重置为空；
- 对不存在的环境 override，`patch` 可以直接 upsert 出一条只包含该 section 的新文档；
- 默认配置上的 section 写入在真正执行前，会先调用 `GetDefault` 保证默认文档已经完整物化，避免第一次写入就是一个局部 patch，导致默认 spec 只落一小块 section。

### 6.3 默认配置与环境配置在写入时的差异

默认配置和环境配置在 section 写入后，副作用不同：

- `SetDefaultSection` 在写库后，会把该 section 同步回 `AppModel`，但只同步当前 section；
- `SetEnvSection` 只更新环境 override 文档，不会回写 `AppModel`；
- `SetDefault` 是整份 spec upsert 后，再把所有支持 `AppModel` 映射的 section 一次性应用回 `AppModel`。

## 7. 与 AppModel 的关系

并不是所有 section 都必须映射到 `AppModel`，这是 `appspec` 设计中的一个重要原则。

### 7.1 通用 section，可能和 AppModel 有关联

有些 section 和 `AppModel` 强相关，因为它们本来就是 `AppModel` 的一部分，或者最终必须作用到 `AppModel` 才能影响 workload：

- `resources`
  - 默认值来自 `AppModel.Replicas` 和 `AppModel.Workload.Resources`
  - 保存后默认值会回写到 `AppModel`
- `update_strategy`
  - 默认值来自 `AppModel.UpdateStrategy`
  - 保存后默认值会回写到 `AppModel`
  - 当前只管理 `maxUnavailable` / `maxSurge`，不会覆盖 `AppModel.UpdateStrategy.Type`

对这类 section，通常要实现 `FromAppModel` 和 `ApplyToAppModel` 两个函数。

### 7.2 也存在不和 AppModel 有任何关联的 section

也有一些 section 可以完全不依赖 `AppModel`，当前 `dev_mode` 就是一个例子：

- 默认值不从 `AppModel` 推导；
- 不回写到 `AppModel`；
- 只是被 `workload.Builder` 在构建过程中消费。

这种 section 仍然适合纳入 `appspec`，因为它仍然符合 appspec 的核心模型：

- 属于应用
- 支持默认/环境覆盖
- 需要 effective 值
- 需要校验
- 需要存储

因此，不要把 `appspec` 理解成“`AppModel` 的补充字段容器”；更准确地说，它是“应用规格配置”的聚合框架，其中有些 section 与 `AppModel` 有关，有些没有。

## 8. 主要收益

### 8.1 收益

- **统一了默认值与环境覆盖的机制**：以前不同配置域容易各自实现一套 `default/env/effective` 逻辑，现在 `appspec` 为这类问题提供了统一入口；
- **section 行为内聚**：每个 section 的数据结构、merge、apply、patch、validate 都在自己的子目录里，阅读和维护成本更低；
- **聚合层更稳定**：有了 registry 之后，聚合层只负责“编排 section”，不用继续为每个 section 写重复分支。
- **便于逐步纳入新的规格配置**：未来如果还要支持别的应用规格，比如调度策略、发布窗口、探针覆盖、运行时调试开关等，可以复用现有框架。
- **允许 section 与 AppModel 解耦**：这点很关键。它避免了“只有能塞进 `AppModel` 的配置才能被框架管理”的限制。

### 8.2 弱点

#### 还不是完全零改动扩展

新增 section 时，仍然需要：

- 在 `AppSpec` 上增加字段；
- 在 registry 里注册该 section。

也就是说，这不是一个完全动态插件系统。

#### section 抽象是“行为统一”，不是“数据统一”

每个 section 的规则差异仍然很大，例如：

- 有的字段级 merge
- 有的整段覆盖
- 有的回写 `AppModel`
- 有的完全不回写

因此 section 抽象更像“统一编排接口”，而不是一套万能数据模型。

#### 单 collection 的 schema 会持续扩张

目前这不是问题，但如果未来 section 数量非常多，或者不同 section 的生命周期和权限模型差异很大，单 collection 可能会成为边界不够清晰的地方。

不过在当前规模下，单 collection 的收益明显大于成本。

## 9. 为什么不是“每个 section 一个 Store / 一个 collection”

理论上可以这么设计，但当前不建议。

原因：

- 业务读取往往是“取一份完整的 effective spec”，不是分别读取多个 section；
- workload 构建也需要一次拿到完整配置；
- 拆成多个 collection 后，会引入多次读写、更多 merge 过程和一致性问题；
- 现阶段 3 个 section 的体量完全不足以支撑这种复杂度。

只有在下面这些情况出现时，才值得重新评估：

- section 数量显著增加；
- 不同 section 由不同团队独立维护；
- section 之间的权限、生命周期、索引需求明显不同；
- 某个 section 的文档体积或访问模式已经不适合继续放在聚合文档里。

## 10. 如何扩展新的 section

扩展一个新 section，建议按下面步骤进行。

### 第 1 步：设计 section 语义

先明确：

- 这个配置是否真的构成一个独立 section；
- 它是字段级 merge 还是整段覆盖；
- 它是否来自 `AppModel`；
- 它是否需要回写 `AppModel`；
- 它如何 patch 到 MongoDB；
- 它是否应该支持默认值和按环境覆盖。

如果这些问题都不清楚，先不要写代码。

### 第 2 步：创建 section 子目录

在 `pkg/workload/appmodelcore/appspec/sections/<section_name>/` 下新增：

- `spec.go`
- `appmodel.go`
- `validate.go`

其中 `appmodel.go` 只在该 section 需要和 `AppModel` 做双向映射时才需要；如果 section 完全独立于 `AppModel`，可以不提供。

### 第 3 步：在 `AppSpec` 中增加字段

在 `pkg/workload/appmodelcore/appspec/model.go` 中增加聚合字段，例如：

```go
type AppSpec struct {
    ...
    Scheduling *SchedulingSpec `bson:"scheduling,omitempty"`
}
```

### 第 4 步：在 registry 中注册

在 `pkg/workload/appmodelcore/appspec/registry.go` 中新增一个 `SectionHandle[...]`，配置好：

- `idValue`
- `getRaw`
- `setRaw`
- `fromAppModel`
- `mergeFn`
- `cloneFn`
- `applyToAppModelFn`
- `appendPatchFn`
- `registerValidationFn`

不是所有钩子都必须实现。比如一个完全不依赖 `AppModel` 的 section，可以不提供 `fromAppModel` 和 `applyToAppModelFn`。

### 第 5 步：补测试

至少要覆盖：

- 默认值读取
- 环境覆盖 merge
- section 级 `replace` / `patch` 行为
- patch/update 行为
- validation
- 如果 section 会影响 workload 或部署，再补对应集成测试

## 11. 当前实现里几个容易漏掉的细节

### 11.1 `resources` 的 merge 不是简单字段覆盖

`resources` 在 merge 时有一条额外规则：

- 如果 override 只设置了 `CPURequests`，没有设置 `CPULimits`，那么生效值里的 `CPULimits` 会跟随 `CPURequests`；
- `MemoryRequests` / `MemoryLimits` 也一样。

这意味着 `resources` 的“生效值语义”和“Mongo patch 语义”不是一回事：

- `patch` 只是把非 nil 字段写进 Mongo；
- 真正读取 effective spec 时，才会通过 `resources.Merge` 补齐上述规则。

### 11.2 `dev_mode` 的默认路径是在 clone / merge 阶段补的

`dev_mode` 只要 section 存在，就会在 `Clone` 时自动补齐：

- `WorkPath = componentdevmode.DefaultWorkPath`
- `MountPath = componentdevmode.DefaultMountPath`

所以库里即使只存了 `enabled`，读出来的 section 仍然会带默认路径。与此同时，校验层目前只允许路径为空或等于默认值，不支持任意自定义路径。


## 12. 总结

`appspec` 当前的核心设计可以概括为一句话：

> 用一个强类型聚合模型，承载多个独立 section；用统一 registry 编排 section 行为；让“默认值 / 环境覆盖 / 生效配置 / 存储 / 校验 / 应用”成为一套可复用的基础设施。

这套设计的重点不是“把所有配置都塞进一个结构体”，而是：

- 明确 section 边界；
- 明确 section 是否与 `AppModel` 有关；
- 让每个 section 自治；
- 让聚合层稳定。

如果后续继续扩展应用规格配置，优先沿着这个方向演进。
