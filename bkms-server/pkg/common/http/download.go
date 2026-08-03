package httpresp

import (
	"fmt"
	"net/url"
	"strings"
)

const (
	// AttachmentContentType 附件内容类型
	AttachmentContentType = "application/octet-stream"
)

var dispositionFilenameReplacer = strings.NewReplacer(
	`\`, `\\`,
	`"`, `\"`,
	"\r", "_",
	"\n", "_",
)

// BuildAttachmentDisposition 构建附件响应头
func BuildAttachmentDisposition(filename string) string {
	safeFilename := sanitizeDispositionFilename(filename)
	escapedFilename := url.PathEscape(safeFilename)
	return fmt.Sprintf(`attachment; filename="%s"; filename*=UTF-8''%s`, safeFilename, escapedFilename)
}

func sanitizeDispositionFilename(filename string) string {
	return dispositionFilenameReplacer.Replace(filename)
}
