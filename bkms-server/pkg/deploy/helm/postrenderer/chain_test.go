package postrenderer

import (
	"bytes"
	"fmt"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"helm.sh/helm/v3/pkg/postrender"
)

// mockPostRenderer 用于测试的 mock PostRenderer
type mockPostRenderer struct {
	suffix string
	err    error
}

func (m *mockPostRenderer) Run(renderedManifests *bytes.Buffer) (*bytes.Buffer, error) {
	if m.err != nil {
		return nil, m.err
	}
	return bytes.NewBufferString(renderedManifests.String() + m.suffix), nil
}

var _ postrender.PostRenderer = (*mockPostRenderer)(nil)

var _ = Describe("ChainPostRenderer", func() {
	Describe("NewChainPostRenderer", func() {
		It("should return nil when all renderers are nil", func() {
			chain := NewChainPostRenderer(nil, nil, nil)
			Expect(chain).To(BeNil())
		})

		It("should return nil when no renderers provided", func() {
			chain := NewChainPostRenderer()
			Expect(chain).To(BeNil())
		})

		It("should filter nil renderers and return non-nil chain", func() {
			r := &mockPostRenderer{suffix: "-a"}
			chain := NewChainPostRenderer(nil, r, nil)
			Expect(chain).NotTo(BeNil())
			Expect(chain.renderers).To(HaveLen(1))
		})

		It("should keep all non-nil renderers in order", func() {
			r1 := &mockPostRenderer{suffix: "-a"}
			r2 := &mockPostRenderer{suffix: "-b"}
			chain := NewChainPostRenderer(r1, r2)
			Expect(chain).NotTo(BeNil())
			Expect(chain.renderers).To(HaveLen(2))
		})
	})

	Describe("Run", func() {
		It("should execute renderers in order", func() {
			r1 := &mockPostRenderer{suffix: "-first"}
			r2 := &mockPostRenderer{suffix: "-second"}
			chain := NewChainPostRenderer(r1, r2)

			input := bytes.NewBufferString("base")
			output, err := chain.Run(input)
			Expect(err).NotTo(HaveOccurred())
			Expect(output.String()).To(Equal("base-first-second"))
		})

		It("should stop and return error when a renderer fails", func() {
			r1 := &mockPostRenderer{suffix: "-ok"}
			r2 := &mockPostRenderer{err: fmt.Errorf("render failed")}
			r3 := &mockPostRenderer{suffix: "-never"}
			chain := NewChainPostRenderer(r1, r2, r3)

			input := bytes.NewBufferString("base")
			_, err := chain.Run(input)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("render failed"))
		})

		It("should pass through input when only one renderer", func() {
			r := &mockPostRenderer{suffix: "-only"}
			chain := NewChainPostRenderer(r)

			input := bytes.NewBufferString("data")
			output, err := chain.Run(input)
			Expect(err).NotTo(HaveOccurred())
			Expect(output.String()).To(Equal("data-only"))
		})
	})
})
