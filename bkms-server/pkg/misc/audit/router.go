package audit

import "github.com/gin-gonic/gin"

// Handler contains views required by operation audit Gin routes.
type Handler interface {
	ListOperationRecords(c *gin.Context)
	ListOperationRecordFilterOptions(c *gin.Context)
}

// Register registers Gin operation audit routes.
func Register(rg *gin.RouterGroup, h Handler) {
	rg.GET("/workspaces/:workspaceID/operation-records", h.ListOperationRecords)
	rg.GET("/operation-records/filter-options", h.ListOperationRecordFilterOptions)
}
