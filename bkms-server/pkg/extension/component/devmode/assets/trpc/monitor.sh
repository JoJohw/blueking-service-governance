#!/bin/bash
# monitor.sh - 守护进程：进程存活检查 + panic 检测 + 自动重启 + 信号转发

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/utils.sh"

readonly LOG_FILE="${BKMS_MONITOR_LOGS_PATH}/monitor.log"

# 错误码（bash 限制 0-255）
readonly PROCESS_NUM_ERROR=18
readonly PID_HAS_CHANGED=19
readonly PROCESS_NOT_EXIST=20
readonly PANIC_DETECTED=22
readonly PANIC_DETECTED_ON_PROCESS_EXIST=21

readonly PANIC_CHECK_INTERVAL=10
readonly PANIC_CHECK_LINES=100
readonly PANIC_LOG_FILES_COUNT=3
readonly MONITOR_SLEEP_INTERVAL=10
readonly GRACEFUL_SHUTDOWN_TIMEOUT=30

# === 信号处理 ===

SHUTDOWN_REQUESTED=0

# 转发信号给业务进程
# 参数: $1=信号名称
forward_signal_to_app() {
    local signal=$1
    local app_pid=$(get_process_pid)
    
    if [ -n "${app_pid}" ] && [ "${app_pid}" -gt 0 ]; then
        log_info "Forwarding signal ${signal} to application process (PID: ${app_pid})"
        kill -${signal} ${app_pid} 2>/dev/null
        return $?
    else
        log_warn "No application process found to forward signal ${signal}"
        return 1
    fi
}

# 等待业务进程退出
# 参数: $1=超时时间（秒）
wait_for_app_exit() {
    local timeout=$1
    local elapsed=0
    
    while [ ${elapsed} -lt ${timeout} ]; do
        local app_pid=$(get_process_pid)
        if [ -z "${app_pid}" ]; then
            log_info "Application process has exited gracefully"
            return 0
        fi
        sleep 1
        elapsed=$((elapsed + 1))
        log_info "Waiting for application to exit... (${elapsed}/${timeout}s)"
    done
    
    log_warn "Application did not exit within ${timeout} seconds"
    return 1
}

# 优雅关闭：SIGTERM → 等待 → SIGKILL
handle_shutdown() {
    local signal=$1
    
    # 防止重复处理
    if [ ${SHUTDOWN_REQUESTED} -eq 1 ]; then
        log_warn "Shutdown already in progress, ignoring signal ${signal}"
        return
    fi
    SHUTDOWN_REQUESTED=1
    
    log_info "Received signal ${signal}, initiating graceful shutdown..."
    
    # 转发 SIGTERM 给应用进程
    forward_signal_to_app "TERM"
    
    # 等待应用进程优雅退出
    if wait_for_app_exit ${GRACEFUL_SHUTDOWN_TIMEOUT}; then
        log_info "Graceful shutdown completed"
        exit 0
    fi
    
    # 超时后发送 SIGKILL 强制终止
    log_warn "Graceful shutdown timeout, sending SIGKILL..."
    forward_signal_to_app "KILL"
    sleep 1
    
    log_info "Shutdown completed (forced)"
    exit 0
}

# SIGTERM 处理器（K8s 默认发送的终止信号）
handle_sigterm() { handle_shutdown "SIGTERM"; }
# SIGINT 处理器（Ctrl+C）
handle_sigint() { handle_shutdown "SIGINT"; }
# SIGHUP 处理器（可用于重载配置）
handle_sighup() { log_info "Received SIGHUP, forwarding..."; forward_signal_to_app "HUP"; }
# SIGUSR1 处理器（自定义信号1）
handle_sigusr1() { log_info "Received SIGUSR1, forwarding..."; forward_signal_to_app "USR1"; }
# SIGUSR2 处理器（自定义信号2）
handle_sigusr2() { log_info "Received SIGUSR2, forwarding..."; forward_signal_to_app "USR2"; }

setup_signal_handlers() {
    trap 'handle_sigterm' SIGTERM
    trap 'handle_sigint' SIGINT
    trap 'handle_sighup' SIGHUP
    trap 'handle_sigusr1' SIGUSR1
    trap 'handle_sigusr2' SIGUSR2
    log_info "Signal handlers registered"
}

# === Panic 检测 ===

# 检查是否需要执行 panic 检测（频率限制）
# 参数: $1=时间戳文件路径
# 返回: 0=需要检查, 1=跳过检查
should_check_panic() {
    local timestamp_file=$1

    if [ ! -f "${timestamp_file}" ]; then
        return 0
    fi

    local last_check=$(cat "${timestamp_file}")
    local current_time=$(date +%s)
    local time_diff=$((current_time - last_check))

    if [ ${time_diff} -lt ${PANIC_CHECK_INTERVAL} ]; then
        return 1
    fi

    return 0
}

# 获取最近修改的日志文件列表
# 返回: 日志文件路径列表
get_recent_log_files() {
    if [ ! -d "${TRPC_LOG_PATH}" ]; then
        return
    fi

    find "${TRPC_LOG_PATH}" \
        -maxdepth 1 \
        -type f \
        \( -name "*.log*" \) \
        -mmin -1 \
        -printf '%T@ %p\n' 2>/dev/null \
        | sort -nr \
        | cut -d' ' -f2- \
        | head -n ${PANIC_LOG_FILES_COUNT}
}

# 在日志文件中检测 panic 模式
# 参数: $1=日志文件路径, $2=检查行数
# 返回: 0=未检测到, 1=检测到 panic
detect_panic_in_file() {
    local log_file=$1
    local tail_lines=$2

    # Panic 模式定义
    local panic_patterns="panic:|\\[PANIC\\]|fatal error:|runtime error:|SIGABRT|SIGSEGV"

    if [ ! -f "${log_file}" ]; then
        return 0
    fi

    # 检查日志文件最后几行是否包含 panic 模式
    local tail_panic=$(tail -n "${tail_lines}" "${log_file}" 2>/dev/null \
        | grep -E "${panic_patterns}" \
        | tail -3)

    if [ -n "${tail_panic}" ]; then
        log_error "PANIC DETECTED in ${log_file} (last ${tail_lines} lines):"
        log_error "${tail_panic}"
        return 1
    fi

    return 0
}

# 检查 panic（主函数）
# 参数: $1=进程名称, $2=检查行数（可选，默认100）
# 返回: 0=未检测到, 1=检测到 panic
check_panic() {
    local process_name=$1
    local tail_lines=${2:-${PANIC_CHECK_LINES}}
    local timestamp_file="/tmp/check_panic_${SERVER_NAME}.timestamp"

    # 频率限制检查
    if ! should_check_panic "${timestamp_file}"; then
        return 0
    fi

    # 更新检查时间戳
    date +%s > "${timestamp_file}"

    log_info "Checking for panics..."

    # 遍历最近修改的日志文件
    for log_file in $(get_recent_log_files); do
        if detect_panic_in_file "${log_file}" "${tail_lines}"; then
            return 1
        fi
    done

    return 0
}

# === 进程监控 ===

# 处理进程不存在的情况
handle_process_not_exist() {
    # 检查停止标志，如果存在则跳过自动重启
    if is_stop_flag_set; then
        log_info "Stop flag detected, skipping auto-restart. Process is manually stopped."
        return
    fi

    log_info "Process does not exist. Checking start.sh status..."

    # 检查 start.sh 是否正在运行
    local start_script_count=$(ps -ef | grep "${BKMS_MONITOR_PATH}/start.sh" | grep -v grep | wc -l)
    
    if [ ${start_script_count} -lt 1 ]; then
        # start.sh 未运行，启动它
        bash "${BKMS_MONITOR_PATH}/start.sh"
        log_info "start.sh launched"

        # 检测 panic（进程不存在可能是由于 panic 导致）
        if ! check_panic "${SERVER_NAME}"; then
            log_error "trpc-go panic detected (process does not exist), code: ${PANIC_DETECTED}"
        fi
    else
        # start.sh 正在运行，等待它完成
        log_info "start.sh is already running. Waiting..."
    fi

    log_error "Process does not exist now."
}

# 检查 PID 是否发生变化
check_pid_change() {
    if [ ! -f "${PID_CONF}" ]; then
        return
    fi

    local pid_now=$(get_process_pid)
    local pid_old=$(get_recorded_pid)

    # 检查 PID 是否为空
    if [ -z "${pid_now}" ]; then
        log_warn "Current PID is empty, process may not be running."
        return
    fi

    if [ -z "${pid_old}" ]; then
        log_warn "Old PID is empty, updating pid.conf with current PID: ${pid_now}"
        echo "${pid_now}" > "${PID_CONF}"
        return
    fi

    # 检查 PID 是否发生变化
    if [ "${pid_now}" -ne "${pid_old}" ]; then
        log_error "PID changed: old=${pid_old}, new=${pid_now}"
        echo "${pid_now}" > "${PID_CONF}"
    fi
}

# 处理进程存在的情况
handle_process_exist() {
    # 检查 PID 变化
    check_pid_change

    # 检测 panic（即使进程存在，也可能有 panic 日志）
    if ! check_panic "${SERVER_NAME}"; then
        log_error "trpc-go panic detected (process exists), code: ${PANIC_DETECTED_ON_PROCESS_EXIST}"
    fi
}

# === 主监控循环 ===

# 执行一次监控检查
monitor_once() {
    local process_count=$(get_process_count)
    log_info "Current process count: ${process_count}"

    if [ ${process_count} -lt 1 ]; then
        # 进程不存在
        handle_process_not_exist
    else
        # 进程存在
        handle_process_exist
    fi
}

main() {
    # 为空检查
    if [ -z "${TRPC_BIN_PATH_TEMPLATE}" ]; then
      log_fatal "TRPC_BIN_PATH_TEMPLATE is empty."
    fi
    
    # 获取实际的二进制文件路径和名称（处理大小写、星号问题，以及路径自动修正）
    get_actual_server_name
    
    # 注册信号处理器
    setup_signal_handlers
  
    log_info "Monitor started for ${SERVER_NAME}"

    while true; do
        # 检查是否收到终止信号
        if [ ${SHUTDOWN_REQUESTED} -eq 1 ]; then
            log_info "Shutdown requested, exiting monitor loop..."
            break
        fi
        
        monitor_once
        sleep ${MONITOR_SLEEP_INTERVAL}
    done
}

# 执行主函数
main
