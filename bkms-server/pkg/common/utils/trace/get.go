// Package trace 从 context 中拿到 otel 注入的 trace-id
package trace

import (
	"context"

	"go.opentelemetry.io/otel/trace"
)

// GetTraceID 从context中拿到otel注入的trace-id
func GetTraceID(c context.Context) string {
	span := trace.SpanFromContext(c)
	if span == nil {
		return ""
	}
	if !span.SpanContext().HasTraceID() {
		return ""
	}

	return span.SpanContext().TraceID().String()
}

// GetSpanID 从context中拿到otel注入的span-id
func GetSpanID(c context.Context) string {
	span := trace.SpanFromContext(c)
	if span == nil {
		return ""
	}
	if !span.SpanContext().HasSpanID() {
		return ""
	}

	return span.SpanContext().SpanID().String()
}
