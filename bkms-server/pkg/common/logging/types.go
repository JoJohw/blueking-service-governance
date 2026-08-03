package logging

const (
	defaultLevel       = "info"
	defaultHandlerName = "json"
	defaultWriterName  = "stdout"

	// HandlerText 表示文本格式日志处理器。
	HandlerText = "text"
	// HandlerJSON 表示 JSON 格式日志处理器。
	HandlerJSON = "json"

	// WriterStdout 表示日志输出到标准输出。
	WriterStdout = "stdout"
	// WriterStderr 表示日志输出到标准错误。
	WriterStderr = "stderr"
	// WriterFile 表示日志输出到本地文件。
	WriterFile = "file"

	// FieldTraceID 表示链路追踪 trace ID 字段名。
	FieldTraceID = "trace_id"
	// FieldSpanID 表示链路追踪 span ID 字段名。
	FieldSpanID = "span_id"
)
