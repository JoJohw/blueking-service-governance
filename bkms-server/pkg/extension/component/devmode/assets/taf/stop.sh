#!/bin/bash
# stop.sh - taf 版优雅停止业务进程（SIGTERM → 等待 → SIGKILL）
# taf 通过 SERVER_NAME_ENV 匹配进程，不依赖 TRPC_BIN_PATH

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/utils.sh"

readonly LOG_FILE="${BKMS_MONITOR_LOGS_PATH}/stop.log"
readonly PROCESS_NOT_EXIST=10005
readonly FINAL_WAIT_TIME=3
readonly GRACEFUL_SHUTDOWN_TIMEOUT=15

# 优雅停止进程
# 参数: $1=进程PID
# 返回: 0=成功停止, 1=需要强制停止
graceful_stop_process() {
    local pid=$1

    # 发送 SIGTERM 信号
    kill -15 "${pid}"

    # 等待进程退出
    for ((i=0; i<${GRACEFUL_SHUTDOWN_TIMEOUT}; i++)); do
        if ! is_process_running "${pid}"; then
            log_info "Process ${pid} terminated gracefully."
            return 0
        fi
        sleep 1
    done

    return 1
}

# 强制停止进程
# 参数: $1=进程PID
force_stop_process() {
    local pid=$1

    if is_process_running "${pid}"; then
        log_info "Process ${pid} did not terminate, using SIGKILL."
        kill -9 "${pid}"
    fi
}

main() {
    # 创建停止标志，通知 monitor.sh 暂停托管进程检查
    create_stop_flag

    # 获取所有需要停止的进程（使用数组存储，避免单词拆分问题）
    local pid_list=()
    mapfile -t pid_list < <(get_process_pids)
    log_info "Found process PIDs: ${pid_list[*]}"

    # 如果没有进程在运行，直接退出
    if [ ${#pid_list[@]} -eq 0 ]; then
        log_info "No process found, nothing to stop."
        exit 0
    fi

    # 遍历所有进程进行停止
    for pid in "${pid_list[@]}"; do
        # 尝试优雅停止
        if ! graceful_stop_process "${pid}"; then
            # 优雅停止失败，强制停止
            force_stop_process "${pid}"
        fi
    done

    # 等待所有进程完全退出
    sleep ${FINAL_WAIT_TIME}

    # 最终验证：检查是否还有残留进程
    local remaining_count=$(get_process_count)

    if [ ${remaining_count} -gt 0 ]; then
        log_error "Failed to stop all processes. Remaining count: ${remaining_count}"
        exit ${PROCESS_NOT_EXIST}
    fi

    log_success "All processes stopped successfully."
    exit 0
}

# 执行主函数
main
