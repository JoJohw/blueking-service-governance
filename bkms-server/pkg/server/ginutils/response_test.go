package ginutils_test

import (
	"net/http"
	"net/http/httptest"

	"github.com/gin-gonic/gin"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/ginutils"
)

type jsonResponse struct {
	Name        string `json:"name"`
	Enabled     bool   `json:"enabled"`
	Description string `json:"description"`
}

var _ = Describe("JSON", func() {
	BeforeEach(func() {
		gin.SetMode(gin.TestMode)
	})

	It("should render JSON response with zero values from struct tags", func() {
		router := gin.New()
		router.GET("/json", func(c *gin.Context) {
			ginutils.OK(c, jsonResponse{Name: "test"})
		})

		req := httptest.NewRequest(http.MethodGet, "/json", nil)
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		Expect(rec.Code).To(Equal(http.StatusOK))
		Expect(rec.Body.String()).To(MatchJSON(`{
			"name": "test",
			"enabled": false,
			"description": ""
		}`))
	})
})
