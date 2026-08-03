// Package httpresp 部分蓝鲸网关后端接口，并没有按标准实现。因此，需要添加对 http code 的读取与判断
package httpresp

import (
	"net/http"
)

// IsSuccess method returns true if HTTP status `code >= 200 and <= 299` otherwise false.
func IsSuccess(r *http.Response) bool {
	if r == nil {
		return false
	}
	return r.StatusCode > 199 && r.StatusCode < 300
}
