package portforward

import (
	"context"
	"errors"
	"io"
	"net"
	"reflect"
	"strconv"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("Service", func() {
	It("uses direct TCP stream opener by default", func() {
		svc := NewService(nil)

		Expect(reflect.ValueOf(svc.streamOpener).Pointer()).To(Equal(
			reflect.ValueOf(DefaultStreamOpener).Pointer(),
		))
	})
})

var _ = Describe("DefaultStreamOpener", func() {
	It("configures direct TCP dial timeout and keepalive", func() {
		Expect(defaultTargetDialer.Timeout).To(Equal(5 * time.Second))
		Expect(defaultTargetDialer.KeepAlive).To(Equal(30 * time.Second))
	})

	It("opens a direct TCP connection to the resolved pod IP and remote port", func() {
		listener, err := net.Listen("tcp", "127.0.0.1:0")
		Expect(err).NotTo(HaveOccurred())
		defer listener.Close()

		accepted := make(chan net.Conn, 1)
		go func() {
			conn, acceptErr := listener.Accept()
			Expect(acceptErr).NotTo(HaveOccurred())
			accepted <- conn
		}()

		_, port, err := net.SplitHostPort(listener.Addr().String())
		Expect(err).NotTo(HaveOccurred())
		remotePort, err := parsePortForTest(port)
		Expect(err).NotTo(HaveOccurred())

		stream, err := DefaultStreamOpener(context.Background(), Target{PodIP: "127.0.0.1", RemotePort: remotePort})
		Expect(err).NotTo(HaveOccurred())
		defer stream.Close()

		serverConn := <-accepted
		defer serverConn.Close()

		_, err = stream.Write([]byte("ping"))
		Expect(err).NotTo(HaveOccurred())
		buf := make([]byte, 4)
		_, err = io.ReadFull(serverConn, buf)
		Expect(err).NotTo(HaveOccurred())
		Expect(string(buf)).To(Equal("ping"))
	})
})

var _ = Describe("classifyTargetOpenError", func() {
	DescribeTable(
		"returns sanitized reason",
		func(err error, expected string) {
			Expect(classifyTargetOpenError(err)).To(Equal(expected))
		},
		Entry("nil", nil, "none"),
		Entry("context canceled", context.Canceled, "context_canceled"),
		Entry("timeout", context.DeadlineExceeded, "timeout"),
		Entry("connection refused", errors.New("dial tcp 127.0.0.1:5432: connection refused"), "connection_refused"),
		Entry(
			"network unreachable",
			errors.New("dial tcp 127.0.0.1:5432: network is unreachable"),
			"network_unreachable",
		),
		Entry("other", errors.New("unexpected dial error"), "error"),
	)
})

func parsePortForTest(port string) (int32, error) {
	parsed, err := strconv.ParseInt(port, 10, 32)
	if err != nil {
		return 0, err
	}
	return int32(parsed), nil
}
