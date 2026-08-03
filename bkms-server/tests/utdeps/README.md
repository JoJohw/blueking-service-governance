本目录中包含项目单元测试所需要的依赖服务。

其中初始化型 fixture 统一按 `<service>-init` 命名；脚本尽量放在 `utdeps/<service>/`
目录下，例如 registry 的 `registry-init.py`、mongo 的 `mongo-init.js`。

### 常用命令

准备工作：确保已经安装了 [just](https://github.com/casey/just) 工具。

#### 启动依赖服务

执行 `just up` 来启动所有依赖服务。服务列表：

- gitea：监听 28010 端口
- chartmuseum：监听 28020 端口
- registry：监听 28030 端口

gitea 服务成功启动后，你可以使用 `git clone http://localhost:28010/ufoo/sample-repo.git` 来克隆样例仓库，该仓库中包含一个 `values.yaml 文件`，供单测使用。

chartmuseum 服务成功启动后，可通过 `http://localhost:28020` 访问该 Helm repo registry 服务。内置一个名为 sample-app 的 chart,可用版本为 0.1.0。

registry 服务成功启动后，可通过 `http://localhost:28030` 访问该 registry 服务。内置一个名为 fixture/sample 的 repo，自带 1.0.0 和 latest tags。
