package client

// LogEntry 单行日志
type LogEntry struct {
	// Timestamp 时间戳，格式如：2025-11-10T09:14:42.249533428Z
	Timestamp string
	// Content 日志内容
	Content string
}
