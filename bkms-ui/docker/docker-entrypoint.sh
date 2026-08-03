#!/bin/sh
# docker-entrypoint.sh — 容器启动时将运行时环境变量注入 Vite 构建产物
#
# 用法（三选一，可组合，优先级：单个 -e > ENV_FILE）:
#   1. 挂载 .env 文件到默认路径 /env/.env（最简单）:
#        docker run -v /path/to/.env.staging:/env/.env:ro bkms-ui:latest
#
#   2. 自定义 .env 文件路径:
#        docker run -e ENV_FILE=/custom/.env \
#          -v /path/to/.env.staging:/custom/.env:ro bkms-ui:latest
#
#   3. 单个指定:
#        docker run -e BK_API_PREFIX=https://api.example.com \
#          -e BK_LOGIN_URL=https://login.example.com bkms-ui:latest
#
#   4. Docker --env-file (KEY=VALUE 格式，无空格无引号):
#        docker run --env-file .env.docker bkms-ui:latest
#
# 原理: .env.production 中运行时变量构建时写入 __BKMS_RT_BK_XXX__ 占位符，
#        本脚本在 nginx 启动前用实际值替换所有占位符。
set -e

NGINX_HTML=/usr/share/nginx/html
SENTINEL="__BKMS_RT_"
ENV_FILE="${ENV_FILE:-/env/.env}"

log() { echo "[docker-entrypoint] $*"; }

# ----------------------------------------------------------------
# 1. 解析 .env 文件（支持项目格式: KEY = 'value'）
#    默认读取 /env/.env，可通过 ENV_FILE 环境变量覆盖
#    通过 -e 设置的同名变量不会被覆盖
# ----------------------------------------------------------------
if [ -f "$ENV_FILE" ]; then
    log "Loading env from: $ENV_FILE"
    while IFS= read -r line || [ -n "$line" ]; do
      trimmed=$(printf '%s' "$line" | sed 's/^[[:space:]]*//')
      case "$trimmed" in '#'*|'') continue ;; esac
      case "$trimmed" in *=*) ;; *) continue ;; esac

      key=$(printf '%s' "$trimmed" | sed 's/[[:space:]]*=.*//')
      value=$(printf '%s' "$trimmed" | sed "s/^[^=]*=[[:space:]]*//; s/^['\"]//; s/['\"]$//")

      # 校验 key 合法性: 仅允许 [A-Za-z_][A-Za-z0-9_]*
      case "$key" in
        [!A-Za-z_]*|*[!A-Za-z0-9_]*|'')
          log "WARN: skipping invalid env key: $key"
          continue ;;
      esac

      # 用 env/printenv 判断变量是否已存在，避免 eval
      if ! printenv "$key" > /dev/null 2>&1; then
        export "$key=$value"
      fi
    done < "$ENV_FILE"
fi

# ----------------------------------------------------------------
# 2. 自动发现占位符并构建 sed 替换表达式
# ----------------------------------------------------------------
PLACEHOLDERS=$(grep -roh "${SENTINEL}BK_[A-Z_]*__" "$NGINX_HTML" 2>/dev/null | sort -u) || true

if [ -z "$PLACEHOLDERS" ]; then
  log "No runtime placeholders found, starting nginx"
  exec nginx -g 'daemon off;'
fi

SED_EXPR=""
summary=""
for ph in $PLACEHOLDERS; do
  var=$(printf '%s' "$ph" | sed "s/^${SENTINEL}//; s/__$//")
  val=$(printenv "$var" 2>/dev/null || true)
  # 转义 sed 特殊字符（分隔符 |）
  safe=$(printf '%s' "$val" | sed 's/[\\|&]/\\&/g')
  SED_EXPR="${SED_EXPR}s|${ph}|${safe}|g;"
  if [ -n "$val" ]; then
    summary="${summary}  ${var}=${val}\n"
  fi
done

# ----------------------------------------------------------------
# 3. 仅修改包含占位符的文件
# ----------------------------------------------------------------
_file_list=$(mktemp)
grep -rl "${SENTINEL}" "$NGINX_HTML" 2>/dev/null > "$_file_list" || true
replaced=0
while IFS= read -r f; do
  [ -n "$f" ] || continue
  sed -i "$SED_EXPR" "$f"
  replaced=$((replaced + 1))
done < "$_file_list"
rm -f "$_file_list"

if [ -n "$summary" ]; then
  log "Injected runtime env into $replaced file(s):"
  printf '%b' "$summary" | while IFS= read -r l; do log "  $l"; done
else
  log "All runtime vars empty, placeholders cleared in $replaced file(s)"
fi

# ----------------------------------------------------------------
# 4. 启动 Nginx
# ----------------------------------------------------------------
exec nginx -g 'daemon off;'
