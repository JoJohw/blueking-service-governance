BINARY_NAME := bkms-dockerfile-generator

.DEFAULT_GOAL := help

.PHONY: help
help:  ## 展示可用的 make 命令
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

## 本地工具安装目录
LOCALBIN ?= $(shell pwd)/bin
$(LOCALBIN):
	mkdir -p $(LOCALBIN)

##@ Development

.PHONY: fmt
fmt: golangci-lint  ## 格式化代码
	$(GOCILINT) fmt .

.PHONY: lint
lint: golangci-lint  ## 执行代码检查
	$(GOCILINT) run

.PHONY: test
test: ginkgo  ## 运行单元测试
	$(GINKGO) -gcflags="all=-l -N" --cover --coverprofile cover.out ./...

##@ Build

.PHONY: build
build: | $(LOCALBIN)  ## 构建可执行文件
	go build -o $(LOCALBIN)/$(BINARY_NAME) .

##@ Dependencies

# 测试工具
GINKGO ?= $(LOCALBIN)/ginkgo
GINKGO_VERSION ?= v2.32.0

# 格式化与代码检查工具
GOCILINT ?= $(LOCALBIN)/golangci-lint
GOCILINT_VERSION ?= v2.4.0
GO_TOOLCHAIN_VERSION ?= $(shell go env GOVERSION)
GO_TOOLCHAIN_MINOR_VERSION ?= $(shell go env GOVERSION | sed 's/^\(go[0-9]*\.[0-9]*\).*/\1/')

.PHONY: ginkgo
ginkgo: | $(LOCALBIN)  ## 安装 ginkgo 工具
	@if ! (test -s $(GINKGO) && $(GINKGO) version | grep -q "Ginkgo Version $(patsubst v%,%,$(GINKGO_VERSION))"); then \
		GOBIN=$(LOCALBIN) go install github.com/onsi/ginkgo/v2/ginkgo@$(GINKGO_VERSION); \
	fi

.PHONY: golangci-lint
golangci-lint: | $(LOCALBIN)  ## 安装 golangci-lint 工具
	@if ! (test -s $(GOCILINT) && \
		$(GOCILINT) --version | grep -q "version $(patsubst v%,%,$(GOCILINT_VERSION))" && \
		go version -m $(GOCILINT) 2>/dev/null | head -n 1 | grep -q "$(GO_TOOLCHAIN_MINOR_VERSION)"); then \
		GOTOOLCHAIN=$(GO_TOOLCHAIN_VERSION) GOBIN=$(LOCALBIN) go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@$(GOCILINT_VERSION); \
	fi
