#!/usr/bin/env bash

# shellcheck shell=bash

# find_binary_in_dir 专属 helper。
#
# 这个文件只放和该函数强相关的逻辑：
# - 目标脚本执行方式
# - fixture 准备方式
# - case 字段解释方式
#
# 测试用例本身的“具体 case 定义”仍保留在 bats 文件里，
# 这样在阅读测试时能直接看到场景输入与期望输出。

load "${BATS_TEST_DIRNAME}/../../helpers/base.bash"

# 在独立 bash 进程里执行目标脚本中的 find_binary_in_dir。
#
# 为什么使用子进程而不是直接 source 到 bats 进程：
# - 被测脚本会写入较多全局变量，直接 source 会污染测试上下文。
# - 子进程更接近真实脚本执行环境。
# - 现有脚本内部会 source /etc/profile，在 Alpine 容器里如果开启 `set -u`
#   可能因为 profile 脚本访问未定义变量而误伤测试；因此这里只保留
#   `set -e -o pipefail`，把关注点放在函数行为本身。
run_find_binary_in_dir() {
    local script_relative_path=$1
    local app_name=$2
    local search_dir=$3
    local ls_stub_mode=${4:-real}
    local script_path

    script_path="$(assets_workspace)/${script_relative_path}"

    # shellcheck disable=SC2016
    run env \
        SCRIPT_PATH="${script_path}" \
        APP_NAME="${app_name}" \
        SEARCH_DIR="${search_dir}" \
        LS_STUB_MODE="${ls_stub_mode}" \
        bash -c '
            set -eo pipefail

            export BKMS_APP_NAME="${APP_NAME}"
            source "${SCRIPT_PATH}"

            if [ "${LS_STUB_MODE}" = "append_star" ]; then
                ls() {
                    printf "%s*\n" "${APP_NAME}"
                }
            fi

            find_binary_in_dir "${SEARCH_DIR}"
        '
}

# 为 find_binary_in_dir 准备测试输入目录。
#
# 字段约定：
# - fixture_spec:
#     - empty_dir
#     - create_binary:<binary_name>
# - search_dir_mode:
#     - existing
#     - missing
prepare_find_binary_in_dir_fixture() {
    local target_dir=$1
    local fixture_spec=$2
    local search_dir_mode=$3

    rm -rf "${target_dir}"

    case "${search_dir_mode}" in
        existing)
            mkdir -p "${target_dir}"
            ;;
        missing)
            # 故意保持目录不存在，用于覆盖空结果路径。
            ;;
        *)
            echo "unknown search_dir_mode: ${search_dir_mode}" >&2
            return 1
            ;;
    esac

    case "${fixture_spec}" in
        empty_dir)
            return 0
            ;;
        create_binary:*)
            if [ "${search_dir_mode}" != "existing" ]; then
                echo "fixture ${fixture_spec} requires an existing directory" >&2
                return 1
            fi
            create_fake_binary "${target_dir}" "${fixture_spec#create_binary:}"
            ;;
        *)
            echo "unknown fixture_spec: ${fixture_spec}" >&2
            return 1
            ;;
    esac
}

# 执行单个 find_binary_in_dir case。
# bats 文件负责用多行变量显式定义 case；helper 负责执行这些字段。
assert_find_binary_in_dir_case() {
    local script_relative_path=$1
    local case_name=$2
    local fixture_spec=$3
    local app_name=$4
    local search_dir_mode=$5
    local ls_stub_mode=$6
    local expected_status=$7
    local expected_output=$8
    local case_root search_dir

    case_root="${BATS_TEST_TMPDIR}/${case_name}"
    search_dir="${case_root}/search-dir"

    prepare_find_binary_in_dir_fixture "${search_dir}" "${fixture_spec}" "${search_dir_mode}" || return 1
    run_find_binary_in_dir "${script_relative_path}" "${app_name}" "${search_dir}" "${ls_stub_mode}"
    assert_run_status_equals "${expected_status}" "${case_name}" || return 1
    assert_run_output_equals "${expected_output}" "${case_name}" || return 1
}
