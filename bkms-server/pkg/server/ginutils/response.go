package ginutils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// JSON writes JSON response data.
func JSON(c *gin.Context, status int, obj any) {
	if obj == nil {
		c.Status(status)
		return
	}
	c.JSON(status, obj)
}

// OK writes a 200 JSON response.
func OK(c *gin.Context, obj any) {
	JSON(c, http.StatusOK, obj)
}

// Created writes a 201 JSON response.
func Created(c *gin.Context, obj any) {
	JSON(c, http.StatusCreated, obj)
}

// NoContent writes a 204 No Content response with no body.
func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}
