#!/bin/bash
# start.sh - taf 版启动业务进程（单例锁 + 重复检查 + PID 记录）
# taf 通过 wrap 方式调用 taf-start.sh 拉起进程，不需要提前查找 bin 路径

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/utils.sh"

readonly SELF_PATH="${BKMS_MONITOR_PATH}/start.sh"
readonly LOG_FILE="${BKMS_MONITOR_LOGS_PATH}/startScript.log"
readonly START_PROCESS_FAIL=10002
readonly STARTUP_WAIT_TIME=3

# 文件锁单例检查
check_singleton() {
    # 使用文件描述符 99 打开脚本文件
    exec 99<>"${SELF_PATH}"

    # 尝试获取文件锁（非阻塞模式）
    if flock -n 99; then
        log_success "Acquired singleton lock successfully."
    else
        log_error "Failed to acquire lock. Another start.sh is already running."
        exit 99
    fi
}

# 检查进程是否已经在运行
# 返回: 0=未运行, 1=已运行
is_process_already_running() {
    local count=$(get_process_count)
    log_info "Current process count: ${count}"

    if [ ${count} -gt 0 ]; then
        log_warn "Process is already running. Skipping startup."
        return 1
    fi

    return 0
}

# 启动业务进程（通过 wrap 方式调用 taf-start.sh）
start_process() {
    log_info "Starting taf process via taf-start.sh: ${SERVER_NAME_ENV}"

    # 设置 core dump 文件大小无限制（便于调试）
    ulimit -c unlimited

    # 子 Shell 启动，关闭 fd 99 避免继承文件锁
    (
        # 关闭文件描述符 99，防止子进程继承文件锁
        exec 99>&-

        # 通过 taf-start.sh 方式启动进程（后台运行，输出重定向到标准输出/错误）
        nohup ${BKMS_MONITOR_PATH}/taf-start.sh > /proc/self/fd/1 2> /proc/self/fd/2 &
    )

    # 等待进程启动完成
    sleep ${STARTUP_WAIT_TIME}
}

# 验证进程启动结果
verify_startup() {
    local count=$(get_process_count)
    log_info "Process count after startup: ${count}"

    if [ ${count} -lt 1 ]; then
        log_error "Process failed to start."
        exit ${START_PROCESS_FAIL}
    fi

    # 记录进程 PID 到配置文件
    local pid=$(get_process_pid)
    echo "${pid}" > "${PID_CONF}"
    log_success "Process started successfully. PID: ${pid}"
}

main() {
    # 1. 清除停止标志，恢复 monitor.sh 的托管进程检查
    clear_stop_flag

    # 2. 单例检查
    check_singleton

    # 3. 检查进程是否已经在运行
    if ! is_process_already_running; then
        exit 0
    fi

    # 4. 启动进程（taf 不需要验证二进制文件，通过 taf-start.sh wrap 启动）
    start_process

    # 5. 验证启动结果
    verify_startup

    exit 0
}

# 执行主函数
main
