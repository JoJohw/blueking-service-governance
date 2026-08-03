# bkms-server 安装指南

`bkms-server` 是蓝鲸服务治理的 Helm Chart 应用后端服务模块，本文档为该服务的部署指南。

## 准备服务依赖

开始部署前，请准备好一套 Kubernetes 集群（版本 1.20 或更高），并安装 Helm 命令行工具（版本 3.6 或更高）。

### 依赖服务

以下为 bkms-server 依赖的基础服务：

- 【必须】MongoDB：数据存储用的数据库，目前只支持使用外部的 MongoDB。

> 注：你可以选择自己搭建，又或者直接从云计算厂商处购买以上服务，只要能保证从集群内能正常访问即可。

## 准备 `values.yaml`

bkms-server 无法直接通过 Chart 所提供的默认 `values.yaml` 完成部署，在执行 `helm install` 安装服务前，你必须按以下步骤准备好适合当前部署环境的 `values.yaml`。

### 配置镜像地址

Chart 中已经预设和当前 Chart 版本匹配的容器镜像，你需要将 registry 配置为你所使用的镜像源地址，并且确认镜像 tag，pullPolicy 是否合适。

```yaml
image:
  registry: "hub.bktencent.com"
  repository: blueking/bkms-server
  pullPolicy: IfNotPresent
  tag: v1.0.0-alpha.1
```

> 注：假如服务镜像需凭证才能拉取。请将对应密钥名称写入配置文件中，详细请查看 `values.imagePullSecrets` 配置项说明。

### 配置外部数据库

```yaml
externalDatabase:
  # 主数据库
  default:
    name: bkms
    host: localhost
    port: 3306
    user: bkms
    password: blueking
```

### 填写相关服务配置

TODO 待补充

## 部署 Chart

完成 `values.yaml` 的所有准备工作后，要安装 bkms-server，你必须先添加一个有效的 Helm repo 仓库。

```shell
## 请将 `<HELM_REPO_URL>` 替换为本 Chart 所在的 Helm 仓库地址
$ helm repo add bkce <HELM_REPO_URL>
```

添加仓库成功后，执行以下命令，在集群内安装名为 `bkms-server` 的 Helm release：

```shell
$ helm install bkms-server bkce/bkms-server -n blueking -f values.yaml
```

上述命令将使用指定配置在 Kubernetes 集群中部署 bkms-server, 并输出相关指引。

每次安装或升级时，Chart 都会先运行数据库迁移任务，Web 和 Worker Pod 会等待迁移完成后再启动。

## 卸载 Chart

使用以下命令卸载 `bkms-server`:

```shell
$ helm uninstall bkms-server -n blueking

$ kubectl delete pvc -l app.kubernetes.io/instance=bkms-server -n blueking
```
