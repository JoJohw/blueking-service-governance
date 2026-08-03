package autodeploy

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// Stage 表示一键构建部署当前所处阶段
type Stage string

const (
	// StageBuild 表示当前处于构建阶段。
	StageBuild Stage = "build"
	// StageDeploy 表示当前处于部署阶段。
	StageDeploy Stage = "deploy"
)

// Record 表示一次 build auto deploy 执行记录
type Record struct {
	ID bson.ObjectID `bson:"_id,omitempty"`

	WorkspaceID     string `bson:"workspaceID"`
	AppID           string `bson:"appID"`
	AppType         string `bson:"appType"`
	EnvName         string `bson:"envName"`
	TrafficLaneName string `bson:"trafficLaneName"`

	BuildID    string `bson:"buildID"`
	DeployID   string `bson:"deployID,omitempty"`
	Branch     string `bson:"branch,omitempty"`
	ImageTag   string `bson:"imageTag,omitempty"`
	PipelineID string `bson:"pipelineID,omitempty"`

	Stage   Stage  `bson:"stage"`
	Status  string `bson:"status"`
	Message string `bson:"message"`

	Operator string `bson:"operator"`

	StartedAt time.Time `bson:"startedAt"`
	EndedAt   time.Time `bson:"endedAt"`
	CreatedAt time.Time `bson:"createdAt"`
	UpdatedAt time.Time `bson:"updatedAt"`
}
