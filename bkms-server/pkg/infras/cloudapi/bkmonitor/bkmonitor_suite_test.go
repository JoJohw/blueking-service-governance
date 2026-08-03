package bkmonitor

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestBkmonitorCloudAPI(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Bkmonitor CloudAPI Suite")
}
