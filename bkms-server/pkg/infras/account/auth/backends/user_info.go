package backends

import "github.com/pkg/errors"

func parseUserInfo(url string, respData map[string]any) (*UserInfo, error) {
	data, ok := respData["data"].(map[string]any)
	if !ok {
		return nil, errors.Errorf("failed to get user info from %s, response data not json format", url)
	}
	username, ok := data["username"].(string)
	if !ok || username == "" {
		return nil, errors.Errorf("failed to get user info from %s, username not found", url)
	}
	return &UserInfo{ID: username}, nil
}
