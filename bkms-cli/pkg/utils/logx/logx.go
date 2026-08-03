// Package logx 封装 bkms-cli 使用的 slog 全局日志器及日志级别切换工具
package logx

import (
	"log/slog"
	"os"
	"strings"

	"github.com/pkg/errors"
)

var levelVar slog.LevelVar

func init() {
	levelVar.Set(slog.LevelInfo)
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{
		Level: &levelVar,
	})))
}

// SetLevel updates the global slog level.
func SetLevel(level string) error {
	parsed, err := ParseLevel(level)
	if err != nil {
		return err
	}
	levelVar.Set(parsed)
	return nil
}

// ParseLevel parses a user provided log level string.
func ParseLevel(level string) (slog.Level, error) {
	switch strings.ToLower(strings.TrimSpace(level)) {
	case "", "info":
		return slog.LevelInfo, nil
	case "debug":
		return slog.LevelDebug, nil
	case "warn", "warning":
		return slog.LevelWarn, nil
	case "error":
		return slog.LevelError, nil
	default:
		return 0, errors.Errorf("unsupported log level: %s", level)
	}
}
