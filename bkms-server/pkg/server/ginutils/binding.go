package ginutils

import (
	"github.com/gin-gonic/gin"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/bkerrs"
)

// BindJSON binds a JSON request body and converts binding errors to bkms errors.
func BindJSON(c *gin.Context, obj any) error {
	if err := c.ShouldBindJSON(obj); err != nil {
		return bkerrs.Wrap(err, bkerrs.ErrCodeInvalidRequest, "bind json request")
	}
	return nil
}

// BindURI binds URI path parameters and converts binding errors to bkms errors.
func BindURI(c *gin.Context, obj any) error {
	if err := c.ShouldBindUri(obj); err != nil {
		return bkerrs.Wrap(err, bkerrs.ErrCodeInvalidRequest, "bind uri request")
	}
	return nil
}

// BindQuery binds query parameters and converts binding errors to bkms errors.
func BindQuery(c *gin.Context, obj any) error {
	if err := c.ShouldBindQuery(obj); err != nil {
		return bkerrs.Wrap(err, bkerrs.ErrCodeInvalidRequest, "bind query request")
	}
	return nil
}

// BindURIJSON binds both URI path parameters and JSON request body, and converts binding
// errors to bkms errors.
func BindURIJSON(c *gin.Context, uriObj, jsonObj any) error {
	if err := BindURI(c, uriObj); err != nil {
		return err
	}
	if err := BindJSON(c, jsonObj); err != nil {
		return err
	}
	return nil
}

// BindURIQuery binds both URI path parameters and query parameters, and converts binding
// errors to bkms errors.
func BindURIQuery(c *gin.Context, uriObj, queryObj any) error {
	if err := BindURI(c, uriObj); err != nil {
		return err
	}
	if err := BindQuery(c, queryObj); err != nil {
		return err
	}
	return nil
}
