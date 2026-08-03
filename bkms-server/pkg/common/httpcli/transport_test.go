package httpcli

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
)

var _ = Describe("RoundTrip", func() {
	var (
		exporter *tracetest.InMemoryExporter
		tp       *sdktrace.TracerProvider
	)

	BeforeEach(func() {
		exporter = tracetest.NewInMemoryExporter()
		tp = sdktrace.NewTracerProvider(sdktrace.WithSyncer(exporter))
		otel.SetTracerProvider(tp)
		otel.SetTextMapPropagator(propagation.TraceContext{})
	})

	AfterEach(func() {
		_ = tp.Shutdown(context.Background())
	})

	It("should record redacted URL on span with only sensitive query params replaced", func() {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		}))
		defer server.Close()

		ctx, span := tp.Tracer("test").Start(context.Background(), "test-op")

		serverURL, _ := url.Parse(server.URL)
		req, _ := http.NewRequestWithContext(
			ctx,
			http.MethodGet,
			server.URL+"/api/data?token=test-value-1&user=test-value-2&bk_token=test-value-3",
			nil,
		)
		rt := NewTransportWith(http.DefaultTransport)
		resp, err := rt.RoundTrip(req)
		Expect(err).NotTo(HaveOccurred())
		_ = resp.Body.Close()

		span.End()
		_ = tp.ForceFlush(context.Background())

		spans := exporter.GetSpans()
		Expect(spans).NotTo(BeEmpty())

		// 验证 span 中 url.full 属性：敏感参数被脱敏，非敏感参数保持原样
		var found bool
		for _, s := range spans {
			for _, attr := range s.Attributes {
				if string(attr.Key) == "url.full" {
					val := attr.Value.AsString()
					Expect(val).To(ContainSubstring(serverURL.Host + "/api/data"))
					// 敏感参数 token、bk_token 的原始值不应出现
					Expect(val).NotTo(ContainSubstring("test-value-1"))
					Expect(val).NotTo(ContainSubstring("test-value-3"))
					Expect(val).To(ContainSubstring("REDACTED"))
					// 非敏感参数 user 的值应保持原样
					Expect(val).To(ContainSubstring("user=test-value-2"))
					found = true
				}
			}
		}
		Expect(found).To(BeTrue(), "expected url.full attribute on span with sensitive query param values redacted")
	})
})
