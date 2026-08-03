package pipelinevar

const (
	// BuildNum 构建号
	BuildNum = "BK_CI_BUILD_NUM"
	// BuildStartTime 构建开始时间（毫秒时间戳）
	BuildStartTime = "BK_CI_BUILD_START_TIME"
	// BuildEndTime 构建结束时间（毫秒时间戳）
	BuildEndTime = "BK_CI_BUILD_END_TIME"

	// GitRepoURL 代码库地址
	GitRepoURL = "BK_CI_GIT_REPO_URL"
	// GitRepoHeadCommitID 代码库 HEAD Commit ID
	GitRepoHeadCommitID = "BK_CI_GIT_REPO_HEAD_COMMIT_ID"
	// GitRepoHeadCommitAuthor 代码库 HEAD Commit 作者
	GitRepoHeadCommitAuthor = "BK_CI_GIT_REPO_HEAD_COMMIT_COMMITTER"
	// GitRepoHeadCommitMessage 代码库 HEAD Commit 消息
	GitRepoHeadCommitMessage = "BK_CI_GIT_REPO_HEAD_COMMIT_COMMENT"
)

// RequiredVariables 必须参数
var RequiredVariables = []string{
	BuildNum,
	BuildStartTime,
	BuildEndTime,
	GitRepoURL,
	GitRepoHeadCommitID,
	GitRepoHeadCommitAuthor,
	GitRepoHeadCommitMessage,
}
