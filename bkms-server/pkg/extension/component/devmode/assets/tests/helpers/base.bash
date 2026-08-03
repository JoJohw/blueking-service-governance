#!/usr/bin/env bash

# shellcheck shell=bash

# bats 在 `run` 后会注入 status / output 等变量。
# 静态分析阶段无法感知这些变量，这里显式声明用途，
# 避免 shellcheck 误报“未赋值变量”。
# shellcheck disable=SC2034
status=''
output=''

# 通用测试脚手架 helper。
#
# 这个文件只放与具体业务函数无关的公共能力，例如：
# - 计算 assets 工作目录
# - 创建临时 fixture 文件
# - 通用断言封装

# 通过 helper 文件自身的位置反推 assets 根目录。
assets_workspace() {
    local helper_dir

    helper_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    printf '%s\n' "$(cd "${helper_dir}/../.." && pwd)"
}

# 创建一个最小可执行文件，模拟目录中的目标二进制。
create_fake_binary() {
    local target_dir=$1
    local file_name=$2

    mkdir -p "${target_dir}"
    : > "${target_dir}/${file_name}"
    chmod +x "${target_dir}/${file_name}"
}

# 表驱动测试里如果要表达“期望输出为空”，统一使用哨兵值。
readonly TEST_EMPTY_OUTPUT="__EMPTY__"

# 统一校验 bats `run` 的退出码，失败时打印 case 名，便于快速定位。
assert_run_status_equals() {
    local expected_status=$1
    local case_name=$2

    if [ "${status}" -ne "${expected_status}" ]; then
        echo "case ${case_name}: expected status ${expected_status}, got ${status}" >&2
        echo "case ${case_name}: command output was: ${output}" >&2
        return 1
    fi
}

# 统一校验 bats `run` 的输出。
assert_run_output_equals() {
    local expected_output=$1
    local case_name=$2

    if [ "${expected_output}" = "${TEST_EMPTY_OUTPUT}" ]; then
        if [ -n "${output}" ]; then
            echo "case ${case_name}: expected empty output, got: ${output}" >&2
            return 1
        fi
        return 0
    fi

    if [ "${output}" != "${expected_output}" ]; then
        echo "case ${case_name}: expected output '${expected_output}', got '${output}'" >&2
        return 1
    fi
}
