package client

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/coder/websocket"
	"github.com/pkg/errors"
)

const (
	// portForwardPingInterval 心跳发送间隔，需小于中间代理的空闲超时（通常 60s）。
	portForwardPingInterval = 25 * time.Second
	// portForwardPingTimeout 等待 pong 响应的超时时间。
	portForwardPingTimeout = 10 * time.Second
)

// portForwardNetConn 包装 websocket.NetConn，提供心跳探测和生命周期管理。
type portForwardNetConn struct {
	net.Conn
	cancel    func()
	wsConn    *websocket.Conn
	done      chan struct{}
	closeOnce sync.Once
	closeErr  error
}

// OpenPortForwardTunnel 打开应用实例端口转发 WebSocket 隧道。
func (c *SvcBasedClient) OpenPortForwardTunnel(
	ctx context.Context,
	appID, envName string,
	opts PortForwardTunnelOptions,
) (io.ReadWriteCloser, error) {
	path := fmt.Sprintf("/bkms/v1/bkms-server/apps/%s/envs/%s/instances/%s/port-forward/connect",
		url.PathEscape(appID), url.PathEscape(envName), url.PathEscape(opts.InstanceID))

	query := url.Values{}
	query.Set("remotePort", strconv.Itoa(opts.RemotePort))
	query.Set("localPort", strconv.Itoa(opts.LocalPort))

	conn, err := c.dialWebSocket(ctx, path, query)
	if err != nil {
		return nil, errors.Wrap(err, "open port-forward tunnel")
	}

	// 使用独立 context 控制连接生命周期，由 Close() 触发取消。
	connCtx, connCancel := context.WithCancel(context.Background())
	tunnelConn := websocket.NetConn(connCtx, conn, websocket.MessageBinary)

	pfc := &portForwardNetConn{
		Conn:   tunnelConn,
		cancel: connCancel,
		wsConn: conn,
		done:   make(chan struct{}),
	}
	// 心跳探测 CLI↔Server 连接存活，超时则主动关闭。
	go pfc.keepAlive(connCtx)
	return pfc, nil
}

// dialWebSocket 拨号建立 WebSocket 连接
func (c *SvcBasedClient) dialWebSocket(
	ctx context.Context,
	path string,
	query url.Values,
) (*websocket.Conn, error) {
	wsURL, err := c.buildWebSocketURL(path, query)
	if err != nil {
		return nil, err
	}

	// 复用 resty client 中已配置的 Authorization header。
	header := http.Header{}
	if auth := c.cli.Header.Get("Authorization"); auth != "" {
		header.Set("Authorization", auth)
	}

	conn, resp, err := websocket.Dial(ctx, wsURL, &websocket.DialOptions{
		HTTPHeader: header,
	})
	if err != nil {
		if resp != nil {
			return nil, errors.Errorf("%s (HTTP %s)", ExtractServerError(resp), resp.Status)
		}
		return nil, errors.Wrap(err, "websocket dial")
	}
	return conn, nil
}

// ExtractServerError 从 HTTP 响应体中提取 Server 端返回的错误信息。
// FIXME: CLI 错误提取应该是公共功能，后续需要给所有 API 请求方法都加上统一的错误解析。
func ExtractServerError(resp *http.Response) string {
	if resp.Body == nil {
		return "server error"
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1024))
	if err != nil || len(body) == 0 {
		return "server error"
	}
	// 尝试解析 bkerrs JSON 格式：{"error":{"message":"..."}}
	var errResp struct {
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if jsonErr := json.Unmarshal(body, &errResp); jsonErr == nil && errResp.Error.Message != "" {
		return errResp.Error.Message
	}
	// fallback：直接返回响应体文本。
	return strings.TrimSpace(string(body))
}

// buildWebSocketURL 构造 ws(s):// 地址
func (c *SvcBasedClient) buildWebSocketURL(path string, query url.Values) (string, error) {
	baseURL := c.cli.BaseURL
	if baseURL == "" {
		return "", errors.New("bkms base url is empty")
	}

	u, err := url.Parse(baseURL)
	if err != nil {
		return "", errors.Wrap(err, "parse bkms base url")
	}

	switch u.Scheme {
	case "http":
		u.Scheme = "ws"
	case "https":
		u.Scheme = "wss"
	case "ws", "wss":
	default:
		return "", errors.Errorf("unsupported bkms base url scheme %q", u.Scheme)
	}

	basePath := strings.TrimRight(u.EscapedPath(), "/")
	escapedPath := basePath + path
	unescaped, err := url.PathUnescape(escapedPath)
	if err != nil {
		return "", errors.Wrap(err, "build websocket path")
	}
	u.Path = unescaped
	u.RawPath = escapedPath

	if query != nil {
		u.RawQuery = query.Encode()
	}
	return u.String(), nil
}

// keepAlive 定期向 Server 发送 ping，检测 CLI↔Server 连接存活。 ping 超时则主动关闭连接。
func (c *portForwardNetConn) keepAlive(ctx context.Context) {
	ticker := time.NewTicker(portForwardPingInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			pingCtx, pingCancel := context.WithTimeout(ctx, portForwardPingTimeout)
			err := c.wsConn.Ping(pingCtx)
			pingCancel()
			if err != nil {
				_ = c.Close()
				return
			}
		case <-c.done:
			return
		case <-ctx.Done():
			return
		}
	}
}

func (c *portForwardNetConn) Close() error {
	c.closeOnce.Do(func() {
		c.cancel()
		close(c.done)
		c.closeErr = c.Conn.Close()
	})
	return c.closeErr
}
