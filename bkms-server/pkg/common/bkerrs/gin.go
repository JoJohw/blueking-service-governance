package bkerrs

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel/trace"
)

type unauthenticatedError interface {
	error
	IsUnauthenticated() bool
}

// GinErrorOutput is the standard bkms Gin error response body.
type GinErrorOutput struct {
	Error GinError `json:"error"`
}

// GinError is the standard bkms Gin error object.
type GinError struct {
	Code    ErrCode          `json:"code"`
	Message string           `json:"message"`
	System  string           `json:"system"`
	Module  string           `json:"module"`
	Details []map[string]any `json:"details"`
}

// ErrorHandler renders errors collected on Gin context using bkms API error format.
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) == 0 || c.Writer.Written() {
			return
		}
		WriteError(c, c.Errors.Last().Err)
	}
}

// AbortWithErr records err and stops the current Gin handler chain.
func AbortWithErr(c *gin.Context, err error) {
	_ = c.Error(err)
	c.Abort()
}

// WriteError writes err using the same response shape as the trpc restful error handler.
func WriteError(c *gin.Context, err error) {
	span := trace.SpanFromContext(c.Request.Context())
	if span != nil && span.SpanContext().HasTraceID() {
		c.Header("X-Trace-Id", span.SpanContext().TraceID().String())
	}
	if err == nil {
		return
	}

	var unauthErr unauthenticatedError
	if errors.As(err, &unauthErr) && unauthErr.IsUnauthenticated() {
		err = Wrap(err, ErrCodeUnauthenticated, "get auth user from request failed")
	}

	var bkErr *Error
	if errors.As(err, &bkErr) {
		details := bkErr.Details()
		c.JSON(bkErr.Code().AsHTTPStatusCode(), GinErrorOutput{
			Error: GinError{
				Code:    bkErr.Code(),
				Message: err.Error(),
				System:  SystemName,
				Module:  ModuleName,
				Details: details.AsMaps(),
			},
		})
		return
	}

	c.JSON(http.StatusInternalServerError, GinErrorOutput{
		Error: GinError{
			Code:    ErrCodeInternalError,
			Message: err.Error(),
			System:  SystemName,
			Module:  ModuleName,
		},
	})
}
