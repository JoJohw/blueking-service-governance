#!/usr/bin/env bash

# Best-effort adapter for Docker Kind kubeconfigs whose apiserver is exposed on
# host loopback. Successful prepare calls print four tab-separated fields:
# kubeconfig path, Docker network, original server, and control-plane name.

set -uo pipefail

runtime_dir="${XDG_RUNTIME_DIR:-${TMPDIR:-/tmp}}/bkms-apitest-${UID}"
runtime_kubeconfig="${runtime_dir}/kind-loopback-kubeconfig"

warn() {
    echo "WARN: $*; skipping Kind loopback adapter" >&2
}

clean() {
    rm -f "${runtime_kubeconfig}" "${runtime_kubeconfig}.tmp"
    rmdir "${runtime_dir}" 2>/dev/null || true
}

prepare() {
    local source_kubeconfig="$1"
    local kube_server server_authority server_host current_context
    local kind_cluster control_plane network_format control_plane_networks
    local kind_network network current_cluster

    if ! command -v kubectl >/dev/null 2>&1; then
        warn "kubectl is unavailable"
        return
    fi

    kube_server="$(
        kubectl --kubeconfig="${source_kubeconfig}" config view --minify --raw \
            -o jsonpath='{.clusters[0].cluster.server}' 2>/dev/null
    )" || {
        warn "cannot read the current apiserver from the kubeconfig"
        return
    }
    server_authority="${kube_server#*://}"
    server_host="${server_authority%%:*}"
    if [ "${server_host}" != "127.0.0.1" ] && [ "${server_host}" != "localhost" ]; then
        return
    fi

    current_context="$(
        kubectl --kubeconfig="${source_kubeconfig}" config current-context 2>/dev/null
    )" || true
    if [[ "${current_context}" != kind-* ]]; then
        warn "loopback apiserver uses non-standard context '${current_context}'"
        return
    fi
    if ! command -v docker >/dev/null 2>&1; then
        warn "docker is unavailable"
        return
    fi

    kind_cluster="${current_context#kind-}"
    control_plane="${kind_cluster}-control-plane"
    network_format='{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}'
    control_plane_networks="$(
        docker inspect "${control_plane}" --format "${network_format}" 2>/dev/null
    )" || {
        warn "cannot inspect Kind control-plane '${control_plane}'"
        return
    }

    kind_network=""
    while IFS= read -r network; do
        [ -n "${network}" ] || continue
        if [ -z "${kind_network}" ] || [ "${network}" = "kind" ]; then
            kind_network="${network}"
        fi
    done <<< "${control_plane_networks}"
    if [ -z "${kind_network}" ] || ! docker network inspect "${kind_network}" >/dev/null 2>&1; then
        warn "cannot find the Docker network of '${control_plane}'"
        return
    fi

    umask 077
    if ! mkdir -p "${runtime_dir}" ||
        ! chmod 700 "${runtime_dir}" ||
        ! cp "${source_kubeconfig}" "${runtime_kubeconfig}.tmp" ||
        ! chmod 600 "${runtime_kubeconfig}.tmp" ||
        ! mv "${runtime_kubeconfig}.tmp" "${runtime_kubeconfig}"; then
        clean
        warn "cannot create the temporary kubeconfig"
        return
    fi

    current_cluster="$(
        kubectl --kubeconfig="${runtime_kubeconfig}" config view --minify \
            -o jsonpath='{.contexts[0].context.cluster}' 2>/dev/null
    )" || true
    if [ -z "${current_cluster}" ] ||
        ! kubectl --kubeconfig="${runtime_kubeconfig}" config set-cluster \
            "${current_cluster}" --server="https://${control_plane}:6443" >/dev/null; then
        clean
        warn "cannot rewrite the temporary kubeconfig"
        return
    fi

    printf '%s\t%s\t%s\t%s\n' \
        "${runtime_kubeconfig}" "${kind_network}" "${kube_server}" "${control_plane}"
}

case "${1:-}" in
prepare)
    if [ "$#" -ne 2 ]; then
        echo "usage: $0 prepare <kubeconfig>" >&2
        exit 2
    fi
    prepare "$2"
    ;;
clean)
    clean
    ;;
*)
    echo "usage: $0 {prepare <kubeconfig>|clean}" >&2
    exit 2
    ;;
esac
