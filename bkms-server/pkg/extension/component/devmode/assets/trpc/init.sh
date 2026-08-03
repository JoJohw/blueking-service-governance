#!/bin/bash


# 遇到错误立即退出
set -e  

# === 日志函数 ===
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $*"
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] $*"
}

log_warn() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $*"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $*"
}

log_fatal() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [FATAL] $*"
    exit 1
}

readonly BKMS_DEV_MODE_PATH="/data/bkms/dev-mode/trpc"
readonly BKMS_DEV_MODE_BIN_PATH="${BKMS_DEV_MODE_PATH}/bin"
readonly BKMS_DEV_MODE_SCRIPTS_PATH="${BKMS_DEV_MODE_PATH}/configmap-scripts"
# 脚本可写副本目录（ConfigMap 挂载目录为只读，需复制后执行）
readonly BKMS_MONITOR_PATH="${BKMS_DEV_MODE_PATH}/scripts"
readonly BKMS_MONITOR_LOGS_PATH="${BKMS_DEV_MODE_PATH}/logs"

# 加载系统环境变量(忽略错误，如：bash: /etc/selfrc: No such file or directory等自定义配置)
source /etc/profile 2>/dev/null || true

# 检测 Linux 发行版
detect_os() {
    log_info "Detecting Linux distribution..."

    # 优先使用 /etc/os-release（systemd 标准）
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_NAME=$ID
        OS_VERSION=$VERSION_ID
        log_success "Detected system: $NAME $VERSION_ID"
    # CentOS/RHEL 旧版本
    elif [ -f /etc/redhat-release ]; then
        if grep -qi "centos" /etc/redhat-release; then
            OS_NAME="centos"
        elif grep -qi "red hat" /etc/redhat-release; then
            OS_NAME="rhel"
        else
            OS_NAME="redhat"
        fi
        OS_VERSION=$(grep -oE '[0-9]+\.[0-9]+' /etc/redhat-release | head -1)
        log_success "Detected system: $OS_NAME $OS_VERSION"
    # Debian 旧版本
    elif [ -f /etc/debian_version ]; then
        OS_NAME="debian"
        OS_VERSION=$(cat /etc/debian_version)
        log_success "Detected system: Debian $OS_VERSION"
    else
        log_fatal "Unable to detect Linux distribution, please install dependencies manually"
    fi

    # 标准化发行版名称
    case "$OS_NAME" in
        ubuntu|debian)
            OS_FAMILY="debian"
            ;;
        tencentos)
            OS_FAMILY="tencentos"
            ;;
        centos|rhel|fedora|rocky|almalinux|openeuler|anolis|tencentos)
            OS_FAMILY="redhat"
            ;;
        opensuse*|sles)
            OS_FAMILY="suse"
            ;;
        alpine)
            OS_FAMILY="alpine"
            ;;
        arch|manjaro)
            OS_FAMILY="arch"
            ;;
        *)
            log_warn "Unknown distribution: $OS_NAME, trying generic method"
            OS_FAMILY="unknown"
            ;;
    esac

    log_info "Distribution family: $OS_FAMILY"
}

# === 检查命令是否存在 ===
check_command() {
    local cmd=$1
    if command -v "$cmd" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# === 检查所有依赖命令 ===
check_dependencies() {
    log_info "Checking dependency commands..."

    local missing_commands=()
    local required_commands=(
        # 文件锁
        "flock"
        # 文本处理
        "awk"
        # 进程查看
        "ps"
        # 后台运行
        "nohup"
        # 环境变量替换
        "envsubst" 
        # 输出重定向
        "tee"
        # 文本搜索
        "grep"
        # 统计
        "wc"
        # 文件查找
        "find"
        # 查看文件尾部
        "tail"
        # 查看文件头部
        "head"
        # 排序
        "sort"
        # 切割
        "cut"
        # MD5 校验
        "md5sum"
    )

    for cmd in "${required_commands[@]}"; do
        if ! check_command "$cmd"; then
            missing_commands+=("$cmd")
            log_warn "Missing command: $cmd"
        fi
    done

    # 可选命令（不影响核心功能）
    local optional_commands=("bc" "numfmt")
    for cmd in "${optional_commands[@]}"; do
        if ! check_command "$cmd"; then
            log_info "Optional command missing: $cmd (does not affect core functionality)"
        fi
    done

    if [ ${#missing_commands[@]} -eq 0 ]; then
        log_success "All required commands are installed"
        return 0
    else
        log_warn "Missing ${#missing_commands[@]} required commands: ${missing_commands[*]}"
        return 1
    fi
}

# === 安装依赖包 ===
install_dependencies() {
    log_info "Starting to install dependency packages..."

    case "$OS_FAMILY" in
        debian)
            log_info "Using apt to install dependencies..."

            # 更新包索引
            log_info "Updating package index..."
            apt-get update -qq || log_warn "apt-get update failed, continuing to try installation"

            # 安装依赖包
            local packages=(
                "util-linux"
                "gawk"
                "procps"
                "coreutils"
                "gettext-base"
                "grep"
                "findutils"
                "bc"
            )

            log_info "Installing packages: ${packages[*]}"
            DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${packages[@]}" || {
                log_error "apt-get install failed"
                return 1
            }

            log_success "Debian/Ubuntu dependencies installation completed"
            ;;

        redhat|tencentos)
            log_info "Using yum/dnf to install dependencies..."

            # 检测使用 yum 还是 dnf
            local pkg_manager="yum"
            if check_command "dnf"; then
                pkg_manager="dnf"
            fi

            log_info "Using package manager: $pkg_manager"

            # 安装依赖包
            local packages=(
                "util-linux"
                "gawk"
                "procps-ng"
                "coreutils"
                "gettext"
                "grep"
                "findutils"
                "bc"
            )

            log_info "Installing packages: ${packages[*]}"
            $pkg_manager install -y -q "${packages[@]}" || {
                log_error "$pkg_manager install failed"
                return 1
            }

            log_success "RHEL/CentOS dependencies installation completed"
            ;;

        suse)
            log_info "Using zypper to install dependencies..."

            local packages=(
                "util-linux"
                "gawk"
                "procps"
                "coreutils"
                "gettext-runtime"
                "grep"
                "findutils"
                "bc"
            )

            log_info "Installing packages: ${packages[*]}"
            zypper install -y "${packages[@]}" || {
                log_error "zypper install failed"
                return 1
            }

            log_success "SUSE dependencies installation completed"
            ;;

        alpine)
            log_info "Using apk to install dependencies..."

            # 更新包索引
            apk update || log_warn "apk update failed, continuing to try installation"

            local packages=(
                "util-linux"
                "gawk"
                "procps"
                "coreutils"
                "gettext"
                "grep"
                "findutils"
                "bc"
            )

            log_info "Installing packages: ${packages[*]}"
            apk add "${packages[@]}" || {
                log_error "apk add failed"
                return 1
            }

            log_success "Alpine dependencies installation completed"
            ;;

        arch)
            log_info "Using pacman to install dependencies..."

            local packages=(
                "util-linux"
                "gawk"
                "procps-ng"
                "coreutils"
                "gettext"
                "grep"
                "findutils"
                "bc"
            )

            log_info "Installing packages: ${packages[*]}"
            pacman -Sy --noconfirm "${packages[@]}" || {
                log_error "pacman install failed"
                return 1
            }

            log_success "Arch dependencies installation completed"
            ;;

        *)
            log_error "Unsupported distribution family: $OS_FAMILY"
            log_error "Please manually install the following commands: flock, awk, ps, nohup, envsubst, tee, grep, wc, find"
            return 1
            ;;
    esac

    return 0
}

# === 验证安装结果 ===
verify_installation() {
    log_info "Verifying dependency installation..."

    if check_dependencies; then
        log_success "All dependencies verified successfully"
        return 0
    else
        log_error "Dependency verification failed, some commands are still missing"
        return 1
    fi
}

# === 主逻辑 ===
main() {
    log_info "=========================================="
    log_info "BKMS Dev Mode Initialization"
    log_info "=========================================="

    if [ -z "${BKMS_APP_NAME}" ]; then
        log_fatal "BKMS_APP_NAME is empty"
    fi

    # 检测操作系统
    detect_os

    # 检查依赖
    if ! check_dependencies; then
        log_warn "Detected missing dependency commands"

        # 检查是否有 root 权限
        if [ "$EUID" -ne 0 ]; then
            log_error "Root permission required to install dependency packages"
            log_error "Please run this script with sudo: sudo bash $0"
            exit 1
        fi

        # 安装依赖
        if ! install_dependencies; then
            log_fatal "Dependency installation failed, please install manually"
        fi

        # 验证安装
        if ! verify_installation; then
            log_fatal "Dependency verification failed"
        fi
    fi

    # 创建必要目录
    mkdir -p "${BKMS_MONITOR_PATH}/" || log_fatal "Failed to create directory ${BKMS_MONITOR_PATH}/"
    mkdir -p "${BKMS_DEV_MODE_BIN_PATH}/" || log_fatal "Failed to create directory ${BKMS_DEV_MODE_BIN_PATH}/"
    mkdir -p "${BKMS_MONITOR_LOGS_PATH}/" || log_fatal "Failed to create directory ${BKMS_MONITOR_LOGS_PATH}/"

    # 复制脚本到可写目录
    log_info "Copying scripts to ${BKMS_MONITOR_PATH}/"
    if [ -d "${BKMS_DEV_MODE_SCRIPTS_PATH}" ]; then
        cp ${BKMS_DEV_MODE_SCRIPTS_PATH}/*.sh "${BKMS_MONITOR_PATH}/" || log_fatal "Failed to copy scripts"
        chmod +x "${BKMS_MONITOR_PATH}"/*.sh || log_warn "Failed to set script execution permissions"
        log_success "Scripts copied successfully"
    else
        log_fatal "Source script directory ${BKMS_DEV_MODE_SCRIPTS_PATH} does not exist"
    fi

    # 显示环境信息
    log_info "=========================================="
    log_info "Environment Information:"
    log_info "  Operating System: ${OS_NAME} ${OS_VERSION}"
    log_info "  Distribution Family: ${OS_FAMILY}"
    log_info "  Monitoring Path: ${BKMS_MONITOR_PATH}"
    log_info "=========================================="

    # 启动 monitor 守护进程
    log_info "Starting monitor..."
    if [ -f "${BKMS_MONITOR_PATH}/monitor.sh" ]; then
        exec bash "${BKMS_MONITOR_PATH}/monitor.sh"
    else
        log_fatal "Monitoring script does not exist: ${BKMS_MONITOR_PATH}/monitor.sh"
    fi
}

# 执行主函数
main "$@"
