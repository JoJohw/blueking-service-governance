# syntax=docker/dockerfile:1

# 本 Dockerfile 用于在容器化 Go 构建环境中产出 bkms-dockerfile-generator 的 Linux AMD64 二进制
# 推荐在 bkms-dockerfile-generator 目录执行以下命令，将产物导出到宿主机 ./bin
#   mkdir -p ./bin
#   DOCKER_BUILDKIT=1 docker build --target artifact --output type=local,dest=./bin .
# 构建成功后文件位于 ./bin/bkms-dockerfile-generator，可通过 file ./bin/bkms-dockerfile-generator 验证平台信息
# build 阶段负责下载 Go module 并交叉编译；artifact 阶段只暴露构建产物给 BuildKit 输出
FROM --platform=$BUILDPLATFORM golang:1.25.7-bookworm AS build

WORKDIR /workspace

COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -trimpath \
    -ldflags="-s -w" \
    -o /out/bkms-dockerfile-generator \
    .
RUN test -s /out/bkms-dockerfile-generator

FROM scratch AS artifact
COPY --from=build /out/bkms-dockerfile-generator /bkms-dockerfile-generator
