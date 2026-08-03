#!/bin/bash
# restart.sh - 二进制热更新：MD5 校验 → 替换二进制 → SIGUSR2 重启
# 用法: restart.sh <random_name> <md5>

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/utils.sh"

readonly LOG_FILE="${BKMS_MONITOR_LOGS_PATH}/restart.log"
readonly MD5_MISMATCH=20001
readonly FILE_NOT_FOUND=20002
readonly PID_NOT_FOUND=20003
readonly RESTART_FAILED=20004
readonly PROCESS_START_FAILED=20005
readonly RESTART_WAIT_TIME=5
readonly VERIFY_RETRY_COUNT=30
readonly VERIFY_WAIT_INTERVAL=1
readonly OLD_PROCESS_EXIT_TIMEOUT=30

# 覆盖日志函数：同时输出到文件和 stdout
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # 同时输出到日志文件和标准输出
    echo "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE}"
}

# 计算文件的 MD5 值
# 参数: $1=文件路径
# 返回: MD5 值（stdout）
calculate_md5() {
    local file_path=$1
    
    if [ ! -f "${file_path}" ]; then
        return 1
    fi
    
    # 兼容不同系统
    if command -v md5sum >/dev/null 2>&1; then
        md5sum "${file_path}" | awk '{print $1}'
    elif command -v md5 >/dev/null 2>&1; then
        md5 -q "${file_path}"
    else
        log_error "No md5 command found"
        return 1
    fi
}

# 校验文件 MD5
# 参数: $1=文件路径, $2=期望的 MD5 值
# 返回: 0=匹配, 1=不匹配
verify_md5() {
    local file_path=$1
    local expected_md5=$2
    
    local actual_md5=$(calculate_md5 "${file_path}")
    
    if [ "${actual_md5}" = "${expected_md5}" ]; then
        log_info "MD5 verification passed: ${actual_md5}"
        return 0
    else
        log_error "MD5 mismatch: expected=${expected_md5}, actual=${actual_md5}"
        return 1
    fi
}

# 清理旧的应用二进制
cleanup_old_binary() {
    local old_binary="${TRPC_BIN_PATH}/${SERVER_NAME}"
    
    if [ -f "${old_binary}" ]; then
        log_info "Removing old binary: ${old_binary}"
        rm -f "${old_binary}"
        if [ $? -eq 0 ]; then
            log_success "Old binary removed successfully"
        else
            log_warn "Failed to remove old binary, continuing anyway"
        fi
    else
        log_info "No old binary found at ${old_binary}"
    fi
}

# 移动新的二进制到目标路径
# 参数: $1=随机名称
move_new_binary() {
    local random_name=$1
    local source_file="${BKMS_DEV_MODE_BIN_PATH}/${random_name}"
    local target_file="${TRPC_BIN_PATH}/${SERVER_NAME}"
    
    # 确保目标目录存在
    mkdir -p "${TRPC_BIN_PATH}"
    
    log_info "Moving binary from ${source_file} to ${target_file}"
    mv "${source_file}" "${target_file}"
    
    if [ $? -ne 0 ]; then
        log_error "Failed to move binary"
        return 1
    fi
    
    # 设置可执行权限
    chmod +x "${target_file}"
    
    log_success "Binary moved successfully"
    return 0
}

# 发送 SIGUSR2 信号进行优雅重启
# 参数: $1=进程 PID
send_restart_signal() {
    local pid=$1
    
    if [ -z "${pid}" ]; then
        log_error "No PID provided for restart"
        return 1
    fi
    
    if ! is_process_running "${pid}"; then
        log_warn "Process ${pid} is not running, will start new process"
        return 1
    fi
    
    log_info "Sending SIGUSR2 (kill -12) to process ${pid}"
    kill -12 "${pid}"
    
    if [ $? -eq 0 ]; then
        log_success "SIGUSR2 signal sent successfully"
        return 0
    else
        log_error "Failed to send SIGUSR2 signal"
        return 1
    fi
}

# 等待旧进程退出
# 参数: $1=旧进程PID, $2=超时时间（秒）
# 返回: 0=已退出, 1=超时未退出
wait_old_process_exit() {
    local old_pid=$1
    local timeout=${2:-${OLD_PROCESS_EXIT_TIMEOUT}}
    
    if [ -z "${old_pid}" ]; then
        log_info "No old process PID provided, skipping wait"
        return 0
    fi
    
    log_info "Waiting for old process (PID: ${old_pid}) to exit..."
    
    for ((i=1; i<=${timeout}; i++)); do
        if ! is_process_running "${old_pid}"; then
            log_success "Old process (PID: ${old_pid}) has exited after ${i}s"
            return 0
        fi
        
        # 检查是否有新进程已经启动（子进程）
        local current_pids=$(ps -ef | grep -i ${TRPC_BIN_PATH}/${SERVER_NAME} | grep -v ' grep ' | awk '{print $2}')
        local pid_count=$(echo "${current_pids}" | wc -w)
        
        if [ ${pid_count} -ge 2 ]; then
            log_info "Detected ${pid_count} processes running, waiting for old process to exit... (${i}/${timeout}s)"
        else
            log_info "Waiting for old process to exit... (${i}/${timeout}s)"
        fi
        
        sleep 1
    done
    
    log_warn "Old process (PID: ${old_pid}) did not exit within ${timeout}s, will try to force kill"
    
    # 超时后尝试 SIGTERM → SIGKILL
    log_info "Sending SIGTERM to old process ${old_pid}"
    kill -15 "${old_pid}" 2>/dev/null
    sleep 3
    
    if ! is_process_running "${old_pid}"; then
        log_success "Old process exited after SIGTERM"
        return 0
    fi
    
    # 最后尝试 SIGKILL
    log_warn "Sending SIGKILL to old process ${old_pid}"
    kill -9 "${old_pid}" 2>/dev/null
    sleep 1
    
    if ! is_process_running "${old_pid}"; then
        log_success "Old process killed with SIGKILL"
        return 0
    fi
    
    log_error "Failed to kill old process ${old_pid}"
    return 1
}

# 验证新进程已启动
# 参数: $1=旧进程 PID（可选，用于排除）
verify_process_started() {
    local old_pid=$1
    
    log_info "Verifying new process has started..."
    
    for ((i=1; i<=${VERIFY_RETRY_COUNT}; i++)); do
        sleep ${VERIFY_WAIT_INTERVAL}
        
        local count=$(get_process_count)
        log_info "Attempt ${i}/${VERIFY_RETRY_COUNT}: Process count = ${count}"
        
        if [ ${count} -ge 1 ]; then
            # 获取所有运行中的进程 PID
            local all_pids=$(ps -ef | grep -i ${TRPC_BIN_PATH}/${SERVER_NAME} | grep -v ' grep ' | awk '{print $2}')
            local new_pid=""
            
            # 如果有旧 PID，排除它找到新 PID
            if [ -n "${old_pid}" ]; then
                for pid in ${all_pids}; do
                    if [ "${pid}" != "${old_pid}" ]; then
                        new_pid=${pid}
                        break
                    fi
                done
                
                # 如果没有找到不同的PID，但旧进程已退出，使用当前存在的PID
                if [ -z "${new_pid}" ] && ! is_process_running "${old_pid}"; then
                    new_pid=$(echo "${all_pids}" | head -n 1)
                fi
            else
                new_pid=$(echo "${all_pids}" | head -n 1)
            fi
            
            if [ -n "${new_pid}" ]; then
                log_success "New process started successfully. PID: ${new_pid}"
                
                # 更新 PID 配置文件
                echo "${new_pid}" > "${PID_CONF}"
                return 0
            fi
        fi
    done
    
    log_error "Process failed to start after ${VERIFY_RETRY_COUNT} attempts"
    return 1
}

main() {
    log_info "=========================================="
    log_info "Restart script started"
    log_info "=========================================="
    
    # 解析参数
    local random_name=$1
    local expected_md5=$2
    
    # 参数校验
    if [ -z "${random_name}" ]; then
        log_fatal "Missing parameter: random_name"
    fi
    
    if [ -z "${expected_md5}" ]; then
        log_fatal "Missing parameter: expected_md5"
    fi
    
    # 获取实际二进制文件名
    get_actual_server_name
    
    # 环境变量校验
    if [ -z "${SERVER_NAME}" ]; then
        log_fatal "BKMS_APP_NAME environment variable is not set"
    fi
    
    if [ -z "${TRPC_BIN_PATH}" ]; then
        log_fatal "TRPC_BIN_PATH is empty."
    fi
    
    
    # 创建停止标志，通知 monitor.sh 暂停托管进程检查
    create_stop_flag
    
    log_info "Parameters:"
    log_info "  Random name: ${random_name}"
    log_info "  Expected MD5: ${expected_md5}"
    log_info "  Server name: ${SERVER_NAME}"
    log_info "  TRPC path: ${TRPC_BIN_PATH}"
    
    # 1. 检查上传文件
    local uploaded_file="${BKMS_DEV_MODE_BIN_PATH}/${random_name}"
    if [ ! -f "${uploaded_file}" ]; then
        clear_stop_flag
        log_fatal "Uploaded file not found: ${uploaded_file}"
        exit ${FILE_NOT_FOUND}
    fi
    log_info "Uploaded file found: ${uploaded_file}"
    
    # 2. MD5 校验
    if ! verify_md5 "${uploaded_file}" "${expected_md5}"; then
        clear_stop_flag
        log_fatal "MD5 verification failed"
        exit ${MD5_MISMATCH}
    fi
    
    # 3. 获取当前 PID
    local current_pid=$(get_recorded_pid)
    if [ -z "${current_pid}" ]; then
        current_pid=$(get_process_pid)
    fi
    log_info "Current process PID: ${current_pid:-none}"
    
    # 4. 替换二进制
    cleanup_old_binary
    
    # 5. 移动新二进制
    if ! move_new_binary "${random_name}"; then
        clear_stop_flag
        log_fatal "Failed to move new binary"
        exit ${RESTART_FAILED}
    fi
    
    # 6. 发送 SIGUSR2 或启动新进程
    local restart_success=false
    local old_pid_to_wait=""
    
    if [ -n "${current_pid}" ] && is_process_running "${current_pid}"; then
        # 进程存在，尝试发送 SIGUSR2 信号
        if send_restart_signal "${current_pid}"; then
            old_pid_to_wait="${current_pid}"
            sleep ${RESTART_WAIT_TIME}
            
            # 等待旧进程退出
            if wait_old_process_exit "${current_pid}"; then
                restart_success=true
            else
                log_warn "Old process did not exit gracefully, but continuing..."
                restart_success=true
            fi
        fi
    fi
    
    # 如果 SIGUSR2 失败或进程不存在，清除停止标志，让 monitor.sh 自动拉起进程
    if [ "${restart_success}" = false ]; then
        log_info "SIGUSR2 approach failed or process not running, clearing stop flag for monitor to auto-start..."
        old_pid_to_wait=""
    fi
    
    # 清除停止标志
    clear_stop_flag
    
    # 7. 验证新进程
    if ! verify_process_started "${old_pid_to_wait}"; then
        log_fatal "Failed to verify new process started, but clearing stop flag for monitor to auto-start..."
        exit ${PROCESS_START_FAILED}
    fi    
    
    log_info "=========================================="
    log_success "Restart completed successfully!"
    log_info "=========================================="
    
    exit 0
}

# 执行主函数
main "$@"
